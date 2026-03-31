import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const repoRoot = process.cwd();
const configPath = path.join(repoRoot, 'CONFIG.md');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createAppsScriptSandbox() {
  const fakeRange = {
    getDisplayValues() {
      return [['Header']];
    },
    getValues() {
      return [['Header']];
    },
    getA1Notation() {
      return 'A1';
    },
    getNumRows() {
      return 1;
    },
    getNumColumns() {
      return 1;
    }
  };

  const fakeSheet = {
    getSheetId() {
      return 1;
    },
    getName() {
      return 'Sheet1';
    },
    getLastColumn() {
      return 1;
    },
    getLastRow() {
      return 1;
    },
    getMaxColumns() {
      return 26;
    },
    getRange() {
      return fakeRange;
    },
    getDataRange() {
      return fakeRange;
    },
    insertColumnBefore() {},
    deleteColumn() {}
  };

  const fakeSpreadsheet = {
    getId() {
      return 'spreadsheet-id';
    },
    getActiveSheet() {
      return fakeSheet;
    },
    getActiveRangeList() {
      return null;
    }
  };

  return {
    console,
    SpreadsheetApp: {
      getUi() {
        return {};
      },
      getActiveSpreadsheet() {
        return fakeSpreadsheet;
      }
    },
    HtmlService: {
      createHtmlOutput(str) {
        return {
          getContent() {
            return str;
          }
        };
      }
    },
    PropertiesService: {
      getDocumentProperties() {
        return {
          getProperty() {
            return null;
          },
          setProperty() {},
          deleteProperty() {}
        };
      }
    },
    Utilities: {
      formatDate() {
        return '';
      },
      getUuid() {
        return 'uuid';
      }
    },
    UrlFetchApp: {
      fetch() {
        throw new Error('UrlFetchApp.fetch is disabled in tests');
      }
    },
    Logger: {
      log() {}
    },
    ScriptApp: {},
    ContentService: {},
    JSON,
    Math,
    Date,
    Object,
    Array,
    String,
    Number,
    RegExp,
    Error
  };
}

function createClassList() {
  const values = new Set();
  return {
    add(...tokens) {
      tokens.forEach(token => values.add(token));
    },
    remove(...tokens) {
      tokens.forEach(token => values.delete(token));
    },
    toggle(token, force) {
      if (typeof force === 'boolean') {
        if (force) values.add(token);
        else values.delete(token);
        return force;
      }
      if (values.has(token)) {
        values.delete(token);
        return false;
      }
      values.add(token);
      return true;
    },
    contains(token) {
      return values.has(token);
    }
  };
}

function createFakeNode() {
  return {
    style: {},
    dataset: {},
    children: [],
    innerHTML: '',
    textContent: '',
    value: '',
    disabled: false,
    classList: createClassList(),
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    addEventListener() {},
    remove() {},
    focus() {},
    scrollTo() {},
    select() {},
    contains() {
      return false;
    },
    setAttribute() {},
    removeAttribute() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };
}

function extractRenderedClientScript(html) {
  const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert(scriptMatches.length > 0, 'No inline <script> block found in rendered HTML');
  return scriptMatches[scriptMatches.length - 1][1];
}

function createBrowserSandbox(queryMap = {}) {
  const nodes = new Map();

  const document = {
    readyState: 'loading',
    body: createFakeNode(),
    getElementById(id) {
      if (!nodes.has(id)) {
        nodes.set(id, createFakeNode());
      }
      return nodes.get(id);
    },
    querySelector(selector) {
      return queryMap[selector] || null;
    },
    querySelectorAll() {
      return [];
    },
    createElement() {
      return createFakeNode();
    },
    addEventListener() {}
  };

  const runner = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'withSuccessHandler' || prop === 'withFailureHandler') {
          return () => runner;
        }
        return () => runner;
      }
    }
  );

  const sandbox = {
    console,
    alert() {},
    document,
    navigator: {
      clipboard: {
        writeText() {
          return Promise.resolve();
        }
      }
    },
    indexedDB: {
      open() {
        return {
          onupgradeneeded: null,
          onsuccess: null,
          onerror: null
        };
      }
    },
    google: {
      script: {
        run: runner,
        host: {
          close() {}
        }
      }
    },
    lucide: {
      createIcons() {}
    },
    setTimeout() {
      return 0;
    },
    clearTimeout() {},
    setInterval() {
      return 0;
    },
    clearInterval() {}
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.__nodes = nodes;
  return sandbox;
}

function loadServerContext() {
  const source = fs.readFileSync(configPath, 'utf8');
  const sandbox = createAppsScriptSandbox();
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'CONFIG.md', timeout: 3000 });
  return { source, sandbox };
}

function testResponsesBodyUsesTextFormat(server) {
  const body = server.buildRequestBodyForApi('responses', {
    model: 'gpt-5.4',
    messages: [{ role: 'user', content: 'hello' }],
    max_tokens: 123,
    response_format: { type: 'json_object' },
    reasoning: { effort: 'high' }
  });

  assert(body.model === 'gpt-5.4', 'responses body should keep selected model');
  assert(body.max_output_tokens === 123, 'responses body should map max_tokens to max_output_tokens');
  assert(!Object.hasOwn(body, 'response_format'), 'responses body must not send response_format directly');
  assert(body.text && body.text.format && body.text.format.type === 'json_object', 'responses body should map structured output to text.format');
  assert(body.reasoning && body.reasoning.effort === 'high', 'responses body should keep reasoning');
}

function testChatBodyKeepsResponseFormat(server) {
  const body = server.buildRequestBodyForApi('chat', {
    model: 'gpt-4.1',
    messages: [{ role: 'user', content: 'hello' }],
    temperature: 0.2,
    max_tokens: 456,
    response_format: { type: 'json_object' }
  });

  assert(body.model === 'gpt-4.1', 'chat body should keep selected model');
  assert(body.temperature === 0.2, 'chat body should keep temperature');
  assert(body.max_tokens === 456, 'chat body should keep max_tokens');
  assert(body.response_format && body.response_format.type === 'json_object', 'chat body should still use response_format');
  assert(!body.text, 'chat body should not create text.format payload');
}

function testAgentModelUiConfig(server) {
  const config = server.getRealUniverseModelUiConfig();
  assert(config.defaultModels.agent === 'gpt-5.4', 'agent default model should be GPT-5.4');
  const gpt54 = config.models.find(model => model.id === 'gpt-5.4');
  assert(gpt54, 'model config should include GPT-5.4');
  assert(gpt54.supportedModes.includes('agent'), 'GPT-5.4 should be selectable in agent mode');
}

function testAgentClientCapabilityFlow(server) {
  const renderedHtml = server.getRealUniverseHtmlContent();
  const clientScript = extractRenderedClientScript(renderedHtml);

  const queryMap = {
    '#popupModeOptions .popup-option.active': { textContent: 'Agent' },
    '#popupPresetOptions .popup-option.active': null
  };
  const browserSandbox = createBrowserSandbox(queryMap);
  vm.createContext(browserSandbox);
  vm.runInContext(clientScript, browserSandbox, { filename: 'rendered-client.js', timeout: 3000 });

  const modelConfigJson = JSON.stringify(server.getRealUniverseModelUiConfig());
  vm.runInContext(
    `modelUiConfig = ${modelConfigJson};
     currentMode = 'agent';
     currentModelSelections.agent = 'gpt-5.4';
     currentReasoningSelections.agent = 'xhigh';`,
    browserSandbox
  );

  assert(vm.runInContext(`isTextModeClient('agent')`, browserSandbox) === true, 'agent should participate in text model capability flow');
  assert(vm.runInContext(`getSelectedModelForMode('agent')`, browserSandbox) === 'gpt-5.4', 'agent should resolve selected model');
  assert(vm.runInContext(`getCurrentReasoningEffort()`, browserSandbox) === 'xhigh', 'agent should resolve selected reasoning');

  vm.runInContext(`updateMode(); updateStatusText();`, browserSandbox);

  const nodes = browserSandbox.__nodes;
  assert(nodes.get('popupPresetSection').style.display === 'none', 'agent should keep preset section hidden');
  assert(nodes.get('popupModelSection').style.display === '', 'agent should show model section');
  assert(nodes.get('popupCapabilitySection').style.display === '', 'agent should show capability section');
  assert(nodes.get('popupModelSelect').value === 'gpt-5.4', 'agent model selector should reflect current model');
  assert(nodes.get('statusText').textContent === 'Agent • GPT-5.4 • Extra High', 'agent status should show selected model and reasoning');
}

function testAgentOperationalPlanRepairsIntoExecute(server) {
  let planCallCount = 0;
  server.buildAgentPlan = () => {
    planCallCount += 1;
    return { summary: 'Preparing sentiment write', finalResponse: 'I will write results to column C.', actions: [] };
  };

  const result = server.processRealUniverseAgentStep({
    phase: 'plan',
    userPrompt: 'วิเคราะห์ content แล้วเขียน sentiment ลงคอลัมน์ C',
    executionLog: [],
    planRetryCount: 0,
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high',
    context: {
      sheetName: 'Sheet1',
      rowCount: 8,
      columnCount: 1,
      columns: [{ index: 1, letter: 'A', header: 'content', label: 'content' }]
    }
  });

  assert(planCallCount === 1, 'plan should run once per step invocation');
  assert(result.done === false, 'operational task should continue after repair');
  assert(result.nextState && result.nextState.phase === 'execute', 'repair should advance directly to execute');
  assert(result.nextState.plan.actions.length === 1, 'repair should build one executable write action');
  assert(result.nextState.plan.actions[0].type === 'analyze_fill', 'repair should produce analyze_fill action');
  assert((result.events || []).some(event => event.label === 'Recovered executable steps'), 'repair path should surface recovered status');
}

function testAgentOperationalPlanFailsClearlyAfterRetry(server) {
  server.buildAgentPlan = () => ({
    summary: 'Preparing sentiment write',
    finalResponse: 'I will write results to column C.',
    actions: []
  });

  const result = server.processRealUniverseAgentStep({
    phase: 'plan',
    userPrompt: 'ช่วยวิเคราะห์ sentiment ให้หน่อย',
    executionLog: [],
    planRetryCount: 1,
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high',
    context: {
      sheetName: 'Sheet1',
      rowCount: 8,
      columnCount: 1,
      columns: [{ index: 1, letter: 'A', header: 'content', label: 'content' }]
    }
  });

  assert(result.done === true, 'operational task should stop after strict re-plan fails');
  assert(String(result.finalMessage || '').includes('ยังสร้างขั้นตอนที่รันได้ไม่สำเร็จ'), 'failure message should explain execution plan could not be built');
  assert((result.events || []).some(event => event.type === 'error'), 'failure path should emit an error event');
}

function testAgentOperationalPlanStillRetriesWhenRepairCannotResolve(server) {
  server.buildAgentPlan = () => ({
    summary: 'Preparing sentiment write',
    finalResponse: 'I will analyze sentiment.',
    actions: []
  });

  const result = server.processRealUniverseAgentStep({
    phase: 'plan',
    userPrompt: 'ช่วยวิเคราะห์ sentiment ให้หน่อย',
    executionLog: [],
    planRetryCount: 0,
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high',
    context: {
      sheetName: 'Sheet1',
      rowCount: 8,
      columnCount: 1,
      columns: [{ index: 1, letter: 'A', header: 'content', label: 'content' }]
    }
  });

  assert(result.done === false, 'unresolved operational task should still retry once');
  assert(result.nextState && result.nextState.phase === 'plan', 'retry should stay in planning phase when repair cannot resolve');
  assert(result.nextState.planRetryCount === 1, 'retry count should increment');
}

function testAgentOperationalPlanAdvancesToExecute(server) {
  server.buildAgentPlan = () => ({
    summary: 'Ready to analyze and write',
    finalResponse: 'I will write results to column C.',
    actions: [
      { type: 'analyze_fill', sourceColumn: 'A', targetColumn: 'C', instruction: 'sentiment' }
    ]
  });

  const result = server.processRealUniverseAgentStep({
    phase: 'plan',
    userPrompt: 'Analyze column A and write sentiment to column C',
    executionLog: [],
    planRetryCount: 1,
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high'
  });

  assert(result.done === false, 'plan with executable actions should continue');
  assert(result.nextState && result.nextState.phase === 'execute', 'plan with actions should advance to execute');
  assert(result.nextState.planRetryCount === 0, 'retry counter should reset after successful executable plan');
}

function testAgentExecuteEmitsResolutionEvents(server) {
  server.resolveColumnReference = ref => ({
    index: ref === 'A' ? 1 : 3,
    letter: ref,
    header: ref === 'A' ? 'Content' : 'Sentiment',
    label: ref
  });
  server.analyzeAgentBatchValues = () => ['positive', 'negative'];
  server.writeColumnValues = (_columnRef, startRow, values) => ({
    columnIndex: 3,
    columnLetter: 'C',
    rowsWritten: values.length,
    startRow: startRow,
    endRow: startRow + values.length - 1
  });
  server.SpreadsheetApp = {
    getActiveSheet() {
      return {
        getLastRow() {
          return 3;
        },
        getRange() {
          return {
            getDisplayValues() {
              return [['good'], ['bad']];
            }
          };
        }
      };
    },
    flush() {}
  };

  const result = server.processRealUniverseAgentStep({
    phase: 'execute',
    plan: {
      actions: [
        { type: 'analyze_fill', sourceColumn: 'A', targetColumn: 'C', instruction: 'sentiment' }
      ]
    },
    currentActionIndex: 0,
    currentBatchIndex: 0,
    actionRuntime: null,
    executionLog: [],
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high'
  });

  const labels = (result.events || []).map(event => event.label);
  assert(labels.includes('Resolved source column A'), 'execute path should report resolved source column');
  assert(labels.includes('Resolved target column C'), 'execute path should report resolved target column');
  assert(labels.includes('Rows to process: 2'), 'execute path should report row count before writing');
  assert(labels.some(label => label.includes('Wrote results to C2:C3')), 'execute path should report written range');
}

function testAgentExecuteRespectsRequestedRowLimit(server) {
  let analyzedRowCount = 0;
  server.resolveColumnReference = ref => ({
    index: ref === 'A' ? 1 : 3,
    letter: ref,
    header: ref === 'A' ? 'Content' : 'Sentiment',
    label: ref
  });
  server.analyzeAgentBatchValues = (_action, batchValues) => {
    analyzedRowCount = batchValues.length;
    return batchValues.map(() => 'positive');
  };
  server.writeColumnValues = (_columnRef, startRow, values) => ({
    columnIndex: 3,
    columnLetter: 'C',
    rowsWritten: values.length,
    startRow: startRow,
    endRow: startRow + values.length - 1
  });
  server.SpreadsheetApp = {
    getActiveSheet() {
      return {
        getLastRow() {
          return 101;
        },
        getRange(_row, _column, numRows) {
          return {
            getDisplayValues() {
              return Array.from({ length: numRows }, (_, index) => [`Row ${index + 1}`]);
            }
          };
        }
      };
    },
    flush() {}
  };

  const result = server.processRealUniverseAgentStep({
    phase: 'execute',
    requestedRowLimit: 40,
    plan: {
      actions: [
        { type: 'analyze_fill', sourceColumn: 'A', targetColumn: 'C', instruction: 'sentiment' }
      ]
    },
    currentActionIndex: 0,
    currentBatchIndex: 0,
    actionRuntime: null,
    executionLog: [],
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high'
  });

  const labels = (result.events || []).map(event => event.label);
  assert(labels.includes('Rows to process: 40'), 'execute path should cap rows to the requested limit');
  assert(result.nextState && result.nextState.actionRuntime && result.nextState.actionRuntime.totalRows === 40, 'runtime should keep the capped row limit');
  assert(analyzedRowCount === 20, 'first batch should still honor batch sizing while respecting the capped total');
}

function testAgentNormalizesAdjacentInsertAndExplicitColumns(server) {
  const actions = server.normalizeAgentPlanActions(
    'สร้างคอลัมน์ใหม่ขึ้นมาข้าง ๆ คอลัมน์ Content แล้วเขียน sentiment ลงคอลัมน์ C',
    {
      context: {
        lastColumn: 4,
        columns: [
          { index: 1, letter: 'A', header: 'ID', label: 'A · ID' },
          { index: 2, letter: 'B', header: 'Name', label: 'B · Name' },
          { index: 3, letter: 'C', header: 'Content', label: 'C · Content' },
          { index: 4, letter: 'D', header: 'Notes', label: 'D · Notes' }
        ]
      }
    },
    [
      { type: 'insert_column', position: 'CON', headerName: '', sourceColumn: '', targetColumn: '', instruction: '' },
      { type: 'analyze_fill', position: '', headerName: '', sourceColumn: 'A', targetColumn: 'C', instruction: 'sentiment' }
    ]
  );

  assert(actions[0].position === 'D', 'adjacent insert should normalize next to the Content header');
  assert(actions[1].sourceColumn === 'A', 'explicit source column letter should win');
  assert(actions[1].targetColumn === 'C', 'explicit target column letter should win');
}

function testAgentDeleteColumnRepairCreatesDeleteAction(server) {
  server.buildAgentPlan = () => ({
    summary: 'Delete the requested column',
    finalResponse: 'Deleting column C.',
    actions: []
  });

  const result = server.processRealUniverseAgentStep({
    phase: 'plan',
    userPrompt: 'ลบคอลัมน์ C ให้หน่อย',
    executionLog: [],
    planRetryCount: 0,
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high',
    context: {
      sheetName: 'Sheet1',
      rowCount: 8,
      columnCount: 3,
      lastColumn: 3,
      columns: [
        { index: 1, letter: 'A', header: 'content', label: 'content' },
        { index: 2, letter: 'B', header: 'sentiment', label: 'sentiment' },
        { index: 3, letter: 'C', header: 'notes', label: 'notes' }
      ]
    }
  });

  assert(result.done === false, 'delete request should continue after repair');
  assert(result.nextState && result.nextState.phase === 'execute', 'delete repair should advance to execute');
  assert(result.nextState.plan.actions[0].type === 'delete_column', 'delete repair should produce delete action');
  assert(result.nextState.plan.actions[0].targetColumn === 'C', 'delete repair should target requested column');
}

function testAgentDeleteColumnExecutes(server) {
  const deletedColumns = [];
  server.SpreadsheetApp = {
    getActiveSheet() {
      return {
        getSheetId() {
          return 1;
        },
        getName() {
          return 'Sheet1';
        },
        getLastColumn() {
          return 3;
        },
        getLastRow() {
          return 2;
        },
        getMaxColumns() {
          return 26;
        },
        getRange() {
          return {
            getDisplayValues() {
              return [['content', 'sentiment', 'notes']];
            }
          };
        },
        deleteColumn(index) {
          deletedColumns.push(index);
        }
      };
    },
    getActiveSpreadsheet() {
      return {
        getId() {
          return 'spreadsheet-id';
        },
        getName() {
          return 'Spreadsheet';
        }
      };
    },
    flush() {}
  };

  const result = server.processRealUniverseAgentStep({
    phase: 'execute',
    plan: {
      actions: [
        { type: 'delete_column', targetColumn: 'C' }
      ]
    },
    context: {
      sheetName: 'Sheet1',
      rowCount: 1,
      columnCount: 3,
      lastColumn: 3,
      columns: [
        { index: 1, letter: 'A', header: 'content', label: 'content' },
        { index: 2, letter: 'B', header: 'sentiment', label: 'sentiment' },
        { index: 3, letter: 'C', header: 'notes', label: 'notes' }
      ]
    },
    currentActionIndex: 0,
    currentBatchIndex: 0,
    actionRuntime: null,
    executionLog: [],
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high'
  });

  assert(deletedColumns.length === 1 && deletedColumns[0] === 3, 'delete action should remove the requested column index');
  const labels = (result.events || []).map(event => event.label);
  assert(labels.includes('Deleting column C'), 'delete execute should emit tool call label');
  assert(labels.includes('Deleted column C'), 'delete execute should emit tool result label');
}

function testAgentDeleteColumnResolvesBlankTargetFromPrompt(server) {
  const deletedColumns = [];
  server.SpreadsheetApp = {
    getActiveSheet() {
      return {
        getSheetId() {
          return 1;
        },
        getName() {
          return 'Sheet1';
        },
        getLastColumn() {
          return 3;
        },
        getLastRow() {
          return 2;
        },
        getMaxColumns() {
          return 26;
        },
        getRange() {
          return {
            getDisplayValues() {
              return [['content', 'sentiment', 'notes']];
            }
          };
        },
        deleteColumn(index) {
          deletedColumns.push(index);
        }
      };
    },
    getActiveSpreadsheet() {
      return {
        getId() {
          return 'spreadsheet-id';
        },
        getName() {
          return 'Spreadsheet';
        }
      };
    },
    flush() {}
  };

  const result = server.processRealUniverseAgentStep({
    phase: 'execute',
    userPrompt: 'ลบคอลัมน์ C ออกให้หน่อย',
    plan: {
      actions: [
        { type: 'delete_column', targetColumn: '' }
      ]
    },
    context: {
      sheetName: 'Sheet1',
      rowCount: 1,
      columnCount: 3,
      lastColumn: 3,
      columns: [
        { index: 1, letter: 'A', header: 'content', label: 'content' },
        { index: 2, letter: 'B', header: 'sentiment', label: 'sentiment' },
        { index: 3, letter: 'C', header: 'notes', label: 'notes' }
      ]
    },
    currentActionIndex: 0,
    currentBatchIndex: 0,
    actionRuntime: null,
    executionLog: [],
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high'
  });

  assert(deletedColumns.length === 1 && deletedColumns[0] === 3, 'delete action should recover target column from prompt');
  const labels = (result.events || []).map(event => event.label);
  assert(labels.includes('Deleting column C'), 'resolved delete should emit tool call label');
}

function testAgentDeleteColumnFailsClearlyWhenTargetCannotResolve(server) {
  const deletedColumns = [];
  server.SpreadsheetApp = {
    getActiveSheet() {
      return {
        getSheetId() {
          return 1;
        },
        getName() {
          return 'Sheet1';
        },
        getLastColumn() {
          return 2;
        },
        getLastRow() {
          return 2;
        },
        getMaxColumns() {
          return 26;
        },
        getRange() {
          return {
            getDisplayValues() {
              return [['content', 'sentiment']];
            }
          };
        },
        deleteColumn(index) {
          deletedColumns.push(index);
        }
      };
    },
    getActiveSpreadsheet() {
      return {
        getId() {
          return 'spreadsheet-id';
        },
        getName() {
          return 'Spreadsheet';
        }
      };
    },
    flush() {}
  };

  const result = server.processRealUniverseAgentStep({
    phase: 'execute',
    userPrompt: 'ลบคอลัมน์ Z ออกให้หน่อย',
    plan: {
      actions: [
        { type: 'delete_column', targetColumn: '' }
      ]
    },
    context: {
      sheetName: 'Sheet1',
      rowCount: 1,
      columnCount: 2,
      lastColumn: 2,
      columns: [
        { index: 1, letter: 'A', header: 'content', label: 'content' },
        { index: 2, letter: 'B', header: 'sentiment', label: 'sentiment' }
      ]
    },
    currentActionIndex: 0,
    currentBatchIndex: 0,
    actionRuntime: null,
    executionLog: [],
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high'
  });

  assert(result.done === true, 'unresolved delete should stop the run');
  assert(deletedColumns.length === 0, 'unresolved delete should not delete any column');
  assert(String(result.finalMessage).includes('หาคอลัมน์ที่ต้องลบไม่เจอ'), 'unresolved delete should return a clear failure message');
}

function testAgentBuildsNaturalFinalResponse(server) {
  const message = server.buildAgentNaturalFinalMessage(
    {},
    {
      finalResponse: '',
      actions: [
        { type: 'insert_column', position: 'B', headerName: 'Summary' },
        { type: 'analyze_fill', sourceColumn: 'A', targetColumn: 'B', instruction: 'summarize' }
      ]
    },
    [
      'Inserted column B with header "Summary".',
      'Wrote 56 results into column B.'
    ]
  );

  assert(String(message).includes('ผมเพิ่มคอลัมน์ "Summary" ที่ B'), 'natural final response should describe the insert in user-facing language');
  assert(String(message).includes('56 แถว'), 'natural final response should mention rows written');
  assert(!String(message).includes('Wrote 56 results'), 'natural final response should not leak raw execution log text');
}

function testAgentPlanEventsIncludeStructuredTrace(server) {
  server.buildAgentPlan = () => ({
    summary: 'Ready to analyze and write',
    finalResponse: 'Will write to column C.',
    actions: [
      { type: 'analyze_fill', sourceColumn: 'A', targetColumn: 'C', instruction: 'sentiment' }
    ]
  });

  const result = server.processRealUniverseAgentStep({
    threadId: 'thread-1',
    phase: 'plan',
    userPrompt: 'Analyze column A and write sentiment to column C',
    executionLog: [],
    planRetryCount: 0,
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high',
    intentType: 'operational',
    context: { sheetName: 'Sheet1', rowCount: 12 }
  });

  const planningEvent = (result.events || [])[1];
  assert(planningEvent && planningEvent.trace, 'plan event should include structured trace');
  assert(planningEvent.trace.userPrompt === 'Analyze column A and write sentiment to column C', 'trace should keep original prompt');
  assert(planningEvent.trace.intentType === 'operational', 'trace should keep intent type');
  assert(Array.isArray(planningEvent.trace.actions) && planningEvent.trace.actions.length === 1, 'trace should include planner actions');
  assert(planningEvent.trace.planSummary === 'Ready to analyze and write', 'trace should include plan summary');
}

function testAgentLogTextIncludesTurnsAndEvents(server) {
  const renderedHtml = server.getRealUniverseHtmlContent();
  const clientScript = extractRenderedClientScript(renderedHtml);
  const browserSandbox = createBrowserSandbox();
  vm.createContext(browserSandbox);
  vm.runInContext(clientScript, browserSandbox, { filename: 'rendered-client.js', timeout: 3000 });

  const turns = [
    {
      threadId: 'thread-1',
      role: 'user',
      phase: 'prompt',
      content: 'Analyze column A and write sentiment to column C',
      createdAt: 1
    }
  ];
  const events = [
    {
      threadId: 'thread-1',
      label: 'Resolved target column C',
      createdAt: 2,
      trace: {
        phase: 'execute',
        eventType: 'tool_result',
        userPrompt: 'Analyze column A and write sentiment to column C',
        intentType: 'operational',
        selectedModel: 'gpt-5.4',
        reasoningEffort: 'high',
        actions: [{ type: 'analyze_fill', sourceColumn: 'A', targetColumn: 'C' }],
        toolResult: { range: 'C2:C3' }
      }
    }
  ];

  browserSandbox.__testTurns = turns;
  browserSandbox.__testEvents = events;
  const text = vm.runInContext(
    `buildAgentLogText('Agent · Sheet1', buildAgentLogEntries(__testTurns, __testEvents))`,
    browserSandbox
  );

  assert(String(text).includes('Agent Log'), 'agent log text should include a header');
  assert(String(text).includes('Thread: Agent · Sheet1'), 'agent log text should include the thread label');
  assert(String(text).includes('Analyze column A and write sentiment to column C'), 'agent log text should include user content');
  assert(String(text).includes('Resolved target column C'), 'agent log text should include event labels');
  assert(String(text).includes('analyze_fill'), 'agent log text should include action payloads');
}

async function testClearAgentThreadDataDeletesOnlyTargetThread(server) {
  const renderedHtml = server.getRealUniverseHtmlContent();
  const clientScript = extractRenderedClientScript(renderedHtml);
  const browserSandbox = createBrowserSandbox();
  vm.createContext(browserSandbox);
  vm.runInContext(clientScript, browserSandbox, { filename: 'rendered-client.js', timeout: 3000 });

  const deleted = {
    turns: [],
    events: [],
    memories: [],
    threads: []
  };

  browserSandbox.__turns = [
    { id: 'turn-1', threadId: 'thread-1' },
    { id: 'turn-2', threadId: 'thread-2' }
  ];
  browserSandbox.__events = [
    { id: 'event-1', threadId: 'thread-1' },
    { id: 'event-2', threadId: 'thread-2' }
  ];
  browserSandbox.__memories = [
    { id: 'memory-1', threadId: 'thread-1' },
    { id: 'memory-2', threadId: 'thread-2' }
  ];

  browserSandbox.idbRequestToPromise = request => Promise.resolve(request.result);
  browserSandbox.runInAgentTransaction = async (_storeNames, _mode, handler) => {
    const stores = {
      agent_turns: {
        getAll() {
          return { result: browserSandbox.__turns };
        },
        delete(id) {
          deleted.turns.push(id);
        }
      },
      agent_events: {
        getAll() {
          return { result: browserSandbox.__events };
        },
        delete(id) {
          deleted.events.push(id);
        }
      },
      agent_memory: {
        getAll() {
          return { result: browserSandbox.__memories };
        },
        delete(id) {
          deleted.memories.push(id);
        }
      },
      agent_threads: {
        delete(id) {
          deleted.threads.push(id);
        }
      }
    };

    return handler(stores);
  };

  await browserSandbox.clearAgentThreadData('thread-1');

  assert(deleted.turns.length === 1 && deleted.turns[0] === 'turn-1', 'clear log should delete only target thread turns');
  assert(deleted.events.length === 1 && deleted.events[0] === 'event-1', 'clear log should delete only target thread events');
  assert(deleted.memories.length === 1 && deleted.memories[0] === 'memory-1', 'clear log should delete only target thread memories');
  assert(deleted.threads.length === 1 && deleted.threads[0] === 'thread-1', 'clear log should delete only target thread record');
}

function testAgentWorkItemsMapStatuses(server) {
  const renderedHtml = server.getRealUniverseHtmlContent();
  const clientScript = extractRenderedClientScript(renderedHtml);
  const browserSandbox = createBrowserSandbox();
  vm.createContext(browserSandbox);
  vm.runInContext(clientScript, browserSandbox, { filename: 'rendered-client.js', timeout: 3000 });

  browserSandbox.__testEvents = [
    { type: 'status', label: 'Planning next steps', trace: { phase: 'plan' } },
    { type: 'tool_call', label: 'Analyzing rows 2-21 from column A', trace: { phase: 'execute' } },
    { type: 'error', label: 'Could not write results', trace: { phase: 'execute' } }
  ];

  const activeItems = vm.runInContext('buildAgentWorkItems(__testEvents, false)', browserSandbox);
  assert(activeItems[0].status === 'done', 'completed earlier steps should stay done');
  assert(activeItems[1].status === 'done', 'tool call should be marked done once a later event exists');
  assert(activeItems[2].status === 'failed', 'error event should be marked failed');

  const completeItems = vm.runInContext('buildAgentWorkItems(__testEvents.slice(0, 2), true)', browserSandbox);
  assert(completeItems.every(item => item.status === 'done'), 'completed panel should mark non-error items done');
}

async function testAgentStopCancelsBeforeNextLoop(server) {
  const renderedHtml = server.getRealUniverseHtmlContent();
  const clientScript = extractRenderedClientScript(renderedHtml);
  const browserSandbox = createBrowserSandbox();
  vm.createContext(browserSandbox);
  vm.runInContext(clientScript, browserSandbox, { filename: 'rendered-client.js', timeout: 3000 });

  browserSandbox.callServer = async () => ({
    done: false,
    events: [{ type: 'status', label: 'Planning next steps', trace: { phase: 'plan' } }],
    nextState: { phase: 'execute' }
  });
  browserSandbox.playAgentEvents = async () => {};
  browserSandbox.upsertAgentMemory = async () => {};
  browserSandbox.saveAgentEvents = async (_threadId, events) => {
    browserSandbox.__savedStopEvents = events;
  };
  browserSandbox.trimAgentEvents = async () => {};
  browserSandbox.finalizeAgentRun = async (_threadId, message) => {
    browserSandbox.__finalMessage = message;
    browserSandbox.currentAgentState = null;
    browserSandbox.currentAgentCancelRequested = false;
  };

  vm.runInContext(
    `currentMode = 'agent';
     isTyping = true;
     currentAgentState = { phase: 'plan' };
     currentAgentWorkRun = { events: [], complete: false, stopping: false, panel: null };`,
    browserSandbox
  );

  const stopRequested = vm.runInContext('requestAgentStop()', browserSandbox);
  assert(stopRequested === true, 'requestAgentStop should accept an active agent run');
  assert(vm.runInContext('currentAgentCancelRequested', browserSandbox) === true, 'stop request should set cancel flag');
  assert(vm.runInContext('currentAgentWorkRun.stopping', browserSandbox) === true, 'stop request should mark the work panel as stopping');

  await browserSandbox.runAgentLoop('thread-1', { phase: 'plan' });

  assert(String(browserSandbox.__finalMessage || '').includes('ผมหยุดการทำงานไว้แล้วครับ'), 'run loop should finalize with a stopped message');
  assert(Array.isArray(browserSandbox.__savedStopEvents) && browserSandbox.__savedStopEvents[0].label === 'Stopping requested', 'run loop should persist a stopping event');
}

const cases = [
  ['responses body uses text.format', testResponsesBodyUsesTextFormat],
  ['chat body keeps response_format', testChatBodyKeepsResponseFormat],
  ['agent model config includes agent support', testAgentModelUiConfig],
  ['agent client exposes model and reasoning flow', testAgentClientCapabilityFlow],
  ['agent operational plan repairs into execute', testAgentOperationalPlanRepairsIntoExecute],
  ['agent unresolved operational plan retries once', testAgentOperationalPlanStillRetriesWhenRepairCannotResolve],
  ['agent operational plan fails clearly after retry', testAgentOperationalPlanFailsClearlyAfterRetry],
  ['agent operational plan advances to execute', testAgentOperationalPlanAdvancesToExecute],
  ['agent delete repair creates delete action', testAgentDeleteColumnRepairCreatesDeleteAction],
  ['agent delete action executes', testAgentDeleteColumnExecutes],
  ['agent delete resolves blank target from prompt', testAgentDeleteColumnResolvesBlankTargetFromPrompt],
  ['agent delete fails clearly when target cannot resolve', testAgentDeleteColumnFailsClearlyWhenTargetCannotResolve],
  ['agent builds natural final response', testAgentBuildsNaturalFinalResponse],
  ['agent execute emits resolution events', testAgentExecuteEmitsResolutionEvents],
  ['agent execute respects requested row limit', testAgentExecuteRespectsRequestedRowLimit],
  ['agent normalizes adjacent insert and explicit columns', testAgentNormalizesAdjacentInsertAndExplicitColumns],
  ['agent plan events include structured trace', testAgentPlanEventsIncludeStructuredTrace],
  ['agent log text includes turns and events', testAgentLogTextIncludesTurnsAndEvents],
  ['clear agent thread data deletes only target thread', testClearAgentThreadDataDeletesOnlyTargetThread],
  ['agent work items map statuses', testAgentWorkItemsMapStatuses],
  ['agent stop cancels before next loop', testAgentStopCancelsBeforeNextLoop]
];

try {
  const { sandbox } = loadServerContext();
  for (const [name, testCase] of cases) {
    await testCase(sandbox);
    console.log(`PASS ${name}`);
  }
} catch (error) {
  console.error('Agent model/reasoning test failed');
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
}
