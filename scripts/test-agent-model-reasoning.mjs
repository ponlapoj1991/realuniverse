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
    }
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

function testAgentOperationalPlanRetriesBeforeCompleting(server) {
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
    reasoningEffort: 'high'
  });

  assert(planCallCount === 1, 'plan should run once per step invocation');
  assert(result.done === false, 'operational task should retry instead of completing immediately');
  assert(result.nextState && result.nextState.phase === 'plan', 'retry should stay in planning phase');
  assert(result.nextState.planRetryCount === 1, 'retry count should increment after first empty action plan');
  assert((result.events || []).some(event => event.label === 'Refining executable steps'), 'retry path should surface refining status');
}

function testAgentOperationalPlanFailsClearlyAfterRetry(server) {
  server.buildAgentPlan = () => ({
    summary: 'Preparing sentiment write',
    finalResponse: 'I will write results to column C.',
    actions: []
  });

  const result = server.processRealUniverseAgentStep({
    phase: 'plan',
    userPrompt: 'วิเคราะห์ content แล้วเขียน sentiment ลงคอลัมน์ C',
    executionLog: [],
    planRetryCount: 1,
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high'
  });

  assert(result.done === true, 'operational task should stop after strict re-plan fails');
  assert(String(result.finalMessage || '').includes('ยังสร้างขั้นตอนที่รันได้ไม่สำเร็จ'), 'failure message should explain execution plan could not be built');
  assert((result.events || []).some(event => event.type === 'error'), 'failure path should emit an error event');
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

function testAgentDebugLogRowsMapStructuredTrace(server) {
  const events = [
    server.createAgentTraceEvent({
      threadId: 'thread-1',
      phase: 'plan',
      userPrompt: 'Analyze column A and write sentiment to column C',
      intentType: 'operational',
      selectedModel: 'gpt-5.4',
      reasoningEffort: 'high',
      planRetryCount: 1,
      context: { sheetName: 'Sheet1', rowCount: 12 }
    }, 'status', 'Planning next steps', {
      planSummary: 'Ready to analyze and write',
      actions: [{ type: 'analyze_fill', sourceColumn: 'A', targetColumn: 'C' }]
    })
  ];

  const rows = server.buildAgentDebugLogRows(events, { done: false }, {
    threadId: 'thread-1',
    phase: 'plan',
    userPrompt: 'Analyze column A and write sentiment to column C',
    intentType: 'operational',
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high',
    planRetryCount: 1,
    context: { sheetName: 'Sheet1', rowCount: 12 }
  });

  assert(rows.length === 1, 'debug log should create one row per event by default');
  assert(rows[0][1] === 'thread-1', 'debug row should keep thread id');
  assert(rows[0][5] === 'Analyze column A and write sentiment to column C', 'debug row should keep user prompt');
  assert(rows[0][6] === 'operational', 'debug row should keep intent type');
  assert(rows[0][10] === 'Ready to analyze and write', 'debug row should keep plan summary');
  assert(String(rows[0][11]).includes('analyze_fill'), 'debug row should keep actions payload');
  assert(rows[0][17] === 'Sheet1', 'debug row should keep sheet name');
}

function testAgentDebugLogRowsIncludeFinalMessage(server) {
  const rows = server.buildAgentDebugLogRows([], {
    done: true,
    finalMessage: 'Wrote 10 results into column C.'
  }, {
    threadId: 'thread-2',
    phase: 'execute',
    userPrompt: 'Write sentiment to C',
    intentType: 'operational',
    selectedModel: 'gpt-5.4',
    reasoningEffort: 'high',
    context: { sheetName: 'Sheet2', rowCount: 10 }
  });

  assert(rows.length === 1, 'final message should create a debug row when no events are present');
  assert(rows[0][3] === 'final_message', 'final message row should use final_message event type');
  assert(rows[0][15] === 'Wrote 10 results into column C.', 'final message row should keep final message');
}

const cases = [
  ['responses body uses text.format', testResponsesBodyUsesTextFormat],
  ['chat body keeps response_format', testChatBodyKeepsResponseFormat],
  ['agent model config includes agent support', testAgentModelUiConfig],
  ['agent client exposes model and reasoning flow', testAgentClientCapabilityFlow],
  ['agent operational plan retries before completing', testAgentOperationalPlanRetriesBeforeCompleting],
  ['agent operational plan fails clearly after retry', testAgentOperationalPlanFailsClearlyAfterRetry],
  ['agent operational plan advances to execute', testAgentOperationalPlanAdvancesToExecute],
  ['agent execute emits resolution events', testAgentExecuteEmitsResolutionEvents],
  ['agent plan events include structured trace', testAgentPlanEventsIncludeStructuredTrace],
  ['agent debug log rows map structured trace', testAgentDebugLogRowsMapStructuredTrace],
  ['agent debug log rows include final message', testAgentDebugLogRowsIncludeFinalMessage]
];

try {
  const { sandbox } = loadServerContext();
  for (const [name, testCase] of cases) {
    testCase(sandbox);
    console.log(`PASS ${name}`);
  }
} catch (error) {
  console.error('Agent model/reasoning test failed');
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
}
