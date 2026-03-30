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
        throw new Error('UrlFetchApp.fetch is disabled in validation');
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

function createFakeNode() {
  return {
    addEventListener() {},
    remove() {},
    appendChild() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    contains() {
      return false;
    },
    focus() {},
    scrollTo() {},
    select() {},
    setAttribute() {},
    removeAttribute() {},
    innerHTML: '',
    textContent: '',
    value: '',
    disabled: false,
    style: {},
    dataset: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() {
        return false;
      }
    }
  };
}

function createGoogleScriptRunner() {
  const proxy = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'withSuccessHandler' || prop === 'withFailureHandler') {
          return () => proxy;
        }
        return () => proxy;
      }
    }
  );
  return proxy;
}

function createBrowserSandbox() {
  const domReadyCallbacks = [];
  const document = {
    readyState: 'loading',
    body: createFakeNode(),
    getElementById() {
      return createFakeNode();
    },
    querySelector() {
      return createFakeNode();
    },
    querySelectorAll() {
      return [];
    },
    createElement() {
      return createFakeNode();
    },
    addEventListener(eventName, handler) {
      if (eventName === 'DOMContentLoaded') {
        domReadyCallbacks.push(handler);
      }
    }
  };

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
        run: createGoogleScriptRunner(),
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
  sandbox.__domReadyCallbacks = domReadyCallbacks;
  return sandbox;
}

function extractRenderedClientScript(html) {
  const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert(scriptMatches.length > 0, 'No inline <script> block found in rendered HTML');
  return scriptMatches[scriptMatches.length - 1][1];
}

function findInlineHandlerNames(html) {
  const handlers = new Set();
  const regex = /on[a-z]+="([A-Za-z_$][\w$]*)\(/g;
  let match = null;
  while ((match = regex.exec(html)) !== null) {
    handlers.add(match[1]);
  }
  return [...handlers].sort();
}

function main() {
  assert(fs.existsSync(configPath), `Missing file: ${configPath}`);
  const source = fs.readFileSync(configPath, 'utf8');

  new vm.Script(source, { filename: 'CONFIG.md' });

  const appsScriptSandbox = createAppsScriptSandbox();
  vm.createContext(appsScriptSandbox);
  vm.runInContext(source, appsScriptSandbox, { filename: 'CONFIG.md', timeout: 3000 });

  assert(
    typeof appsScriptSandbox.getRealUniverseHtmlContent === 'function',
    'getRealUniverseHtmlContent() is not available after evaluating CONFIG.md'
  );

  const html = appsScriptSandbox.getRealUniverseHtmlContent();
  assert(typeof html === 'string' && html.length > 0, 'Rendered HTML is empty');

  const clientScript = extractRenderedClientScript(html);
  new vm.Script(clientScript, { filename: 'rendered-client.js' });

  const browserSandbox = createBrowserSandbox();
  vm.createContext(browserSandbox);
  vm.runInContext(clientScript, browserSandbox, { filename: 'rendered-client.js', timeout: 3000 });

  const handlerNames = findInlineHandlerNames(html);
  const missingHandlers = handlerNames.filter(name => typeof browserSandbox.window[name] !== 'function');
  assert(
    missingHandlers.length === 0,
    `Missing global handlers in rendered client shell: ${missingHandlers.join(', ')}`
  );

  console.log('CONFIG.md validation passed');
  console.log(`- rendered html length: ${html.length}`);
  console.log(`- rendered client script length: ${clientScript.length}`);
  console.log(`- inline handlers verified: ${handlerNames.join(', ')}`);
}

try {
  main();
} catch (error) {
  console.error('CONFIG.md validation failed');
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
}
