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

const cases = [
  ['responses body uses text.format', testResponsesBodyUsesTextFormat],
  ['chat body keeps response_format', testChatBodyKeepsResponseFormat],
  ['agent model config includes agent support', testAgentModelUiConfig],
  ['agent client exposes model and reasoning flow', testAgentClientCapabilityFlow]
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
