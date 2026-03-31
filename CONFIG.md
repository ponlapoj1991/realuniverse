/**
 * ===== REALUNIVERSE AI MASTER LIBRARY =====
 * Version: 1.0.8 (Fix: remove temperature for /v1/responses; keep for chat)
 */
/* ------------------ CONFIGURATION ------------------ */
const API_URL = 'https://api.openai.com/v1/chat/completions';      // Chat Completions
const RESPONSES_API_URL = 'https://api.openai.com/v1/responses';    // Responses API
const IMAGE_API_URL = 'https://api.openai.com/v1/images/generations';

// Model Configuration for different modes
// ระบบจะตรวจชื่อโมเดลแล้วเลือก endpoint ให้เอง (responses/chat)
const MODEL_CONFIG = {
  action_standard: { model: 'gpt-4.1', max_tokens: 10000 },
  action_turbo: { model: 'gpt-4.1', max_tokens: 20000 },
  array: { model: 'gpt-4.1', max_tokens: 2000 },
  image: { model: 'dall-e-3', size: '1024x1024', quality: 'hd', n: 1 }
};

const AGENT_MODEL_CONFIG = {
  model: 'gpt-5.4',
  reasoning: 'xhigh',
  planningMaxTokens: 4000,
  executionMaxTokens: 2500,
  batchSize: 20,
  maxSampleRows: 5
};

const AGENT_MODE_SYSTEM_PROMPT = [
  'You are RealUniverse Agent operating inside Google Sheets.',
  'You always know you are working on the user\'s currently active sheet.',
  'You can inspect the sheet, resolve columns by letter or header, insert a column, delete a column, and write results back into the sheet.',
  'Plan only with the supported actions below:',
  '- insert_column: insert a new column at a position and set its header',
  '- delete_column: delete an existing column by letter or header',
  '- analyze_fill: read a source column row-by-row and write one result per row to a target column',
  'If the user only asks a question, answer directly with no actions.',
  'Return a JSON object with keys: summary, finalResponse, actions.',
  'Each action must be minimal, deterministic, and safe.',
  'Never invent columns that do not exist. If a target column must be created, add an insert_column action first.',
  'For analyze_fill, include sourceColumn, targetColumn, instruction, and optional headerName if helpful.',
  'Do not include markdown code fences.'
].join('\n');

const AGENT_OPERATIONAL_KEYWORDS = [
  'write', 'fill', 'insert', 'create column', 'add column', 'append column', 'update', 'analyze', 'classify', 'categorize', 'tag', 'score', 'sentiment',
  'delete', 'remove', 'drop column', 'delete column',
  'เขียน', 'ใส่', 'เพิ่ม', 'สร้างคอลัมน์', 'สร้างคอลั่ม', 'เพิ่มคอลัมน์', 'เพิ่มคอลั่ม', 'แทรกคอลัมน์', 'วิเคราะห์', 'จัดหมวด', 'ทำ sentiment', 'ลงคอลัมน์', 'ลงคอลั่ม', 'ลบ', 'ลบออก', 'ลบคอลัมน์', 'ลบคอลั่ม', 'สร้างใหม่'
];

const AGENT_CREATE_COLUMN_KEYWORDS = ['create', 'add', 'insert', 'new column', 'สร้าง', 'เพิ่ม', 'แทรก', 'สร้างใหม่'];
const AGENT_DELETE_COLUMN_KEYWORDS = ['delete', 'remove', 'drop', 'ลบ', 'ลบออก'];
const AGENT_ADJACENT_COLUMN_KEYWORDS = ['next to', 'beside', 'after', 'adjacent', 'ข้าง', 'ข้างๆ', 'ข้าง ๆ', 'ถัดจาก'];

const MODEL_REGISTRY = {
  'gpt-4.1': {
    label: 'GPT-4.1',
    apiType: 'chat',
    supportsTemperature: true,
    supportsReasoning: false,
    supportedModes: ['action', 'array', 'agent']
  },
  'gpt-4.1-mini': {
    label: 'GPT-4.1 Mini',
    apiType: 'chat',
    supportsTemperature: true,
    supportsReasoning: false,
    supportedModes: ['action', 'array', 'agent']
  },
  'gpt-4.1-nano': {
    label: 'GPT-4.1 Nano',
    apiType: 'chat',
    supportsTemperature: true,
    supportsReasoning: false,
    supportedModes: ['action', 'array', 'agent']
  },
  'gpt-5': {
    label: 'GPT-5',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['minimal', 'low', 'medium', 'high'],
    defaultReasoning: 'medium',
    supportedModes: ['action', 'array', 'agent']
  },
  'gpt-5-mini': {
    label: 'GPT-5 Mini',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['minimal', 'low', 'medium', 'high'],
    defaultReasoning: 'medium',
    supportedModes: ['action', 'array', 'agent']
  },
  'gpt-5-nano': {
    label: 'GPT-5 Nano',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['minimal', 'low', 'medium', 'high'],
    defaultReasoning: 'medium',
    supportedModes: ['action', 'array', 'agent']
  },
  'gpt-5.2': {
    label: 'GPT-5.2',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['none', 'low', 'medium', 'high'],
    defaultReasoning: 'none',
    supportedModes: ['action', 'array', 'agent']
  },
  'gpt-5.4': {
    label: 'GPT-5.4',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['none', 'low', 'medium', 'high', 'xhigh'],
    defaultReasoning: 'none',
    supportedModes: ['action', 'array', 'agent']
  },
  'gpt-5.4-mini': {
    label: 'GPT-5.4 Mini',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['none', 'low', 'medium', 'high', 'xhigh'],
    defaultReasoning: 'none',
    supportedModes: ['action', 'array', 'agent']
  },
  'gpt-5.4-nano': {
    label: 'GPT-5.4 Nano',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['none', 'low', 'medium', 'high', 'xhigh'],
    defaultReasoning: 'none',
    supportedModes: ['action', 'array', 'agent']
  }
};

const TEXT_MODE_DEFAULT_MODEL = {
  action: MODEL_CONFIG.action_standard.model,
  array: MODEL_CONFIG.array.model,
  agent: AGENT_MODEL_CONFIG.model
};

const TEXT_MODE_MODEL_ORDER = [
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-5.2',
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.4-nano'
];

const TEMPERATURE_OPTIONS = [
  { label: 'Exact', value: 0 },
  { label: 'Focused', value: 0.2 },
  { label: 'Balance', value: 0.5 },
  { label: 'Creative', value: 0.7 }
];

const REASONING_LABELS = {
  none: 'None',
  minimal: 'Minimal',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  xhigh: 'Extra High'
};

const TEMPERATURE_PRESETS = [0, 0.2, 0.4, 0.7];

// Turbo Mode Settings
const TURBO_CHUNK_CHAR_LIMIT_ACTION = 20000;
const MAX_TOTAL_ROWS_TURBO = 10000;
const PARALLEL_BATCH_SIZE = 3;
const PARALLEL_DELAY_MS = 1000;

// Array Mode Settings
const MAX_ROWS_PER_BATCH_ARRAY = 10;
const MAX_TOTAL_ROWS_ARRAY = 10000;

// UI Settings
const SIDEBAR_WIDTH = 600;
const SIDEBAR_HEIGHT = 900;
const CHAT_SHEET_NAME = 'ChatHistory';
const PRESET_STORAGE_KEY = 'REALUNIVERSE_PRESETS_V1';

/* ------------------ DYNAMIC PRESET FUNCTIONS ------------------ */

/**
 * Create empty preset store
 */
function createEmptyPresetStore() {
  return {
    version: 1,
    presets: {
      action: [],
      array: [],
      image: []
    }
  };
}

function getSupportedPresetModes() {
  return ['action', 'array', 'image'];
}

function normalizePresetMode(mode) {
  return getSupportedPresetModes().includes(mode) ? mode : 'action';
}

function sanitizePresetValue(value) {
  return String(value == null ? '' : value).trim();
}

function createPresetId(mode) {
  return `${mode}_${new Date().getTime()}_${Math.floor(Math.random() * 100000)}`;
}

function normalizePresetItem(item, fallbackMode, fallbackOrder) {
  if (!item || typeof item !== 'object') return null;

  const mode = normalizePresetMode(item.mode || fallbackMode);
  const name = sanitizePresetValue(item.name);
  const prompt = sanitizePresetValue(item.prompt);

  if (!name || !prompt) return null;

  return {
    id: sanitizePresetValue(item.id) || createPresetId(mode),
    mode: mode,
    name: name,
    prompt: prompt,
    order: Number(item.order) > 0 ? Number(item.order) : fallbackOrder
  };
}

function normalizePresetStore(store) {
  const emptyStore = createEmptyPresetStore();
  if (!store || typeof store !== 'object') return emptyStore;

  const normalized = createEmptyPresetStore();

  getSupportedPresetModes().forEach(mode => {
    const items = Array.isArray(store.presets && store.presets[mode]) ? store.presets[mode] : [];
    normalized.presets[mode] = items
      .map((item, index) => normalizePresetItem(item, mode, index + 1))
      .filter(Boolean)
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({
        id: item.id,
        mode: mode,
        name: item.name,
        prompt: item.prompt,
        order: index + 1
      }));
  });

  return normalized;
}

function savePresetStore(store) {
  const normalized = normalizePresetStore(store);
  PropertiesService.getDocumentProperties().setProperty(PRESET_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function buildPresetStoreFromLegacySheet(sheet) {
  if (!sheet) return null;

  const store = createEmptyPresetStore();
  const legacyConfigs = [
    { mode: 'action', range: 'A2:B21' },
    { mode: 'array', range: 'D2:E21' },
    { mode: 'image', range: 'G2:H21' }
  ];

  legacyConfigs.forEach(config => {
    const values = sheet.getRange(config.range).getValues();
    values.forEach((row, index) => {
      const [name, prompt] = row;
      const normalized = normalizePresetItem({
        id: `${config.mode}_legacy_${index + 2}`,
        mode: config.mode,
        name: name,
        prompt: prompt,
        order: index + 1
      }, config.mode, index + 1);

      if (normalized) {
        store.presets[config.mode].push(normalized);
      }
    });
  });

  const hasAnyPresets = getSupportedPresetModes().some(mode => store.presets[mode].length > 0);
  return hasAnyPresets ? normalizePresetStore(store) : null;
}

function migrateLegacyPresetSheetIfNeeded() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Preset');
  if (!sheet) return null;

  const migratedStore = buildPresetStoreFromLegacySheet(sheet);
  if (!migratedStore) return null;

  return savePresetStore(migratedStore);
}

function getPresetStore() {
  const properties = PropertiesService.getDocumentProperties();
  const storedValue = properties.getProperty(PRESET_STORAGE_KEY);

  if (storedValue) {
    try {
      const parsed = JSON.parse(storedValue);
      const normalized = normalizePresetStore(parsed);
      if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
        savePresetStore(normalized);
      }
      return normalized;
    } catch (e) {
      Logger.log('Error parsing preset store: ' + e.message);
    }
  }

  try {
    const migratedStore = migrateLegacyPresetSheetIfNeeded();
    if (migratedStore) return migratedStore;
  } catch (e) {
    Logger.log('Error migrating legacy presets: ' + e.message);
  }

  return createEmptyPresetStore();
}

function buildDynamicPresetResponse(store) {
  const normalized = normalizePresetStore(store);
  const response = {
    action: {},
    array: {},
    image: {}
  };

  getSupportedPresetModes().forEach(mode => {
    normalized.presets[mode].forEach(item => {
      response[mode][item.id] = {
        SYSTEM_MESSAGE: item.prompt,
        DISPLAY_NAME: item.name,
        PROMPT: item.prompt,
        ORDER: item.order,
        MODE: mode
      };
    });
  });

  return response;
}

/**
 * Get dynamic presets from Document Properties
 */
function getDynamicPresets() {
  return buildDynamicPresetResponse(getPresetStore());
}

function getPresetById(mode, presetId) {
  const store = getPresetStore();
  const normalizedMode = normalizePresetMode(mode);
  const presets = store.presets[normalizedMode] || [];

  const matchedPreset = presets.find(item => item.id === presetId);
  if (matchedPreset) return matchedPreset;

  return presets.length > 0 ? presets[0] : null;
}

function getPresetDescriptionByKey(presetKey) {
  try {
    const presets = getDynamicPresets();
    for (const mode of getSupportedPresetModes()) {
      if (presets[mode] && presets[mode][presetKey]) {
        return presets[mode][presetKey].PROMPT || 'ไม่มีคำอธิบาย';
      }
    }
  } catch (e) {
    Logger.log('Error reading preset description: ' + e.message);
  }

  return 'ไม่มีคำอธิบาย';
}

function saveDynamicPreset(mode, presetId, presetName, promptText) {
  const normalizedMode = normalizePresetMode(mode);
  const name = sanitizePresetValue(presetName);
  const prompt = sanitizePresetValue(promptText);

  if (!name) throw new Error('Preset name is required');
  if (!prompt) throw new Error('Prompt is required');

  const store = getPresetStore();
  const modePresets = store.presets[normalizedMode] || [];
  const existingIndex = modePresets.findIndex(item => item.id === presetId);

  if (existingIndex >= 0) {
    modePresets[existingIndex].name = name;
    modePresets[existingIndex].prompt = prompt;
  } else {
    modePresets.push({
      id: createPresetId(normalizedMode),
      mode: normalizedMode,
      name: name,
      prompt: prompt,
      order: modePresets.length + 1
    });
  }

  store.presets[normalizedMode] = modePresets;
  const savedStore = savePresetStore(store);
  const savedPreset = savedStore.presets[normalizedMode][existingIndex >= 0 ? existingIndex : savedStore.presets[normalizedMode].length - 1];

  return {
    presets: buildDynamicPresetResponse(savedStore),
    selectedPresetId: savedPreset ? savedPreset.id : null
  };
}

function deleteDynamicPreset(mode, presetId) {
  const normalizedMode = normalizePresetMode(mode);
  const store = getPresetStore();
  const modePresets = store.presets[normalizedMode] || [];

  const filteredPresets = modePresets.filter(item => item.id !== presetId)
    .map((item, index) => ({
      id: item.id,
      mode: item.mode,
      name: item.name,
      prompt: item.prompt,
      order: index + 1
    }));

  store.presets[normalizedMode] = filteredPresets;
  const savedStore = savePresetStore(store);

  return {
    presets: buildDynamicPresetResponse(savedStore),
    deletedPresetId: presetId
  };
}

/* ------------------ MAIN LIBRARY FUNCTIONS ------------------ */
function onOpen() {
  initializeRealUniverse();
}

function initializeRealUniverse() {
  const ui = SpreadsheetApp.getUi();

  try {
    ui.createMenu('◉⃝◉ RealUniverse')
      .addItem('↗️ Launch AI', 'launchRealUniverseAI')
      .addSeparator()
      .addItem('⚙️ Set API Key', 'setupRealUniverseApiKey')
      .addItem('🗑️ Clear Chat History', 'clearRealUniverseHistory')
      .addToUi();

  } catch (e) {
    Logger.log('Error initializing RealUniverse: ' + e.message);
    ui.alert('Installation Error',
      'There was an error setting up RealUniverse AI. Please try refreshing the page and running the installation again.',
      ui.ButtonSet.OK);
  }
}

function launchRealUniverseAI() {
  showRealUniverseChat();
}

function showRealUniverseChat() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const displayMode = 'modeless';

    if (displayMode === 'sidebar') {
      showRealUniverseSidebar();
    } else {
      showRealUniverseModeless();
    }

  } catch (e) {
    Logger.log('Error showing chat: ' + e.message);
    SpreadsheetApp.getUi().alert('Error', 'Could not launch AI interface: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function showRealUniverseSidebar() {
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty('REALUNIVERSE_DISPLAY_MODE', 'sidebar');

    const htmlContent = getRealUniverseHtmlContent();
    const html = HtmlService.createHtmlOutput(htmlContent).setWidth(320);

    SpreadsheetApp.getUi().showSidebar(html.setTitle(' '));
  } catch (e) {
    Logger.log('Error showing sidebar: ' + e.message);
    SpreadsheetApp.getUi().alert('Error', 'Could not launch sidebar: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function showRealUniverseModeless() {
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty('REALUNIVERSE_DISPLAY_MODE', 'modeless');

    const htmlContent = getRealUniverseHtmlContent();
    const html = HtmlService.createHtmlOutput(htmlContent);
    html.setWidth(SIDEBAR_WIDTH).setHeight(SIDEBAR_HEIGHT);

    SpreadsheetApp.getUi().showModelessDialog(html, ' ');
  } catch (e) {
    Logger.log('Error showing modeless: ' + e.message);
    SpreadsheetApp.getUi().alert('Error', 'Could not launch modeless dialog: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function toggleDisplayMode() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const currentMode = properties.getProperty('REALUNIVERSE_DISPLAY_MODE') || 'modeless';

    const newMode = currentMode === 'modeless' ? 'sidebar' : 'modeless';
    properties.setProperty('REALUNIVERSE_DISPLAY_MODE', newMode);

    const ui = SpreadsheetApp.getUi();
    const emptyHtml = HtmlService.createHtmlOutput('<script>google.script.host.close();</script>');

    if (currentMode === 'modeless') {
      emptyHtml.setWidth(1).setHeight(1);
      ui.showModelessDialog(emptyHtml, 'Closing...');
      Utilities.sleep(150);
    } else {
      emptyHtml.setWidth(1);
      ui.showSidebar(emptyHtml.setTitle('Closing...'));
      Utilities.sleep(150);
    }

    const htmlContent = getRealUniverseHtmlContent();
    const html = HtmlService.createHtmlOutput(htmlContent);

    if (newMode === 'sidebar') {
      html.setWidth(320);
      ui.showSidebar(html.setTitle(' '));
    } else {
      html.setWidth(SIDEBAR_WIDTH).setHeight(SIDEBAR_HEIGHT);
      ui.showModelessDialog(html, ' ');
    }

  } catch (e) {
    Logger.log('Error toggling display mode: ' + e.message);
    SpreadsheetApp.getUi().alert('Error', 'Could not switch display mode: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function getCurrentDisplayMode() {
  try {
    const properties = PropertiesService.getScriptProperties();
    return properties.getProperty('REALUNIVERSE_DISPLAY_MODE') || 'modeless';
  } catch (e) {
    Logger.log('Error getting display mode: ' + e.message);
    return 'modeless';
  }
}

function setupRealUniverseApiKey() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Set OpenAI API Key',
    'Please enter your OpenAI API key (starts with "sk-"):\n\nYou can get one from: https://platform.openai.com/api-keys',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() == ui.Button.OK) {
    const apiKey = response.getResponseText().trim();
    if (apiKey.startsWith('sk-')) {
      PropertiesService.getScriptProperties().setProperty('REALUNIVERSE_API_KEY', apiKey);
      ui.alert('Success!', 'Your API Key has been saved securely. You can now use RealUniverse AI!', ui.ButtonSet.OK);
    } else {
      ui.alert('Error', 'Invalid API Key format. It must start with "sk-".', ui.ButtonSet.OK);
    }
  }
}

/* ------------------ CORE AI PROCESSING FUNCTIONS ------------------ */

function isTextMode(mode) {
  return mode === 'action' || mode === 'array' || mode === 'agent';
}

function getModelRegistryEntry(modelName) {
  return MODEL_REGISTRY[modelName] || null;
}

function getDefaultModelForMode(mode) {
  return TEXT_MODE_DEFAULT_MODEL[mode] || MODEL_CONFIG.action_standard.model;
}

function isSelectableModelForMode(mode, modelName) {
  const modelEntry = getModelRegistryEntry(modelName);
  if (!modelEntry || !Array.isArray(modelEntry.supportedModes)) return false;
  return modelEntry.supportedModes.includes(mode);
}

function resolveSelectedModelForMode(mode, selectedModel) {
  if (!isTextMode(mode)) return null;
  if (selectedModel && isSelectableModelForMode(mode, selectedModel)) {
    return selectedModel;
  }
  return getDefaultModelForMode(mode);
}

function supportsReasoningForModel(modelName) {
  const modelEntry = getModelRegistryEntry(modelName);
  return !!(modelEntry && modelEntry.supportsReasoning);
}

function supportsTemperatureForModel(modelName) {
  const modelEntry = getModelRegistryEntry(modelName);
  return !!(modelEntry && modelEntry.supportsTemperature);
}

function getReasoningOptionsForModel(modelName) {
  const modelEntry = getModelRegistryEntry(modelName);
  return modelEntry && Array.isArray(modelEntry.reasoningOptions) ? modelEntry.reasoningOptions : [];
}

function getDefaultReasoningForModel(modelName) {
  const modelEntry = getModelRegistryEntry(modelName);
  return modelEntry && modelEntry.defaultReasoning ? modelEntry.defaultReasoning : null;
}

function normalizeReasoningEffortForModel(modelName, reasoningEffort) {
  if (!supportsReasoningForModel(modelName)) return null;
  const allowedOptions = getReasoningOptionsForModel(modelName);
  if (reasoningEffort && allowedOptions.includes(reasoningEffort)) {
    return reasoningEffort;
  }
  return getDefaultReasoningForModel(modelName);
}

function resolveModelConfigForMode(mode, turboMode, selectedModel) {
  if (mode === 'action') {
    const baseConfig = turboMode ? MODEL_CONFIG.action_turbo : MODEL_CONFIG.action_standard;
    return {
      ...baseConfig,
      model: resolveSelectedModelForMode(mode, selectedModel)
    };
  }

  if (mode === 'array') {
    return {
      ...MODEL_CONFIG.array,
      model: resolveSelectedModelForMode(mode, selectedModel)
    };
  }

  return { ...MODEL_CONFIG.image };
}

function resolveAgentModelConfig(selectedModel, reasoningEffort) {
  const resolvedModel = resolveSelectedModelForMode('agent', selectedModel) || AGENT_MODEL_CONFIG.model;
  return {
    model: resolvedModel,
    reasoning: normalizeReasoningEffortForModel(resolvedModel, reasoningEffort || AGENT_MODEL_CONFIG.reasoning),
    planningMaxTokens: AGENT_MODEL_CONFIG.planningMaxTokens,
    executionMaxTokens: AGENT_MODEL_CONFIG.executionMaxTokens,
    batchSize: AGENT_MODEL_CONFIG.batchSize,
    maxSampleRows: AGENT_MODEL_CONFIG.maxSampleRows
  };
}

function getRealUniverseModelUiConfig() {
  return {
    models: TEXT_MODE_MODEL_ORDER
      .filter(modelId => !!MODEL_REGISTRY[modelId])
      .map(modelId => ({
        id: modelId,
        label: MODEL_REGISTRY[modelId].label,
        supportsTemperature: MODEL_REGISTRY[modelId].supportsTemperature,
        supportsReasoning: MODEL_REGISTRY[modelId].supportsReasoning,
        reasoningOptions: MODEL_REGISTRY[modelId].reasoningOptions || [],
        defaultReasoning: MODEL_REGISTRY[modelId].defaultReasoning || null,
        supportedModes: MODEL_REGISTRY[modelId].supportedModes || []
      })),
    defaultModels: TEXT_MODE_DEFAULT_MODEL,
    reasoningLabels: REASONING_LABELS,
    temperatureOptions: TEMPERATURE_OPTIONS
  };
}

function parseJsonResponseText(rawText) {
  let cleanedText = String(rawText || '').trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleanedText);
}

function getColumnLetter(columnNumber) {
  let temp = Number(columnNumber);
  let letter = '';
  while (temp > 0) {
    const remainder = (temp - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    temp = Math.floor((temp - remainder - 1) / 26);
  }
  return letter || '';
}

function getActiveSheetSchema() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const headerValues = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0] || [];

  const columns = [];
  for (let columnIndex = 1; columnIndex <= lastColumn; columnIndex++) {
    const letter = getColumnLetter(columnIndex);
    const headerValue = cleanCellData(headerValues[columnIndex - 1] || '');
    columns.push({
      index: columnIndex,
      letter: letter,
      header: headerValue,
      label: headerValue || letter
    });
  }

  return {
    spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
    spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
    sheetId: sheet.getSheetId(),
    sheetName: sheet.getName(),
    lastRow: lastRow,
    lastColumn: lastColumn,
    rowCount: Math.max(lastRow - 1, 0),
    columnCount: lastColumn,
    columns: columns
  };
}

function getSheetSampleRows(limit) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const schema = getActiveSheetSchema();
  const safeLimit = Math.max(1, Math.min(Number(limit) || AGENT_MODEL_CONFIG.maxSampleRows, AGENT_MODEL_CONFIG.maxSampleRows));
  const rows = [];

  if (schema.lastRow <= 1 || schema.lastColumn <= 0) {
    return rows;
  }

  const readCount = Math.min(safeLimit, schema.lastRow - 1);
  const values = sheet.getRange(2, 1, readCount, schema.lastColumn).getDisplayValues();

  values.forEach((rowValues, rowIndex) => {
    rows.push({
      rowNumber: rowIndex + 2,
      values: rowValues.map(value => cleanCellData(value))
    });
  });

  return rows;
}

function getActiveSheetContext() {
  const schema = getActiveSheetSchema();
  return {
    ...schema,
    sampleRows: getSheetSampleRows(AGENT_MODEL_CONFIG.maxSampleRows)
  };
}

function resolveColumnReference(input) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const schema = getActiveSheetSchema();
  const normalizedInput = cleanCellData(input || '').toLowerCase();

  if (!normalizedInput) {
    throw new Error('Column reference is required');
  }

  const numericColumn = convertToColumnNumber(normalizedInput);
  if (numericColumn && numericColumn >= 1 && numericColumn <= sheet.getMaxColumns()) {
    const matchedByLetter = schema.columns.find(column => column.index === numericColumn);
    return matchedByLetter || {
      index: numericColumn,
      letter: getColumnLetter(numericColumn),
      header: '',
      label: getColumnLetter(numericColumn)
    };
  }

  const matchedByHeader = schema.columns.find(column => cleanCellData(column.header || '').toLowerCase() === normalizedInput);
  if (matchedByHeader) return matchedByHeader;

  throw new Error('Column not found: ' + input);
}

function insertColumnAt(position, headerName) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const targetIndex = convertToColumnNumber(position);
  if (!targetIndex) {
    throw new Error('Invalid insert position: ' + position);
  }

  sheet.insertColumnBefore(targetIndex);
  if (headerName && String(headerName).trim()) {
    sheet.getRange(1, targetIndex).setValue(String(headerName).trim());
  }

  return {
    columnIndex: targetIndex,
    columnLetter: getColumnLetter(targetIndex),
    headerName: String(headerName || '').trim()
  };
}

function resolveExistingColumnReference(input, context) {
  const schema = context || getActiveSheetSchema();
  const normalizedInput = cleanCellData(input || '').toLowerCase();

  if (!normalizedInput) {
    throw new Error('Column reference is required');
  }

  const numericColumn = convertToColumnNumber(normalizedInput);
  if (numericColumn && numericColumn >= 1 && numericColumn <= schema.lastColumn) {
    return schema.columns.find(column => column.index === numericColumn) || null;
  }

  return schema.columns.find(column => cleanCellData(column.header || '').toLowerCase() === normalizedInput) || null;
}

function deleteColumnAt(columnRef) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const schema = getActiveSheetSchema();
  const resolvedColumn = resolveExistingColumnReference(columnRef, schema);

  if (!resolvedColumn) {
    throw new Error('Column not found for delete: ' + columnRef);
  }

  sheet.deleteColumn(resolvedColumn.index);
  return {
    columnIndex: resolvedColumn.index,
    columnLetter: resolvedColumn.letter,
    headerName: resolvedColumn.header || ''
  };
}

function writeColumnValues(columnRef, startRow, values) {
  const resolvedColumn = resolveColumnReference(columnRef);
  const safeValues = Array.isArray(values) ? values : [];
  if (safeValues.length === 0) {
    return {
      columnIndex: resolvedColumn.index,
      columnLetter: resolvedColumn.letter,
      rowsWritten: 0
    };
  }

  const sheet = SpreadsheetApp.getActiveSheet();
  const normalizedValues = safeValues.map(value => [value == null ? '' : value]);
  sheet.getRange(startRow, resolvedColumn.index, normalizedValues.length, 1).setValues(normalizedValues);

  return {
    columnIndex: resolvedColumn.index,
    columnLetter: resolvedColumn.letter,
    rowsWritten: normalizedValues.length,
    startRow: startRow,
    endRow: startRow + normalizedValues.length - 1
  };
}

function getRealUniverseAgentStatusInfo() {
  try {
    const context = getActiveSheetContext();
    return 'Active sheet: ' + context.sheetName + ' (' + context.rowCount + ' rows, ' + context.columnCount + ' cols)';
  } catch (e) {
    return '(Error reading active sheet)';
  }
}

function buildAgentPlanningPrompt(userPrompt, agentState) {
  const context = agentState.context || getActiveSheetContext();
  const summary = agentState.memorySummary || '';

  return JSON.stringify({
    userPrompt: userPrompt,
    activeSheet: {
      spreadsheetName: context.spreadsheetName,
      sheetName: context.sheetName,
      rowCount: context.rowCount,
      columnCount: context.columnCount,
      columns: context.columns.map(column => ({
        letter: column.letter,
        header: column.header || '',
        label: column.label
      })),
      sampleRows: context.sampleRows
    },
    memorySummary: summary
  }, null, 2);
}

function isAgentOperationalTask(userPrompt) {
  const normalizedPrompt = cleanCellData(userPrompt || '').toLowerCase();
  if (!normalizedPrompt) return false;

  return AGENT_OPERATIONAL_KEYWORDS.some(keyword => normalizedPrompt.includes(keyword));
}

function promptIncludesAnyKeyword(prompt, keywords) {
  const normalizedPrompt = cleanCellData(prompt || '').toLowerCase();
  if (!normalizedPrompt) return false;
  return (keywords || []).some(keyword => normalizedPrompt.includes(keyword));
}

function extractColumnMentions(userPrompt) {
  const text = String(userPrompt || '');
  const matches = [];
  const patterns = [
    /\bcolumn\s+([A-Z]{1,3})\b/gi,
    /\bcol(?:umn)?\s+([A-Z]{1,3})\b/gi,
    /คอลั(?:มน์|่ม)\s*([A-Z]{1,3})/gi
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      matches.push(match[1].toUpperCase());
    }
  });

  return matches;
}

function findContextColumnByPrompt(userPrompt, context, excludedLetters) {
  const normalizedPrompt = cleanCellData(userPrompt || '').toLowerCase();
  const excluded = new Set((excludedLetters || []).map(letter => String(letter || '').toUpperCase()));
  if (!normalizedPrompt || !context || !Array.isArray(context.columns)) return null;

  return context.columns.find(column => {
    const header = cleanCellData(column.header || '').toLowerCase();
    if (!header || excluded.has(String(column.letter || '').toUpperCase())) return false;
    return normalizedPrompt.includes(header);
  }) || null;
}

function findContextColumnByPrefix(input, context, excludedLetters) {
  const normalizedInput = cleanCellData(input || '').toLowerCase();
  const excluded = new Set((excludedLetters || []).map(letter => String(letter || '').toUpperCase()));
  if (!normalizedInput || !context || !Array.isArray(context.columns)) return null;

  const matches = context.columns.filter(column => {
    const letter = String(column.letter || '').toUpperCase();
    if (excluded.has(letter)) return false;
    const header = cleanCellData(column.header || '').toLowerCase();
    const label = cleanCellData(column.label || '').toLowerCase();
    return (header && header.startsWith(normalizedInput)) || (label && label.startsWith(normalizedInput));
  });

  return matches.length === 1 ? matches[0] : null;
}

function resolveAgentColumnToken(input, context, excludedLetters) {
  const normalizedInput = cleanCellData(input || '');
  if (!normalizedInput) return null;

  const resolvedExact = resolveExistingColumnReference(normalizedInput, context);
  if (resolvedExact && !(excludedLetters || []).includes(String(resolvedExact.letter || '').toUpperCase())) {
    return resolvedExact;
  }

  const resolvedPrefix = findContextColumnByPrefix(normalizedInput, context, excludedLetters);
  if (resolvedPrefix) return resolvedPrefix;

  return null;
}

function inferAgentTargetColumn(userPrompt, context) {
  const mentions = extractColumnMentions(userPrompt);
  if (mentions.length > 0) {
    const lastMention = mentions[mentions.length - 1];
    const existingColumn = context && Array.isArray(context.columns)
      ? context.columns.find(column => column.letter === lastMention)
      : null;
    return existingColumn || {
      index: convertToColumnNumber(lastMention),
      letter: lastMention,
      header: '',
      label: lastMention
    };
  }

  return findContextColumnByPrompt(userPrompt, context, []);
}

function inferAgentSourceColumn(userPrompt, context, targetColumn) {
  const mentions = extractColumnMentions(userPrompt);
  const targetLetter = targetColumn && targetColumn.letter ? String(targetColumn.letter).toUpperCase() : '';
  if (mentions.length === 1 && String(mentions[0] || '').toUpperCase() !== targetLetter) {
    const existingSingleMention = context && Array.isArray(context.columns)
      ? context.columns.find(column => column.letter === String(mentions[0] || '').toUpperCase())
      : null;
    if (existingSingleMention) return existingSingleMention;
  }

  if (mentions.length > 1) {
    const candidateLetter = mentions.find(letter => String(letter).toUpperCase() !== targetLetter);
    if (candidateLetter) {
      const existingColumn = context && Array.isArray(context.columns)
        ? context.columns.find(column => column.letter === candidateLetter)
        : null;
      if (existingColumn) return existingColumn;
    }
  }

  const headerMatch = findContextColumnByPrompt(userPrompt, context, [
    targetColumn && targetColumn.letter ? targetColumn.letter : ''
  ]);
  if (headerMatch) return headerMatch;

  if (context && Array.isArray(context.columns)) {
    return context.columns.find(column => column.letter !== (targetColumn && targetColumn.letter)) || context.columns[0] || null;
  }

  return null;
}

function shouldAgentInsertTargetColumn(userPrompt, targetColumn, context) {
  if (!targetColumn) return false;
  return promptIncludesAnyKeyword(userPrompt, AGENT_CREATE_COLUMN_KEYWORDS);
}

function inferAgentHeaderName(userPrompt) {
  const promptText = String(userPrompt || '');
  const explicitNameMatch = promptText.match(/ชื่อ\s+([A-Za-z0-9 _-]{2,})/i);
  if (explicitNameMatch && explicitNameMatch[1]) {
    return cleanCellData(explicitNameMatch[1]);
  }
  if (/sentiment/i.test(String(userPrompt || ''))) return 'Sentiment';
  return '';
}

function extractAgentRequestedRowLimit(userPrompt) {
  const promptText = String(userPrompt || '');
  const patterns = [
    /(\d{1,4})\s*(?:rows?|records?|entries|contents?|content|แถว|รายการ|คอนเทนต์|ข้อความ)/gi,
    /(?:first|top|แค่|เพียง|ขอแค่|แรก)\s*(\d{1,4})/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(promptText)) !== null) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }

  return null;
}

function inferAgentInsertPosition(userPrompt, context, currentPosition, fallbackTargetColumn) {
  const adjacentBaseColumn = promptIncludesAnyKeyword(userPrompt, AGENT_ADJACENT_COLUMN_KEYWORDS)
    ? findContextColumnByPrompt(userPrompt, context, [])
    : null;
  if (adjacentBaseColumn) {
    return getColumnLetter(Math.min((adjacentBaseColumn.index || 0) + 1, (context && context.lastColumn ? context.lastColumn : adjacentBaseColumn.index) + 1));
  }

  const explicitPosition = resolveAgentColumnToken(currentPosition, context, []);
  if (explicitPosition) return explicitPosition.letter;
  if (fallbackTargetColumn && fallbackTargetColumn.letter) return fallbackTargetColumn.letter;
  return cleanCellData(currentPosition || '');
}

function normalizeAgentPlanActions(userPrompt, agentState, actions) {
  const context = agentState && agentState.context ? agentState.context : getActiveSheetContext();
  const safeActions = Array.isArray(actions) ? actions : [];
  const inferredTargetColumn = inferAgentTargetColumn(userPrompt, context);

  return safeActions.map(action => {
    const normalized = {
      type: cleanCellData(action && action.type || ''),
      position: cleanCellData(action && action.position || ''),
      headerName: cleanCellData(action && action.headerName || action && action.header || ''),
      sourceColumn: cleanCellData(action && action.sourceColumn || ''),
      targetColumn: cleanCellData(action && action.targetColumn || ''),
      instruction: cleanCellData(action && action.instruction || '')
    };

    if (normalized.type === 'insert_column') {
      normalized.position = inferAgentInsertPosition(userPrompt, context, normalized.position, inferredTargetColumn);
      if (!normalized.headerName) {
        normalized.headerName = inferAgentHeaderName(userPrompt);
      }
    }

    if (normalized.type === 'delete_column' && !normalized.targetColumn) {
      const inferredTarget = inferAgentTargetColumn(userPrompt, context);
      if (inferredTarget && inferredTarget.letter) {
        normalized.targetColumn = inferredTarget.letter;
      }
    }

    if (normalized.type === 'analyze_fill') {
      const resolvedSourceColumn = resolveAgentColumnToken(normalized.sourceColumn, context, [
        normalized.targetColumn ? String(normalized.targetColumn).toUpperCase() : ''
      ]);
      const resolvedTargetColumn = resolveAgentColumnToken(normalized.targetColumn, context, []);

      if (resolvedSourceColumn) {
        normalized.sourceColumn = resolvedSourceColumn.letter;
      }
      if (resolvedTargetColumn) {
        normalized.targetColumn = resolvedTargetColumn.letter;
      }
    }

    return normalized;
  });
}

function resolveAgentDeleteTargetColumn(action, state) {
  const context = state && state.context ? state.context : getActiveSheetContext();
  const explicitTarget = cleanCellData(action && action.targetColumn || '');

  if (explicitTarget) {
    const resolvedExplicit = resolveExistingColumnReference(explicitTarget, context);
    if (resolvedExplicit) return resolvedExplicit;
  }

  const inferredTarget = inferAgentTargetColumn(state && state.userPrompt ? state.userPrompt : '', context);
  if (inferredTarget && inferredTarget.letter) {
    const resolvedInferred = resolveExistingColumnReference(inferredTarget.letter, context);
    if (resolvedInferred) return resolvedInferred;
  }

  return null;
}

function buildAgentNaturalFinalMessage(state, plan, executionLog) {
  const safePlan = plan || { actions: [] };
  const actions = Array.isArray(safePlan.actions) ? safePlan.actions : [];
  const safeExecutionLog = Array.isArray(executionLog) ? executionLog : [];

  const insertAction = actions.find(action => action && action.type === 'insert_column');
  const deleteAction = actions.find(action => action && action.type === 'delete_column');
  const analyzeAction = actions.find(action => action && action.type === 'analyze_fill');
  const writeMatch = safeExecutionLog
    .map(entry => String(entry || '').match(/^Wrote\s+(\d+)\s+results\s+into\s+column\s+([A-Z]{1,3})\.$/))
    .find(Boolean);

  if (deleteAction) {
    const deletedColumn = cleanCellData(deleteAction.targetColumn || '');
    if (deletedColumn) {
      return 'ผมลบคอลัมน์ ' + deletedColumn + ' ให้แล้วครับ';
    }
  }

  if (insertAction && analyzeAction && writeMatch) {
    const headerName = cleanCellData(insertAction.headerName || '');
    const insertedColumn = cleanCellData(insertAction.position || analyzeAction.targetColumn || '');
    const sourceColumn = cleanCellData(analyzeAction.sourceColumn || '');
    const rowsWritten = writeMatch[1];
    const label = headerName ? '"' + headerName + '"' : 'คอลัมน์ ' + insertedColumn;
    return 'ผมเพิ่มคอลัมน์ ' + label + ' ที่ ' + insertedColumn + ' แล้ววิเคราะห์คอลัมน์ ' + sourceColumn + ' และเขียนผลครบ ' + rowsWritten + ' แถวแล้วครับ';
  }

  if (analyzeAction && writeMatch) {
    const sourceColumn = cleanCellData(analyzeAction.sourceColumn || '');
    const targetColumn = writeMatch[2];
    const rowsWritten = writeMatch[1];
    return 'ผมวิเคราะห์คอลัมน์ ' + sourceColumn + ' และเขียนผลลงคอลัมน์ ' + targetColumn + ' ครบ ' + rowsWritten + ' แถวแล้วครับ';
  }

  if (safePlan.finalResponse) {
    return safePlan.finalResponse;
  }

  return 'ผมดำเนินการเสร็จแล้วครับ';
}

function repairOperationalAgentPlan(userPrompt, agentState, plan) {
  const context = agentState && agentState.context ? agentState.context : getActiveSheetContext();
  const existingPlan = plan || { actions: [] };

  if (Array.isArray(existingPlan.actions) && existingPlan.actions.length > 0) {
    return existingPlan;
  }

  if (promptIncludesAnyKeyword(userPrompt, AGENT_DELETE_COLUMN_KEYWORDS)) {
    const targetColumn = inferAgentTargetColumn(userPrompt, context);
    if (!targetColumn || !resolveExistingColumnReference(targetColumn.letter, context)) {
      return null;
    }

    return {
      summary: existingPlan.summary || ('Delete column ' + targetColumn.letter),
      finalResponse: existingPlan.finalResponse || ('Deleting column ' + targetColumn.letter + '.'),
      actions: [
        {
          type: 'delete_column',
          position: '',
          headerName: '',
          sourceColumn: '',
          targetColumn: targetColumn.letter,
          instruction: ''
        }
      ]
    };
  }

  const targetColumn = inferAgentTargetColumn(userPrompt, context);
  const sourceColumn = inferAgentSourceColumn(userPrompt, context, targetColumn);
  if (!sourceColumn || !targetColumn) return null;

  const actions = [];
  if (shouldAgentInsertTargetColumn(userPrompt, targetColumn, context)) {
    actions.push({
      type: 'insert_column',
      position: targetColumn.letter,
      headerName: inferAgentHeaderName(userPrompt),
      sourceColumn: '',
      targetColumn: '',
      instruction: ''
    });
  }

  actions.push({
    type: 'analyze_fill',
    position: '',
    headerName: '',
    sourceColumn: sourceColumn.letter,
    targetColumn: targetColumn.letter,
    instruction: cleanCellData(userPrompt || '')
  });

  return {
    summary: existingPlan.summary || ('Analyze column ' + sourceColumn.letter + ' and write results to column ' + targetColumn.letter),
    finalResponse: existingPlan.finalResponse || ('I will analyze column ' + sourceColumn.letter + ' and write the results to column ' + targetColumn.letter + '.'),
    actions: actions
  };
}

function getAgentPlanningSystemPrompt(strictExecution) {
  if (!strictExecution) return AGENT_MODE_SYSTEM_PROMPT;

  return [
    AGENT_MODE_SYSTEM_PROMPT,
    'This request requires execution, not just explanation.',
    'You must return executable actions in the actions array.',
    'If the user gives a spreadsheet column letter like A, B, or C, treat it as a valid target/source column reference even if the header is blank.',
    'Only use insert_column when the user explicitly asks to create/add/insert a new column or a new named header.'
  ].join('\n');
}

function buildAgentPlan(userPrompt, agentState, options = {}) {
  const agentConfig = resolveAgentModelConfig(agentState && agentState.selectedModel, agentState && agentState.reasoningEffort);
  const strictExecution = Boolean(options && options.strictExecution);
  const payload = {
    model: agentConfig.model,
    messages: [
      { role: 'system', content: getAgentPlanningSystemPrompt(strictExecution) },
      { role: 'user', content: buildAgentPlanningPrompt(userPrompt, agentState) }
    ],
    max_tokens: agentConfig.planningMaxTokens,
    response_format: { type: 'json_object' },
    reasoning: agentConfig.reasoning ? { effort: agentConfig.reasoning } : null
  };

  const rawResult = makeRealUniverseApiCall(payload);
  const parsed = parseJsonResponseText(rawResult);
  const safeActions = Array.isArray(parsed.actions) ? parsed.actions : [];

  return {
    summary: cleanCellData(parsed.summary || 'Plan ready'),
    finalResponse: cleanCellData(parsed.finalResponse || ''),
    actions: normalizeAgentPlanActions(userPrompt, agentState, safeActions
      .filter(action => action && ['insert_column', 'delete_column', 'analyze_fill'].includes(action.type))
      .map(action => ({
        type: action.type,
        position: cleanCellData(action.position || ''),
        headerName: cleanCellData(action.headerName || action.header || ''),
        sourceColumn: cleanCellData(action.sourceColumn || ''),
        targetColumn: cleanCellData(action.targetColumn || ''),
        instruction: cleanCellData(action.instruction || '')
      })))
  };
}

function analyzeAgentBatchValues(action, batchValues) {
  const agentConfig = resolveAgentModelConfig(action.selectedModel, action.reasoningEffort);
  const payload = {
    model: agentConfig.model,
    messages: [
      {
        role: 'system',
        content: 'You analyze spreadsheet rows and return one output per input row. Return a JSON object with a "results" array of exactly the same length as the input rows. Keep outputs concise. For blank input, return an empty string.'
      },
      {
        role: 'user',
        content: JSON.stringify({
          instruction: action.instruction,
          sourceColumn: action.sourceColumn,
          rows: batchValues
        }, null, 2)
      }
    ],
    max_tokens: agentConfig.executionMaxTokens,
    response_format: { type: 'json_object' },
    reasoning: agentConfig.reasoning ? { effort: agentConfig.reasoning } : null
  };

  const rawResult = makeRealUniverseApiCall(payload);
  const parsed = parseJsonResponseText(rawResult);
  const safeResults = Array.isArray(parsed.results) ? parsed.results : [];

  return batchValues.map((row, index) => {
    if (!row.text) return '';
    return cleanCellData(safeResults[index] || '');
  });
}

function advanceAgentState(agentState, nextFields) {
  return {
    ...agentState,
    ...nextFields
  };
}

function processRealUniverseAgentStep(agentState) {
  const state = agentState || {};
  const phase = state.phase || 'bootstrap';
  const agentConfig = resolveAgentModelConfig(state.selectedModel, state.reasoningEffort);

  if (phase === 'bootstrap') {
    const context = getActiveSheetContext();
    const intentType = isAgentOperationalTask(state.userPrompt || '') ? 'operational' : 'ask';
    const nextState = {
      threadId: state.threadId || '',
      phase: 'plan',
      userPrompt: state.userPrompt || '',
      memorySummary: state.memorySummary || '',
      selectedModel: agentConfig.model,
      reasoningEffort: agentConfig.reasoning,
      planRetryCount: 0,
      requestedRowLimit: extractAgentRequestedRowLimit(state.userPrompt || ''),
      context: context,
      intentType: intentType,
      executionLog: []
    };
    const response = {
      done: false,
      events: [
        createAgentTraceEvent(nextState, 'status', 'Reading active sheet', {
          toolName: 'getActiveSheetContext',
          toolResult: {
            sheetName: context.sheetName,
            rowCount: context.rowCount,
            columnCount: context.columnCount
          }
        }),
        createAgentTraceEvent(nextState, 'status', 'Detected ' + context.columnCount + ' columns in ' + context.sheetName, {
          toolName: 'getActiveSheetContext',
          toolResult: {
            columns: context.columns.map(column => ({
              letter: column.letter,
              header: column.header || '',
              label: column.label
            }))
          }
        })
      ],
      nextState: nextState
    };
    return response;
  }

  if (phase === 'plan') {
    const isOperationalTask = isAgentOperationalTask(state.userPrompt || '');
    const retryCount = Number(state.planRetryCount || 0);
    let plan = buildAgentPlan(state.userPrompt || '', state, {
      strictExecution: isOperationalTask && retryCount > 0
    });
    let planRepaired = false;
    if (isOperationalTask && !plan.actions.length) {
      const repairedPlan = repairOperationalAgentPlan(state.userPrompt || '', state, plan);
      if (repairedPlan && Array.isArray(repairedPlan.actions) && repairedPlan.actions.length) {
        plan = repairedPlan;
        planRepaired = true;
      }
    }
    const events = [
      createAgentTraceEvent(state, 'status', 'Planning next steps', {
        intentType: isOperationalTask ? 'operational' : 'ask',
        retryCount: retryCount
      }),
      createAgentTraceEvent(state, 'status', plan.summary || 'Plan ready', {
        intentType: isOperationalTask ? 'operational' : 'ask',
        planSummary: plan.summary || 'Plan ready',
        actions: plan.actions,
        repaired: planRepaired
      })
    ];

    if (planRepaired) {
      events.push(createAgentTraceEvent(state, 'status', 'Recovered executable steps', {
        intentType: 'operational',
        retryCount: retryCount,
        planSummary: plan.summary || 'Recovered executable steps',
        actions: plan.actions,
        repaired: true
      }));
    }

    if (isOperationalTask && !plan.actions.length) {
      if (retryCount < 1) {
        const nextState = {
          ...state,
          phase: 'plan',
          intentType: 'operational',
          planRetryCount: retryCount + 1
        };
        const response = {
          done: false,
          events: events.concat(createAgentTraceEvent(nextState, 'status', 'Refining executable steps', {
            intentType: 'operational',
            retryCount: retryCount + 1,
            error: 'Planner returned no executable actions for an operational task'
          })),
          nextState: nextState
        };
        return response;
      }

      const response = {
        done: true,
        events: events.concat(createAgentTraceEvent(state, 'error', 'Could not build executable steps', {
          intentType: 'operational',
          retryCount: retryCount,
          error: 'Planner returned no executable actions after strict retry',
          actions: []
        })),
        finalMessage: 'ผมเข้าใจว่าเป็นงานที่ต้องลงมือทำกับชีต แต่ยังสร้างขั้นตอนที่รันได้ไม่สำเร็จ กรุณาระบุคอลัมน์ต้นทางหรือปลายทางให้ชัดขึ้นอีกครั้งครับ',
        nextState: null
      };
      return response;
    }

    if (!plan.actions.length) {
      const response = {
        done: true,
        events: events,
        finalMessage: plan.finalResponse || plan.summary || 'Done.',
        nextState: null
      };
      return response;
    }

    const nextState = {
      ...state,
      phase: 'execute',
      intentType: isOperationalTask ? 'operational' : 'ask',
      plan: plan,
      planRetryCount: 0,
      currentActionIndex: 0,
      currentBatchIndex: 0,
      actionRuntime: null,
      executionLog: state.executionLog || []
    };
    const response = {
      done: false,
      events: events,
      nextState: nextState
    };
    return response;
  }

  if (phase === 'execute') {
    const plan = state.plan || { actions: [] };
    const action = plan.actions[state.currentActionIndex];

    if (!action) {
      const executionLog = Array.isArray(state.executionLog) ? state.executionLog : [];
      const finalMessage = buildAgentNaturalFinalMessage(state, plan, executionLog);

      const response = {
        done: true,
        events: [createAgentTraceEvent(state, 'status', 'Agent run complete', {
          finalMessage: finalMessage
        })],
        finalMessage: finalMessage,
        nextState: null
      };
      return response;
    }

    if (action.type === 'insert_column') {
      const result = insertColumnAt(action.position, action.headerName);
      const updatedContext = getActiveSheetContext();
      const executionLog = (state.executionLog || []).concat(
        'Inserted column ' + result.columnLetter + ' with header "' + (result.headerName || result.columnLetter) + '".'
      );

      const nextState = advanceAgentState(state, {
        context: updatedContext,
        currentActionIndex: state.currentActionIndex + 1,
        currentBatchIndex: 0,
        actionRuntime: null,
        executionLog: executionLog
      });
      const response = {
        done: false,
        events: [
          createAgentTraceEvent(state, 'tool_call', 'Inserting column ' + result.columnLetter, {
            toolName: 'insertColumnAt',
            toolInput: {
              position: action.position,
              headerName: action.headerName
            }
          }),
          createAgentTraceEvent(state, 'tool_result', 'Created header "' + (result.headerName || result.columnLetter) + '"', {
            toolName: 'insertColumnAt',
            toolResult: result
          })
        ],
        nextState: nextState
      };
      return response;
    }

    if (action.type === 'delete_column') {
      const resolvedTargetColumn = resolveAgentDeleteTargetColumn(action, state);
      if (!resolvedTargetColumn) {
        return {
          done: true,
          events: [createAgentTraceEvent(state, 'error', 'Could not resolve a column to delete', {
            intentType: state.intentType || '',
            toolName: 'deleteColumnAt',
            toolInput: {
              targetColumn: cleanCellData(action.targetColumn || '')
            },
            error: 'Delete column target could not be resolved'
          })],
          finalMessage: 'ผมหาคอลัมน์ที่ต้องลบไม่เจอ กรุณาระบุคอลัมน์ให้ชัดขึ้นอีกครั้งครับ',
          nextState: null
        };
      }

      const result = deleteColumnAt(resolvedTargetColumn.letter);
      const updatedContext = getActiveSheetContext();
      const executionLog = (state.executionLog || []).concat(
        'Deleted column ' + result.columnLetter + '.'
      );

      const nextState = advanceAgentState(state, {
        context: updatedContext,
        currentActionIndex: state.currentActionIndex + 1,
        currentBatchIndex: 0,
        actionRuntime: null,
        executionLog: executionLog
      });
      const response = {
        done: false,
        events: [
          createAgentTraceEvent(state, 'tool_call', 'Deleting column ' + result.columnLetter, {
            toolName: 'deleteColumnAt',
            toolInput: {
              targetColumn: resolvedTargetColumn.letter
            }
          }),
          createAgentTraceEvent(state, 'tool_result', 'Deleted column ' + result.columnLetter, {
            toolName: 'deleteColumnAt',
            toolResult: result
          })
        ],
        nextState: nextState
      };
      return response;
    }

    if (action.type === 'analyze_fill') {
      let runtime = state.actionRuntime;
      if (!runtime) {
        const sourceColumn = resolveColumnReference(action.sourceColumn);
        const targetColumn = resolveColumnReference(action.targetColumn);
        const lastRow = SpreadsheetApp.getActiveSheet().getLastRow();
        const availableRows = Math.max(lastRow - 1, 0);
        const requestedRowLimit = Number(state.requestedRowLimit || 0);
        const totalRows = requestedRowLimit > 0
          ? Math.min(availableRows, requestedRowLimit)
          : availableRows;
        const totalBatches = totalRows === 0 ? 0 : Math.ceil(totalRows / agentConfig.batchSize);

        runtime = {
          sourceColumn: sourceColumn,
          targetColumn: targetColumn,
          totalRows: totalRows,
          totalBatches: totalBatches
        };
      }

      if (runtime.totalRows === 0) {
        const nextState = advanceAgentState(state, {
          currentActionIndex: state.currentActionIndex + 1,
          currentBatchIndex: 0,
          actionRuntime: null
        });
        const response = {
          done: false,
          events: [createAgentTraceEvent(state, 'status', 'No data rows found in the active sheet', {
            toolName: 'analyze_fill',
            toolInput: {
              sourceColumn: action.sourceColumn,
              targetColumn: action.targetColumn
            }
          })],
          nextState: nextState
        };
        return response;
      }

      const batchIndex = state.currentBatchIndex || 0;
      const startRow = 2 + (batchIndex * agentConfig.batchSize);
      const remainingRows = runtime.totalRows - (batchIndex * agentConfig.batchSize);
      const batchRowCount = Math.min(agentConfig.batchSize, remainingRows);
      const sheet = SpreadsheetApp.getActiveSheet();
      const batchValues = sheet
        .getRange(startRow, runtime.sourceColumn.index, batchRowCount, 1)
        .getDisplayValues()
        .map((row, index) => ({
          rowNumber: startRow + index,
          text: cleanCellData(row[0] || '')
        }));

      const analyzedValues = analyzeAgentBatchValues({
        ...action,
        selectedModel: agentConfig.model,
        reasoningEffort: agentConfig.reasoning
      }, batchValues);
      const writeResult = writeColumnValues(runtime.targetColumn.letter, startRow, analyzedValues);
      SpreadsheetApp.flush();

      const nextBatchIndex = batchIndex + 1;
      const executionLog = state.executionLog || [];
      const resolutionEvents = batchIndex === 0
        ? [
            createAgentTraceEvent(state, 'status', 'Resolved source column ' + runtime.sourceColumn.letter, {
              toolName: 'resolveColumnReference',
              toolResult: runtime.sourceColumn
            }),
            createAgentTraceEvent(state, 'status', 'Resolved target column ' + runtime.targetColumn.letter, {
              toolName: 'resolveColumnReference',
              toolResult: runtime.targetColumn
            }),
            createAgentTraceEvent(state, 'status', 'Rows to process: ' + runtime.totalRows, {
              toolName: 'analyze_fill',
              toolInput: {
                sourceColumn: runtime.sourceColumn.letter,
                targetColumn: runtime.targetColumn.letter
              },
              toolResult: {
                totalRows: runtime.totalRows,
                totalBatches: runtime.totalBatches
              }
            })
          ]
        : [];
      if (nextBatchIndex >= runtime.totalBatches) {
        const completedLog = executionLog.concat(
          'Wrote ' + runtime.totalRows + ' results into column ' + runtime.targetColumn.letter + '.'
        );

        const nextState = advanceAgentState(state, {
          currentActionIndex: state.currentActionIndex + 1,
          currentBatchIndex: 0,
          actionRuntime: null,
          executionLog: completedLog
        });
        const response = {
          done: false,
          events: resolutionEvents.concat([
            createAgentTraceEvent(state, 'tool_call', 'Analyzing rows ' + startRow + '-' + writeResult.endRow + ' from column ' + runtime.sourceColumn.letter, {
              toolName: 'analyze_fill',
              toolInput: {
                sourceColumn: runtime.sourceColumn.letter,
                targetColumn: runtime.targetColumn.letter,
                startRow: startRow,
                batchRowCount: batchRowCount
              }
            }),
            createAgentTraceEvent(state, 'tool_result', 'Wrote results to ' + runtime.targetColumn.letter + startRow + ':' + runtime.targetColumn.letter + writeResult.endRow, {
              toolName: 'writeColumnValues',
              toolResult: writeResult
            })
          ]),
          nextState: nextState
        };
        return response;
      }

      const nextState = advanceAgentState(state, {
        currentBatchIndex: nextBatchIndex,
        actionRuntime: runtime
      });
      const response = {
        done: false,
        events: resolutionEvents.concat([
          createAgentTraceEvent(state, 'tool_call', 'Analyzing rows ' + startRow + '-' + writeResult.endRow + ' from column ' + runtime.sourceColumn.letter, {
            toolName: 'analyze_fill',
            toolInput: {
              sourceColumn: runtime.sourceColumn.letter,
              targetColumn: runtime.targetColumn.letter,
              startRow: startRow,
              batchRowCount: batchRowCount
            }
          }),
          createAgentTraceEvent(state, 'tool_result', 'Wrote results to ' + runtime.targetColumn.letter + startRow + ':' + runtime.targetColumn.letter + writeResult.endRow, {
            toolName: 'writeColumnValues',
            toolResult: writeResult
          })
        ]),
        nextState: nextState
      };
      return response;
    }
  }

  const response = {
    done: true,
    events: [createAgentTraceEvent(state, 'error', 'Unsupported agent state', {
      error: 'Unsupported agent state'
    })],
    finalMessage: 'Agent could not continue this task.',
    nextState: null
  };
  return response;
}

function processRealUniverseAI(prompt, preset = 'action_preset_2', temperature = 0, mode = 'action', turboMode = false, selectedModel = null, reasoningEffort = null) {
  try {
    if (mode === 'action') {
      if (turboMode) {
        return processRealUniverseTurbo(prompt, preset, temperature, selectedModel, reasoningEffort);
      } else {
        return processRealUniverseStandard(prompt, preset, temperature, selectedModel, reasoningEffort);
      }
    } else if (mode === 'array') {
      return processRealUniverseArray(prompt, preset, temperature, selectedModel, reasoningEffort);
    } else if (mode === 'agent') {
      return 'Agent mode uses the live agent loop.';
    } else if (mode === 'image') {
      return processRealUniverseImage(prompt, preset, temperature);
    }

    throw new Error('Invalid mode specified');
  } catch (e) {
    Logger.log('Error in processRealUniverseAI: ' + e.message);
    return 'ERROR: ' + e.message;
  }
}

function isNumeric(value) {
  if (value == null || value === '') return false;
  const cleanedValue = String(value).replace(/,/g, '');
  return !isNaN(cleanedValue) && !isNaN(parseFloat(cleanedValue));
}

function processRealUniverseStandard(prompt, preset, temperature, selectedModel, reasoningEffort) {
  const systemMessage = getRealUniverseSystemMessage(getDynamicPresetSystemMessage(preset, 'action'), 'action');
  const config = resolveModelConfigForMode('action', false, selectedModel);
  const effectiveReasoning = normalizeReasoningEffortForModel(config.model, reasoningEffort);

  let allDataArray = [];
  const rangeList = SpreadsheetApp.getActiveRangeList();
  if (rangeList) {
    const ranges = rangeList.getRanges();

    ranges.forEach(range => {
      let visibleRowsAndNumbers = getVisibleCellsForActionWithRowNumbers(range);
      visibleRowsAndNumbers.forEach(item => {
        const cleanedRow = item.data.map(val => cleanCellData(val));
        if (cleanedRow.some(val => val !== '')) {
          allDataArray.push({
            rowNumber: item.rowNumber,
            data: cleanedRow
          });
        }
      });
    });
  }

  const wordCount = allDataArray
    .map(row => row.data.join(' '))
    .join(' ')
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;

  if (wordCount > 20000) {
    const errorMessage = 'ข้อมูลมีจำนวนมากเกินไป โปรดใช้ 💡 Deep Analysis';
    saveRealUniverseHistory(prompt, errorMessage);
    return errorMessage;
  }

  const ranges = rangeList.getRanges();
  const firstRange = ranges[0];
  const sheetName = firstRange.getSheet().getName();
  const rangeNotation = ranges.map(r => r.getA1Notation()).join(', ');
  const totalCols = firstRange.getNumColumns();
  const totalRowsVisible = allDataArray.length;
  const rangeInfo = `Selected Range: ${sheetName}!${rangeNotation} (${totalCols} columns, ${totalRowsVisible} visible rows)`;

  const dataAnalysis = analyzeDataStructure(allDataArray);

  let enhancedPrompt = prompt;
  let enhancedSystemMessage = systemMessage;

  if (dataAnalysis.dataType === 'content_only') {
    enhancedSystemMessage += '\n\nคุณกำลังวิเคราะห์ข้อมูลเนื้อหา/ข้อความ:\n' +
      '- วิเคราะห์ตาม Preset หลักที่กำหนด\n' +
      '- ห้ามอ้างอิงเลข Row ที่นำมาวิเคราะห์ในคำตอบเด็ดขาด\n';

    enhancedPrompt = formatContentOnlyData(allDataArray, prompt, rangeInfo);

  } else if (dataAnalysis.dataType === 'mixed_data') {
    const calculations = performCalculations(allDataArray, dataAnalysis);

    enhancedSystemMessage += '\n\nคุณกำลังวิเคราะห์ข้อมูลแบบผสม (ข้อความ + ตัวเลข):\n' +
      '- ใช้ผลการคำนวณที่แม่นยำจาก pre-processing\n' +
      '- วิเคราะห์ตาม Preset หลักที่กำหนด\n' +
      '- ห้ามอ้างอิงเลข Row ที่นำมาวิเคราะห์ในคำตอบเด็ดขาด\n';

    enhancedPrompt = formatMixedData(allDataArray, calculations, prompt, rangeInfo);
  }

  const payload = {
    model: config.model,
    messages: [
      { role: 'system', content: enhancedSystemMessage },
      { role: 'user', content: enhancedPrompt }
    ],
    temperature: temperature,
    max_tokens: config.max_tokens,
    reasoning: effectiveReasoning ? { effort: effectiveReasoning } : undefined
  };

  const result = makeRealUniverseApiCallWithRetry(payload);
  saveRealUniverseHistory(prompt + ' (Smart)', result);
  return result;
}

function getDynamicPresetSystemMessage(presetKey, mode) {
  try {
    const preset = getPresetById(mode, presetKey);
    if (preset) return preset.prompt;

    throw new Error('No presets available for mode: ' + mode);
  } catch (e) {
    Logger.log('Error getting dynamic preset: ' + e.message);
    throw e;
  }
}

function analyzeDataStructure(dataArray) {
  if (!dataArray || dataArray.length === 0) {
    return { dataType: 'empty', columns: [] };
  }

  const sampleRow = dataArray[0].data;
  const columnAnalysis = [];

  for (let colIndex = 0; colIndex < sampleRow.length; colIndex++) {
    const columnValues = dataArray.map(row => row.data[colIndex]).filter(val => val !== '');
    if (columnValues.length === 0) continue;

    const numericValues = columnValues.filter(val => isNumeric(val));
    const uniqueValues = [...new Set(columnValues)];

    const numericRatio = numericValues.length / columnValues.length;
    const hasDuplicates = uniqueValues.length < columnValues.length;
    const duplicateRatio = hasDuplicates ? (columnValues.length - uniqueValues.length) / columnValues.length : 0;

    const analysis = {
      index: colIndex,
      type: 'unknown',
      hasNumbers: numericValues.length > 0,
      isNumeric: numericRatio > 0.8,
      isCategory: hasDuplicates && uniqueValues.length >= 2 && uniqueValues.length <= 20 && duplicateRatio > 0.2,
      isText: numericRatio < 0.3,
      uniqueCount: uniqueValues.length,
      totalCount: columnValues.length
    };

    if (analysis.isNumeric)      analysis.type = 'number';
    else if (analysis.isCategory) analysis.type = 'category';
    else if (analysis.isText)     analysis.type = 'text';
    else                          analysis.type = 'mixed';

    columnAnalysis.push(analysis);
  }

  const hasNumbers = columnAnalysis.some(col => col.type === 'number');
  const hasCategories = columnAnalysis.some(col => col.type === 'category');
  const hasText = columnAnalysis.some(col => col.type === 'text');

  let dataType = 'content_only';
  if (hasNumbers && (hasCategories || hasText)) dataType = 'mixed_data';

  return {
    dataType: dataType,
    columns: columnAnalysis,
    totalRows: dataArray.length,
    numberColumns: columnAnalysis.filter(col => col.type === 'number'),
    categoryColumns: columnAnalysis.filter(col => col.type === 'category'),
    textColumns: columnAnalysis.filter(col => col.type === 'text'),
    mixedColumns: columnAnalysis.filter(col => col.type === 'mixed')
  };
}

function formatContentOnlyData(dataArray, userPrompt, rangeInfo) {
  const contentText = dataArray.map(row =>
    `Row ${row.rowNumber}: ${row.data.filter(val => val !== '').join(' | ')}`
  ).join('\n');

  return `${userPrompt}\n\n${rangeInfo}\n\nเนื้อหาที่ต้องวิเคราะห์:\n${contentText}`;
}

function performCalculations(dataArray, analysis) {
  const calculations = { summary: {}, groups: {}, totals: {} };

  try {
    analysis.numberColumns.forEach(numCol => {
      const values = dataArray
        .map(row => row.data[numCol.index])
        .filter(val => isNumeric(val))
        .map(val => parseFloat(String(val).replace(/,/g, '')));
      calculations.totals[`column_${numCol.index}`] = {
        sum: values.reduce((sum, val) => sum + val, 0),
        count: values.length
      };
    });

    analysis.categoryColumns.forEach(catCol => {
      analysis.numberColumns.forEach(numCol => {
        const groupKey = `${catCol.index}_to_${numCol.index}`;
        const groups = {};

        dataArray.forEach(row => {
          const category = row.data[catCol.index];
          const value = row.data[numCol.index];
          if (category && isNumeric(value)) {
            if (!groups[category]) groups[category] = [];
            groups[category].push(parseFloat(String(value).replace(/,/g, '')));
          }
        });

        const groupSummaries = {};
        Object.keys(groups).forEach(category => {
          const values = groups[category];
          groupSummaries[category] = {
            sum: values.reduce((sum, val) => sum + val, 0),
            count: values.length
          };
        });

        calculations.groups[groupKey] = groupSummaries;
      });
    });

  } catch (e) {
    Logger.log('Error in calculations: ' + e.message);
    calculations.error = 'Could not complete all calculations';
  }

  return calculations;
}

function formatMixedData(dataArray, calculations, userPrompt, rangeInfo) {
  const rawDataText = dataArray.map(row => `Row ${row.rowNumber}: ${row.data.join(', ')}`).join('\n');

  let calculationsText = '\nผลการคำนวณ (Pre-calculated Results):\n';

  if (Object.keys(calculations.totals).length > 0) {
    calculationsText += '\nผลรวมแต่ละคอลัมน์:\n';
    Object.entries(calculations.totals).forEach(([key, data]) => {
      calculationsText += `- คอลัมน์ ${key}: รวม ${data.sum.toLocaleString()} จาก ${data.count} รายการ\n`;
    });
  }

  if (Object.keys(calculations.groups).length > 0) {
    calculationsText += '\nผลรวมแต่ละกลุ่ม:\n';
    Object.entries(calculations.groups).forEach(([groupKey, groupData]) => {
      calculationsText += `\nการจัดกลุ่ม ${groupKey}:\n`;
      Object.entries(groupData).forEach(([category, data]) => {
        calculationsText += `- ${category}: รวม ${data.sum.toLocaleString()} จาก ${data.count} รายการ\n`;
      });
    });
  }

  return `${userPrompt}\n\n${rangeInfo}\n\nข้อมูลดิบ:\n${rawDataText}${calculationsText}\n\nคำสั่ง: ใช้ผลการคำนวณข้างต้นในการวิเคราะห์และตอบคำถามอย่างแม่นยำ`;
}

function processRealUniverseTurbo(userPrompt, presetName, temperature, selectedModel, reasoningEffort) {
  const reduceSystemMessage = getRealUniverseSystemMessage(getDynamicPresetSystemMessage(presetName, 'action'), 'action');
  const config = resolveModelConfigForMode('action', true, selectedModel);
  const effectiveReasoning = normalizeReasoningEffortForModel(config.model, reasoningEffort);

  const rangeList = SpreadsheetApp.getActiveRangeList();
  if (!rangeList) throw new Error('No cells selected.');

  const ranges = rangeList.getRanges();
  const firstRange = ranges[0];
  const sheetName = firstRange.getSheet().getName();
  const rangeNotation = ranges.map(r => r.getA1Notation()).join(', ');

  let allDataLines = [];

  ranges.forEach(range => {
    const visibleValuesAndRows = getVisibleCellsForActionWithRowNumbers(range);
    visibleValuesAndRows.forEach(item => {
      const processedRow = item.data.map(val => cleanCellData(val)).filter(val => val !== '').join(', ');
      if (processedRow) allDataLines.push(`Row ${item.rowNumber}: ${processedRow}`);
    });
  });

  const totalRowsVisible = allDataLines.length;
  const totalCols = firstRange.getNumColumns();
  const rangeInfo = `Selected Range: ${sheetName}!${rangeNotation} (${totalCols} columns, ${totalRowsVisible} visible rows)`;

  if (totalRowsVisible > MAX_TOTAL_ROWS_TURBO)
    throw new Error('จำนวนแถวที่มองเห็นได้เกินขีดจำกัด: ' + totalRowsVisible + ' > ' + MAX_TOTAL_ROWS_TURBO);

  const mapSystemMessage =
    'data analysis assistant specializing in processing large datasets in chunks.\n' +
    'DATA CONTEXT: ' + rangeInfo + '\n' +
    'USER REQUEST: "' + userPrompt + '"\n' +
    'Extract and summarize information from data chunks relevant to the user request.\n' +
    'Data format: Row <number>: value1, value2, value3\n' +
    'Return JSON format: { "row": "<start-end>", "chunk": <number>, "summary": "<focused_summary>" }\n' +
    'Requirements:\n- Summary in Thai\n- 700-800 words\n- Focus only on relevant information';

  const dataChunks = chunkDataByCharLimit(allDataLines, TURBO_CHUNK_CHAR_LIMIT_ACTION);
  const summaries = [];

  for (let i = 0; i < dataChunks.length; i++) {
    const chunk = dataChunks[i];
    if (!chunk || chunk.trim() === '') continue;

    const chunkRowCount = chunk.split('\n').length;

    const payload = {
      model: config.model,
      messages: [
        { role: 'system', content: mapSystemMessage },
        { role: 'user', content: 'ข้อมูลส่วนหนึ่งของการวิเคราะห์: "' + userPrompt + '"\nChunk ' + (i + 1) + '/' + dataChunks.length + ' (' + chunkRowCount + ' rows):\n' + chunk }
      ],
      temperature: temperature,
      max_tokens: 4096,
      response_format: { "type": "json_object" },
      reasoning: effectiveReasoning ? { effort: effectiveReasoning } : undefined
    };

    try {
      const result = makeRealUniverseApiCallWithRetry(payload);
      const summary = JSON.parse(result);
      summaries.push(summary);
    } catch (e) {
      summaries.push({ row: (i + 1).toString(), chunk: i + 1, summary: 'Failed to process chunk' });
    }
  }

  const combinedSummaries = JSON.stringify(summaries, null, 2);
  const finalContent = 'Based on these summaries:\n\n' + combinedSummaries + '\n\nAnswer the user request: "' + userPrompt + '"';

  const finalPayload = {
    model: config.model,
    messages: [
      { role: 'system', content: reduceSystemMessage + '\n\nADDITIONAL CONTEXT: You are analyzing summaries from multiple data chunks. Combine insights from all chunks to create a comprehensive big picture analysis.\n\nRESPONSE REQUIREMENTS:\n- Provide detailed analysis with specific examples and numbers\n- Answer must be between 1000-1500 words\n- Include comprehensive insights from all data chunks\n\n- เริ่มตอบด้วย "🤓 ได้เลยครับตามที่คุณต้องการให้ [คำสั่ง]" และจบด้วย "หวังว่าข้อมูลนี้จะตอบโจทย์ที่ต้องการนะครับ😊"' },
      { role: 'user', content: finalContent }
    ],
    temperature: temperature,
    max_tokens: config.max_tokens,
    reasoning: effectiveReasoning ? { effort: effectiveReasoning } : undefined
  };

  const result = makeRealUniverseApiCallWithRetry(finalPayload);
  saveRealUniverseHistory(userPrompt + ' (Turbo)', result);
  return result;
}

/**
 * [OPTIMIZED] Helper function to get row metadata for the entire sheet using Sheets API.
 */
function getSheetRowMetadata(sheet) {
  const spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
  const sheetName = sheet.getName();
  try {
    const response = Sheets.Spreadsheets.get(spreadsheetId, {
      ranges: [sheetName],
      fields: 'sheets.properties,sheets.data.rowMetadata'
    });
    const sheetData = response.sheets && response.sheets.length > 0 ? response.sheets[0] : null;
    return sheetData && sheetData.data && sheetData.data.length > 0 ? sheetData.data[0].rowMetadata : [];
  } catch (e) {
    Logger.log('Error fetching sheet row metadata from Sheets API: ' + e.message);
    return [];
  }
}

function hasHiddenRowsInRange(range) {
  const sheet = range.getSheet();
  const rowMetadata = getSheetRowMetadata(sheet);

  if (!rowMetadata || rowMetadata.length === 0) {
    const filter = sheet.getFilter();
    if (!filter) return false;
    const startRow = range.getRow();
    const numRows = range.getNumRows();
    try {
      for (let i = 0; i < numRows; i++) {
        const actualRowNumber = startRow + i;
        if (sheet.isRowHiddenByFilter(actualRowNumber) || sheet.isRowHiddenByUser(actualRowNumber)) {
          return true;
        }
      }
    } catch (e) {
      Logger.log('Fallback check for hidden rows failed: ' + e.message);
      return false;
    }
    return false;
  }

  const startRow = range.getRow();
  const numRows = range.getNumRows();

  for (let i = 0; i < numRows; i++) {
    const actualRowIndexInMetadata = startRow + i - 1;
    if (actualRowIndexInMetadata >= 0 && actualRowIndexInMetadata < rowMetadata.length) {
      if (rowMetadata[actualRowIndexInMetadata].hiddenByFilter || rowMetadata[actualRowIndexInMetadata].hiddenByUser) {
        return true;
      }
    }
  }
  return false;
}

function convertToScatteredSelection(range) {
  const sheet = range.getSheet();
  const startRow = range.getRow();
  const numRows = range.getNumRows();

  let visibleCells = [];
  const allValuesInSelectedRange = range.getValues();
  const rowMetadata = getSheetRowMetadata(sheet);

  for (let i = 0; i < numRows; i++) {
    const actualRowNumber = startRow + i;
    const actualRowIndexInMetadata = actualRowNumber - 1;

    if (actualRowIndexInMetadata >= 0 && actualRowIndexInMetadata < rowMetadata.length &&
        !(rowMetadata[actualRowIndexInMetadata].hiddenByFilter || rowMetadata[actualRowIndexInMetadata].hiddenByUser)) {

      const rowData = allValuesInSelectedRange[i];
      const cleanedCells = rowData.map(val => cleanCellData(val)).filter(val => val !== '');
      const processedRow = cleanedCells.join(' | ');
      if (processedRow !== '') visibleCells.push({ rowNumber: actualRowNumber, data: processedRow });
    }
  }

  return visibleCells;
}

function getVisibleCellsOnly(ranges) {
  let visibleData = [];

  ranges.forEach(range => {
    if (hasHiddenRowsInRange(range)) {
      const scatteredCells = convertToScatteredSelection(range);
      visibleData = visibleData.concat(scatteredCells);
    } else {
      const values = range.getValues();
      const startRow = range.getRow();

      values.forEach((row, rowIndex) => {
        const actualRowNumber = startRow + rowIndex;
        const cleanedCells = row.map(cellValue => cleanCellData(cellValue)).filter(cleanValue => cleanValue !== '');
        const processedRow = cleanedCells.join(' | ');
        if (processedRow !== '') visibleData.push({ rowNumber: actualRowNumber, data: processedRow });
      });
    }
  });

  return visibleData;
}

function getVisibleCellsForActionWithRowNumbers(range) {
  const sheet = range.getSheet();
  const rowMetadata = getSheetRowMetadata(sheet);

  let hasActiveFilterOrHiddenRows = false;
  if (rowMetadata && rowMetadata.length > 0) {
    for (let i = 0; i < rowMetadata.length; i++) {
      if (rowMetadata[i].hiddenByFilter || rowMetadata[i].hiddenByUser) {
        hasActiveFilterOrHiddenRows = true;
        break;
      }
    }
  }

  const startRow = range.getRow();
  const numRows = range.getNumRows();
  const allValuesInSelectedRange = range.getValues();

  let visibleRowsAndNumbers = [];

  if (!hasActiveFilterOrHiddenRows) {
    for (let i = 0; i < numRows; i++) {
      visibleRowsAndNumbers.push({
        data: allValuesInSelectedRange[i],
        rowNumber: startRow + i
      });
    }
    return visibleRowsAndNumbers;
  }

  for (let i = 0; i < numRows; i++) {
    const actualRowNumber = startRow + i;
    const actualRowIndexInMetadata = actualRowNumber - 1;

    if (actualRowIndexInMetadata >= 0 && actualRowIndexInMetadata < rowMetadata.length &&
        !(rowMetadata[actualRowIndexInMetadata].hiddenByFilter || rowMetadata[actualRowIndexInMetadata].hiddenByUser)) {
      visibleRowsAndNumbers.push({
        data: allValuesInSelectedRange[i],
        rowNumber: actualRowNumber
      });
    }
  }
  return visibleRowsAndNumbers;
}

function processRealUniverseArray(prompt, preset, temperature, selectedModel, reasoningEffort) {
  try {
    const systemMessage = getRealUniverseSystemMessage(getDynamicPresetSystemMessage(preset, 'array'), 'array');
    const config = resolveModelConfigForMode('array', false, selectedModel);
    const effectiveReasoning = normalizeReasoningEffortForModel(config.model, reasoningEffort);
    const rangeList = SpreadsheetApp.getActiveRangeList();
    if (!rangeList) return [['ไม่มีเซลล์ที่เลือก']];

    const ranges = rangeList.getRanges();
    if (ranges.length === 0) return [['ไม่มีข้อมูลให้วิเคราะห์']];

    const ui = SpreadsheetApp.getUi();
    const userResponse = ui.prompt("ระบุคอลัมน์ที่ต้องการให้เขียนผลลัพธ์ (ตัวอักษร เช่น D):");
    if (userResponse.getSelectedButton() !== ui.Button.OK) return [['ยกเลิกการทำงาน']];

    const targetCol = convertToColumnNumber(userResponse.getResponseText());
    if (!targetCol || isNaN(targetCol)) {
      ui.alert("คอลัมน์ไม่ถูกต้อง");
      return [['คอลัมน์ไม่ถูกต้อง']];
    }

    let sheetRef = ranges[0].getSheet();

    let allRowsData = getVisibleCellsOnly(ranges);

    if (allRowsData.length === 0) return [['ไม่มีข้อมูลให้วิเคราะห์']];
    if (allRowsData.length > MAX_TOTAL_ROWS_ARRAY) {
      return [['จำนวนแถวมากเกินไป (เกิน ' + MAX_TOTAL_ROWS_ARRAY + ' แถว)']];
    }

    const batchSize = Math.min(MAX_ROWS_PER_BATCH_ARRAY, allRowsData.length);
    const numBatches = Math.ceil(allRowsData.length / batchSize);
    const allResults = new Array(allRowsData.length).fill('ไม่สามารถวิเคราะห์ได้');

    for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, allRowsData.length);
      const currentBatch = allRowsData.slice(startIndex, endIndex);

      const batchDataForAI = currentBatch.map(item => 'แถวที่ ' + item.rowNumber + ': ' + item.data).join('\n');

      const enhancedSystemMessage = systemMessage + '\n\nReturn JSON array format: [{"row": <number>, "result": "<analysis_result>"}]\nMust have exactly ' + currentBatch.length + ' results.';

      const content = prompt + '\n\nข้อมูลที่ต้องวิเคราะห์:\n' + batchDataForAI + '\n\nReturn JSON array with ' + currentBatch.length + ' results.';

      const payload = {
        model: config.model,
        messages: [
          { role: 'system', content: enhancedSystemMessage },
          { role: 'user', content: content }
        ],
        temperature: temperature,
        max_tokens: config.max_tokens,
        reasoning: effectiveReasoning ? { effort: effectiveReasoning } : undefined
      };

      try {
        const rawResult = makeRealUniverseApiCall(payload);
        let cleanedResponse = rawResult.trim();

        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }

        const batchResults = JSON.parse(cleanedResponse);

        batchResults.forEach(item => {
          const originalItemIndex = allRowsData.findIndex(data => data.rowNumber === item.row);
          if (originalItemIndex !== -1) {
            allResults[originalItemIndex] = item.result || 'ไม่สามารถวิเคราะห์ได้';
          }
        });

      } catch (e) {
        currentBatch.forEach(item => {
          const originalItemIndex = allRowsData.findIndex(data => data.rowNumber === item.rowNumber);
          if (originalItemIndex !== -1) {
            allResults[originalItemIndex] = 'ข้อผิดพลาด: ไม่สามารถประมวลผลได้';
          }
        });
        Logger.log(`Error processing batch: ${e.message}`);
      }

      currentBatch.forEach(item => {
        const originalItemIndex = allRowsData.findIndex(data => data.rowNumber === item.rowNumber);
        if (originalItemIndex !== -1) {
          try {
            const targetCell = sheetRef.getRange(item.rowNumber, targetCol, 1, 1);
            targetCell.setValue(allResults[originalItemIndex]);
          } catch (e) {
            Logger.log('Error writing to cell ' + item.rowNumber + ', ' + targetCol + ': ' + e.message);
          }
        }
      });

      SpreadsheetApp.flush();
      if (batchIndex < numBatches - 1) Utilities.sleep(500);
    }

    return [['ผลลัพธ์ถูกเขียนในคอลัมน์ที่คุณระบุ (จำนวน ' + allRowsData.length + ' แถว)']];

  } catch (error) {
    Logger.log('Error in processRealUniverseArray: ' + error.toString());
    return [['ข้อผิดพลาด: ' + error.toString()]];
  }
}

function processRealUniverseImage(prompt, preset, temperature) {
  try {
    const config = MODEL_CONFIG.image;

    let contextData = '';
    const rangeList = SpreadsheetApp.getActiveRangeList();
    if (rangeList) {
      const ranges = rangeList.getRanges();
      ranges.forEach(range => {
        const values = range.getValues();
        values.forEach(row => {
          const cellText = row.filter(cell => cell !== '').join(' ');
          if (cellText) contextData += cellText + ' ';
        });
      });
    }

    const promptTemplate = getRealUniverseSystemMessage(getDynamicPresetSystemMessage(preset, 'image'), 'image');

    const analysisPayload = {
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: promptTemplate },
        { role: 'user', content: `วิเคราะห์และสร้าง detailed prompt จากเนื้อหา: "${contextData.trim()}"` }
      ],
      temperature: temperature,
      max_tokens: 2000
    };

    const detailedPrompt = makeRealUniverseApiCall(analysisPayload);

    const imagePayload = {
      model: config.model,
      prompt: detailedPrompt,
      size: config.size,
      quality: config.quality,
      n: config.n
    };

    const result = makeRealUniverseImageApiCall(imagePayload);

    const combinedPrompt = contextData ? `${prompt}: ${contextData.trim()}` : prompt;

    const downloadUrl = insertImageToSheet(result.imageUrl, combinedPrompt);

    if (downloadUrl) {
      const message = `🎨 ภาพถูกสร้างเรียบร้อยแล้ว!\n\n📥 ดาวน์โหลด: ${downloadUrl}`;
      saveRealUniverseHistory(prompt + ' (Smart Image)', message);
      return message;
    } else {
      throw new Error('ไม่สามารถแทรกภาพในชีตได้');
    }

  } catch (error) {
    Logger.log('Error in processRealUniverseImage: ' + error.toString());
    return 'ข้อผิดพลาดในการสร้างภาพ: ' + error.toString();
  }
}

/* ------------------ API AND HELPER FUNCTIONS ------------------ */

/**
 * Decide which API to use.
 * - 'responses' for GPT-5 family, gpt-5-codex, codex-mini-latest, and o-series
 * - 'chat' for others (e.g., gpt-4.1)
 */
function getApiTypeForModel(modelName) {
  if (!modelName) return 'chat';
  const m = String(modelName).toLowerCase();

  const isGpt5 = m.startsWith('gpt-5');
  const isCodexMini = m.includes('codex-mini');
  const isOseries = m.startsWith('o'); // o3, o4, o4-mini, ฯลฯ
  const isGpt5Codex = m.includes('gpt-5-codex');

  if (isGpt5 || isCodexMini || isOseries || isGpt5Codex) return 'responses';
  return 'chat';
}

/**
 * Build request body for the chosen API from a chat-style logical payload.
 * NOTE: Responses API — ไม่ส่ง temperature (บางรุ่นไม่รองรับ)
 */
function buildRequestBodyForApi(apiType, payload) {
  const { model, messages, temperature, max_tokens, response_format, reasoning, text } = payload || {};
  if (apiType === 'responses') {
    const body = {
      model: model,
      input: messages
      // ไม่ส่ง temperature ใน Responses API เพื่อหลีกเลี่ยง Unsupported parameter
    };
    if (typeof max_tokens !== 'undefined') {
      body.max_output_tokens = max_tokens; // map เฉพาะไปยังชื่อที่รองรับ
    }
    if (text) {
      body.text = { ...text };
    }
    if (response_format) {
      body.text = {
        ...(body.text || {}),
        format: response_format
      };
    }
    if (reasoning) {
      body.reasoning = reasoning;
    }
    return body;
  } else {
    const body = {
      model: model,
      messages: messages
    };
    if (typeof temperature !== 'undefined') {
      body.temperature = temperature;
    }
    if (typeof max_tokens !== 'undefined') {
      body.max_tokens = max_tokens;
    }
    if (response_format) {
      body.response_format = response_format;
    }
    return body;
  }
}

/**
 * Extract text from API response.
 */
function extractTextFromApiResponse(apiType, resJson) {
  try {
    if (apiType === 'responses') {
      if (typeof resJson.output_text === 'string' && resJson.output_text.trim() !== '') {
        return resJson.output_text.trim();
      }
      if (Array.isArray(resJson.output)) {
        const texts = [];
        resJson.output.forEach(part => {
          if (part && Array.isArray(part.content)) {
            part.content.forEach(c => {
              if (c && typeof c.text === 'string') texts.push(c.text);
            });
          }
        });
        if (texts.length) return texts.join('').trim();
      }
      if (Array.isArray(resJson.content)) {
        const texts = [];
        resJson.content.forEach(c => {
          if (c && typeof c.text === 'string') texts.push(c.text);
          if (c && Array.isArray(c.content)) {
            c.content.forEach(cc => {
              if (cc && typeof cc.text === 'string') texts.push(cc.text);
            });
          }
        });
        if (texts.length) return texts.join('').trim();
      }
      return JSON.stringify(resJson);
    } else {
      if (resJson && resJson.choices && resJson.choices[0] && resJson.choices[0].message) {
        const out = resJson.choices[0].message.content;
        if (typeof out === 'string') return out.trim();
      }
      return JSON.stringify(resJson);
    }
  } catch (e) {
    Logger.log('extractTextFromApiResponse error: ' + e.message);
    return JSON.stringify(resJson);
  }
}

/**
 * Make API call (auto-route).
 */
function makeRealUniverseApiCall(payload) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('REALUNIVERSE_API_KEY');
  if (!apiKey) throw new Error('API Key not set. Please use the menu to set it up.');

  const apiType = getApiTypeForModel(payload && payload.model);
  const endpoint = apiType === 'responses' ? RESPONSES_API_URL : API_URL;
  const requestBody = buildRequestBodyForApi(apiType, payload);

  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + apiKey },
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);
  const status = response.getResponseCode();
  const bodyText = response.getContentText();
  let res;
  try {
    res = JSON.parse(bodyText);
  } catch (err) {
    throw new Error('API Response parse error: ' + bodyText);
  }

  if (status >= 400) {
    const errMsg = res && res.error && res.error.message ? res.error.message : bodyText;
    throw new Error('API Error: ' + errMsg);
  }

  const text = extractTextFromApiResponse(apiType, res);
  if (!text || !String(text).trim()) {
    throw new Error('Invalid response from AI.');
  }
  return String(text).trim();
}

function makeRealUniverseApiCallWithRetry(payload, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return makeRealUniverseApiCall(payload);
    } catch (error) {
      lastError = error;
      Logger.log(`API call attempt ${attempt + 1} failed: ${error.message}`);

      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000;
        Utilities.sleep(delayMs);
      }
    }
  }

  throw new Error(`API call failed after ${maxRetries + 1} attempts. Last error: ${lastError.message}`);
}

function makeRealUniverseImageApiCall(payload) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('REALUNIVERSE_API_KEY');
  if (!apiKey) throw new Error('API Key not set. Please use the menu to set it up.');

  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(IMAGE_API_URL, options);
  const res = JSON.parse(response.getContentText());

  if (response.getResponseCode() >= 400) {
    throw new Error('Image API Error: ' + (res.error ? res.error.message : response.getContentText()));
  }

  if (!res.data || !res.data[0] || !res.data[0].url) {
    throw new Error('Invalid response from Image API.');
  }

  return {
    imageUrl: res.data[0].url,
    revisedPrompt: res.data[0].revised_prompt || payload.prompt
  };
}

function insertImageToSheet(imageUrl, description) {
  try {
    const response = UrlFetchApp.fetch(imageUrl);
    let blob = response.getBlob();

    blob = Utilities.newBlob(
      blob.getBytes(),
      'image/jpeg',
      'resized_image.jpg'
    );

    let folder;
    const folders = DriveApp.getFoldersByName('RealUniverse Images');
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder('RealUniverse Images');
    }

    const file = folder.createFile(blob.setName('RealUniverse_' + new Date().getTime() + '.jpg'));

    const thumbnailBlob = blob.setName('thumb_' + new Date().getTime() + '.jpg');

    const sheet = SpreadsheetApp.getActiveSheet();
    sheet.insertImage(thumbnailBlob, 1, 3);

    return file.getUrl();

  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return false;
  }
}

function getRealUniverseSystemMessage(cellReference, mode = 'action') {
  if (cellReference && typeof cellReference === 'string' && !cellReference.includes('Preset!')) {
    return cellReference.trim();
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Preset');

  if (!sheet) {
    throw new Error('❌ ไม่พบ Sheet "Preset" โปรดสร้าง Sheet ชื่อ "Preset" ก่อนใช้งาน');
  }

  try {
    if (cellReference.includes('Preset!')) {
      const cellAddr = cellReference.split('!')[1];
      const value = sheet.getRange(cellAddr).getValue();
      if (value && String(value).trim()) {
        return String(value).trim();
      } else {
        throw new Error(`❌ เซลล์ ${cellReference} ใน Sheet "Preset" ว่างเปล่า`);
      }
    }
  } catch (e) {
    if (e.message.includes('❌')) throw e;
    throw new Error('❌ เกิดข้อผิดพลาดในการอ่าน Sheet "Preset": ' + e.message);
  }

  if (mode === 'array') {
    return 'You are an AI that analyzes data and returns results in JSON format. For each row of input data, provide a JSON object in the format {"row": <row_number>, "result": "<analysis_result>"}. Return an array of these objects.';
  } else if (mode === 'image') {
    return 'Create a detailed image based on this description: {prompt}';
  } else {
    return 'You are a helpful AI assistant that analyzes spreadsheet data and provides insights in Thai language.';
  }
}

function chunkDataByCharLimit(lines, charLimit) {
  if (!lines || lines.length === 0) return [];

  const chunks = [];
  let currentChunkLines = [];
  let currentCharCount = 0;

  for (const line of lines) {
    const processedLine = line.trim() === '' ? '(แถวว่าง)' : line;
    const lineLength = processedLine.length + 1;

    if (currentCharCount + lineLength > charLimit && currentChunkLines.length > 0) {
      chunks.push(currentChunkLines.join('\n'));
      currentChunkLines = [processedLine];
      currentCharCount = lineLength;
    } else {
      currentChunkLines.push(processedLine);
      currentCharCount += lineLength;
    }
  }

  if (currentChunkLines.length > 0) {
    chunks.push(currentChunkLines.join('\n'));
  }

  return chunks;
}

function cleanCellData(cellValue) {
  if (cellValue == null || cellValue === '') return '';

  return String(cellValue)
    .replace(/[\x00-\x1F\x7F-\x9F\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[|:]/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/["""'']/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["']|["']$/g, '');
}

function convertToColumnNumber(input) {
  input = String(input).toUpperCase().trim();
  if (!isNaN(input) && Number(input) > 0) return parseInt(input, 10);
  let result = 0;
  for (let i = 0; i < input.length; i++) {
    result = result * 26 + (input.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result > 0 ? result : null;
}

/* ------------------ UTILITY FUNCTIONS ------------------ */

function saveRealUniverseHistory(question, answer) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CHAT_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(CHAT_SHEET_NAME);
      sheet.getRange('A1:D1').setValues([['Timestamp', 'Question', 'Answer', 'Selected Cells']]).setFontWeight('bold');
    }
    const selection = getRealUniverseSelectedCellInfo();
    sheet.appendRow([new Date(), question, String(answer), selection]);
  } catch (e) {
    Logger.log('Error saving history: ' + e.message);
  }
}

function createAgentTrace(state, overrides) {
  const safeState = state || {};
  return {
    threadId: safeState.threadId || '',
    phase: safeState.phase || 'bootstrap',
    userPrompt: safeState.userPrompt || '',
    intentType: safeState.intentType || '',
    selectedModel: safeState.selectedModel || '',
    reasoningEffort: safeState.reasoningEffort || '',
    retryCount: Number(safeState.planRetryCount || 0),
    sheetName: safeState.context && safeState.context.sheetName ? safeState.context.sheetName : '',
    sheetRows: safeState.context && typeof safeState.context.rowCount !== 'undefined' ? safeState.context.rowCount : '',
    timestamp: new Date().toISOString(),
    ...(overrides || {})
  };
}

function createAgentTraceEvent(state, type, label, traceOverrides) {
  return {
    type: type,
    label: label,
    trace: createAgentTrace(state, {
      eventType: type,
      label: label,
      ...(traceOverrides || {})
    })
  };
}

function clearRealUniverseHistory() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('Confirm Clear', 'Clear all chat history?', ui.ButtonSet.YES_NO);
  if (response === ui.Button.YES) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CHAT_SHEET_NAME);
    if (sheet) {
      sheet.clearContents().getRange('A1:D1')
        .setValues([['Timestamp', 'Question', 'Answer', 'Selected Cells']])
        .setFontWeight('bold');
      ui.alert('Success', 'Chat history cleared.', ui.ButtonSet.OK);
    }
  }
}

function getRealUniverseSelectedCellInfo() {
  try {
    const rangeList = SpreadsheetApp.getActiveSpreadsheet().getActiveRangeList();
    if (rangeList) {
      const ranges = rangeList.getRanges();
      const sheetName = ranges[0].getSheet().getName();
      if (ranges.length > 1) {
        return sheetName + '!' + ranges.map(r => r.getA1Notation()).join(', ');
      } else if (ranges.length === 1) {
        const r = ranges[0];
        return sheetName + '!' + r.getA1Notation() + ' (' + r.getNumRows() + ' rows, ' + r.getNumColumns() + ' cols)';
      }
    }
    return '(No cells selected)';
  } catch (e) {
    return '(Error reading selection)';
  }
}

function getRealUniverseFooterContext(mode) {
  if (mode === 'agent') {
    return getRealUniverseAgentStatusInfo();
  }
  return getRealUniverseSelectedCellInfo();
}

function getRealUniverseHtmlContent() {
  return '<div style="font-family:Arial;padding:8px;">RealUniverse AI is ready.</div>';
}


/**
 * Generate the complete HTML content for the AI interface
 */
function getRealUniverseHtmlContent() {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<base target="_top">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RealUniverse AI</title>
<script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js"></script>
<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #f5f5f7;
    height: 100vh;
    width: 100vw;     
    margin: 0;        
    padding: 0;      
    overflow: hidden;
}
.container {
    height: 100%;
    width: 100%;      
    display: flex;
    flex-direction: column;
    background: white;
    position: relative;
}
.mode-switch-button {
    position: absolute;
    top: 8px;
    right: 8px;
    background: transparent;
    border: none;
    color: #86868b;
    font-size: 12px;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 6px;
    outline: none;
    transition: all 0.2s ease;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 4px;
}
.mode-switch-button:hover {
    color: #1d1d1f;
    background: #f8f9fa;
}
.chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
}
.messages {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 16px 12px;
    background: #F0FFFF;
    scroll-behavior: smooth;
    position: relative;
}
.message {
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: relative;
}
.message.user {
    align-items: flex-end;
}
.message-content {
    max-width: 100%;
    padding: 10px 14px;
    border-radius: 18px;
    font-size: 12px;
    line-height: 1.3;
    word-wrap: break-word;
    word-break: break-word;
    white-space: pre-wrap;
    position: relative;
}
.message.user .message-content {
    background: #E6E6FA;
    color: #1d1d1f;
    border-bottom-right-radius: 4px;
}
.message.bot .message-content {
    background: #F0FFFF;
    color: #1d1d1f;
    border-bottom-left-radius: 4px;
}
.message.agent-event .message-content {
    background: rgba(255, 255, 255, 0.72);
    color: #64748b;
    border: 1px dashed #d6dde6;
    border-radius: 12px;
    padding: 7px 10px;
    font-size: 10px;
    line-height: 1.4;
}
.agent-work-panel {
    margin-bottom: 12px;
    border: 1px solid #dbe5f0;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 8px 22px rgba(148, 163, 184, 0.12);
    overflow: hidden;
}
.agent-work-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px 10px;
    border-bottom: 1px solid #eef2f6;
}
.agent-work-title {
    font-size: 12px;
    font-weight: 600;
    color: #1d1d1f;
}
.agent-work-subtitle {
    font-size: 10px;
    color: #64748b;
    margin-top: 2px;
}
.agent-work-status {
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
.agent-work-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px 14px;
}
.agent-work-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}
.agent-work-marker {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    flex: 0 0 18px;
    margin-top: 1px;
    border: 1px solid #cfd7e3;
    background: #f8fafc;
    position: relative;
}
.agent-work-marker::after {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 999px;
    background: transparent;
}
.agent-work-item.done .agent-work-marker {
    border-color: #c7f1d8;
    background: #effcf4;
}
.agent-work-item.done .agent-work-marker::after {
    background: #22c55e;
}
.agent-work-item.running .agent-work-marker {
    border-color: #c7d8ff;
    background: #eef4ff;
}
.agent-work-item.running .agent-work-marker::after {
    background: #3b82f6;
}
.agent-work-item.failed .agent-work-marker {
    border-color: #fecaca;
    background: #fff1f2;
}
.agent-work-item.failed .agent-work-marker::after {
    background: #ef4444;
}
.agent-work-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.agent-work-step {
    font-size: 11px;
    font-weight: 600;
    color: #1d1d1f;
}
.agent-work-meta {
    font-size: 10px;
    color: #64748b;
}
.message-content strong {
    font-weight: 600;
    color: #1d1d1f;
}

.agent-log-btn {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: white;
    color: #1d1d1f;
    cursor: pointer;
    font-size: 10px;
    padding: 6px 10px;
    transition: all 0.2s ease;
}
.agent-log-btn:hover {
    background: #f8f9fa;
}
.agent-log-modal {
    width: min(760px, 100%);
    max-height: 90vh;
    background: white;
    border-radius: 16px;
    box-shadow: 0 18px 48px rgba(0,0,0,0.18);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.agent-log-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 18px;
    border-bottom: 1px solid #eef0f3;
}
.agent-log-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.agent-log-title strong {
    font-size: 14px;
    color: #1d1d1f;
}
.agent-log-subtitle {
    font-size: 10px;
    color: #64748b;
}
.agent-log-actions {
    display: inline-flex;
    gap: 8px;
    flex-wrap: wrap;
}
.agent-log-body {
    padding: 16px 18px 18px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #fcfdff;
}
.agent-log-empty {
    border: 1px dashed #d6dde6;
    border-radius: 12px;
    padding: 14px;
    font-size: 11px;
    color: #64748b;
    background: white;
}
.agent-log-entry {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.agent-log-entry-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}
.agent-log-entry-title {
    font-size: 12px;
    font-weight: 600;
    color: #1d1d1f;
}
.agent-log-entry-meta {
    font-size: 10px;
    color: #64748b;
}
.agent-log-entry-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.agent-log-entry-label {
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}
.agent-log-entry-pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 11px;
    line-height: 1.45;
    color: #1d1d1f;
    background: #f8fafc;
    border: 1px solid #edf2f7;
    border-radius: 10px;
    padding: 10px 12px;
}

/* Copy Button Styles */
.copy-button {
    position: absolute;
    bottom: 4px;
    right: 4px;
    background: transparent;
    border: none;
    border-radius: 4px;
    width: 26px;
    height: 26px;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: #86868b;
    transition: all 0.2s ease;
    z-index: 10;
}
.copy-button:hover {
    background: transparent;
    color: #1d1d1f;
}
.copy-button.copied {
    background: transparent;
    color: #059669;
}
.message.bot.typing-finished .copy-button {
    display: flex;
}

/* Tooltip Styles */
.tooltip {
    position: relative;
}
.tooltip:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: #1d1d1f;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    white-space: nowrap;
    z-index: 1000;
    opacity: 1;
    pointer-events: none;
}
.tooltip:hover::before {
    content: '';
    position: absolute;
    bottom: calc(100% + 2px);
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: #1d1d1f;
    z-index: 1000;
    opacity: 1;
    pointer-events: none;
}

.input-area {
    background: #F0FFFF;
    padding: 16px 16px 0 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    width: 100%;
    box-sizing: border-box;
    flex-shrink: 0;
}

/* Sidebar Mode - Keep Dialog Layout */
.lucide {
    width: 16px;
    height: 16px;
    stroke-width: 1.85;
}
.sidebar-mode .expanded-input-container {
    max-width: none;
    width: 100%;
    padding: 6px 10px;
    margin-bottom: 6px;
}
.sidebar-mode .quick-actions {
    width: 100%;
    padding: 0 0 8px 0;
}
.sidebar-mode .quick-actions-buttons {
    opacity: 1;
    max-height: none;
    margin-top: 6px;
    justify-content: center;
    flex-wrap: wrap;
    overflow-x: visible;
    gap: 6px;
    padding-bottom: 0;
}
.sidebar-mode .quick-action-btn {
    text-align: center;
    flex: none;
}
.sidebar-mode .input-area {
    padding: 12px 12px 8px 12px;
}
.sidebar-mode .messages {
    padding: 12px 12px 8px;
}
.sidebar-mode .in-box-controls {
    gap: 4px;
    align-items: center;
    flex-wrap: nowrap;
}
.sidebar-mode .status-text {
    height: 34px;
    font-size: 8.5px;
    padding: 0 8px;
    border-radius: 12px;
    flex: 1 1 0;
}
.sidebar-mode .turbo-toggle {
    height: 34px;
    font-size: 8.5px;
    padding: 0 10px;
    border-radius: 12px;
    flex: 0 0 auto;
}
.sidebar-mode .hamburger-btn {
    width: 34px;
    min-width: 34px;
    height: 34px;
}
.sidebar-mode .array-info {
    padding: 4px 4px 6px;
    margin-top: 0;
    font-size: 9px;
}
.sidebar-mode .settings-popup {
    left: 0;
    right: 0;
    width: auto;
    max-height: min(52vh, 420px);
}
.sidebar-mode .modal-overlay {
    padding: 10px;
}
.sidebar-mode .preset-manager-modal {
    width: 100%;
    max-height: calc(100vh - 20px);
    border-radius: 14px;
}

.custom-title-bar {
    background: #F0FFFF;
    border-bottom: none;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
}
.app-title {
    background: linear-gradient(45deg, #8360c3, #2ebf91, #8360c3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-family: 'Roboto', sans-serif;
    font-weight: 500;
    font-size: 20px;
    letter-spacing: 0.3px;
    margin: 0;
    padding-left: 40px;
    position: relative;
}

.app-title::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="%238360c3" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.826 5.376c2.8-1.995 5.087-2.882 5.883-2.085c.797.796-.09 3.083-2.085 5.884m-13.248 5.65c-1.995 2.8-2.882 5.088-2.085 5.884c.796.797 3.083-.09 5.884-2.085m9.45-9.45c-1.133 1.59-2.622 3.345-4.364 5.087s-3.497 3.231-5.086 4.363m9.45-9.45A7.2 7.2 0 0 1 19.2 12a7.2 7.2 0 0 1-10.025 6.624M17.09 6.91A7.2 7.2 0 1 0 6.91 17.09" color="%238360c3"/></svg>');
    background-size: contain;
    background-repeat: no-repeat;
}

.turbo-wrapper {
    position: relative;
    width: 100%;
    max-width: 400px;
    display: flex;
    justify-content: flex-start;
    margin-bottom: 4px;
}
.turbo-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
}
.turbo-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 34px;
    padding: 0 12px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #dbe2ea;
    cursor: pointer;
    font-size: 10px;
    color: #64748b;
    outline: none;
    transition: all 0.2s ease;
}
.turbo-toggle.active {
    background: #b3e5fc;
    color: #1d1d1f;
}
.turbo-status {
    font-size: 9px;
    color: #86868b;
    margin-left: 8px;
}

.send-button {
    background: white;
    color: #111827;
    border: 1px solid #d1d5db;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
    transition: all 0.2s ease;
}
.send-button:hover {
    background-color: #f8f9fa;
    border-color: #cbd5e1;
    transform: scale(1.05);
}
.send-button:disabled {
    background-color: #f5f5f5;
    border-color: #e5e5e7;
    cursor: not-allowed;
    opacity: 0.6;
}
.send-button:disabled.spinning {
    animation: spin 1s linear infinite !important;
    background-color: #f5f5f5 !important;
    border-color: #e5e5e7 !important;
    cursor: not-allowed !important;
    opacity: 0.6 !important;
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
.send-button.spinning {
    animation: spin 1s linear infinite;
}

/* New Expanded Input Layout */
.expanded-input-container {
    width: 100%;
    max-width: 400px;
    display: flex;
    align-items: stretch;
    background: white;
    border: 1px solid #E6E6FA;
    border-radius: 20px;
    padding: 6px 12px;
    margin-bottom: 8px;
    position: relative;
}

.input-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.message-input {
    width: 100%;
    border: none;
    background: transparent;
    padding: 10px 0 0 0;
    font-size: 12px;
    outline: none;
    resize: none;
    max-height: 120px;
    min-height: 28px;
    line-height: 1.4;
    font-family: inherit;
    color: #1d1d1f;
    overflow-y: auto;
    scrollbar-width: none;
}
.message-input::-webkit-scrollbar {
    display: none;
}
.message-input::placeholder {
    color: #86868b;
}

/* Controls in input box */
.in-box-controls {
   display: flex;
   align-items: center;
   gap: 8px;
   margin-top: 12px;
   padding: 4px 0 0 0;
   position: relative;
   width: 100%;
   min-width: 0;
}

.hamburger-btn {
    background: #f8fafc;
    border: 1px solid #dbe2ea;
    color: #64748b;
    cursor: pointer;
    width: 34px;
    height: 34px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
}

.hamburger-btn:hover {
    background: white;
    color: #1d1d1f;
    border-color: #cbd5e1;
}

.settings-fallback {
    font-size: 14px;
    line-height: 1;
    color: currentColor;
}

.hamburger-btn[data-icon-ready="true"] .settings-fallback {
    display: none;
}

.status-text {
    height: 34px;
    font-size: 10px;
    color: #64748b;
    border: 1px solid #dbe2ea;
    background: #f8fafc;
    padding: 0 12px;
    border-radius: 12px;
    flex: 1 1 auto;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-flex;
    align-items: center;
}

.sendButton {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid #E6E6FA;
    background: white;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    flex-shrink: 0;
    align-self: center;
    background-image: url('https://i.ibb.co/vvCrQ8DW/RS.jpg');
    background-size: 22px 22px;
    background-repeat: no-repeat;
    background-position: center;
    transition: all 0.2s ease;
}

.sendButton:hover {
    background-color: white;
    transform: scale(1.05);
}

.sendButton:disabled {
    background-color: #f5f5f5;
    background-image: url('https://i.ibb.co/vvCrQ8DW/RS.jpg');
    border-color: #e5e5e7;
    cursor: not-allowed;
    opacity: 0.6;
}

.sendButton:disabled.spinning {
    animation: spin 1s linear infinite !important;
    background-color: #f5f5f5 !important;
    background-image: url('https://i.ibb.co/vvCrQ8DW/RS.jpg') !important;
    border-color: #e5e5e7 !important;
    cursor: not-allowed !important;
    opacity: 0.6 !important;
}

.sendButton.spinning {
    animation: spin 1s linear infinite;
}

/* Settings Menu */
.settings-popup {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    background: white;
    border-radius: 16px;
    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
    padding: 16px;
    width: min(360px, calc(100vw - 32px));
    max-height: min(52vh, 380px);
    overflow-y: auto;
    display: none;
    z-index: 1000;
}

.settings-popup.show {
    display: block;
}

.popup-section {
    margin-bottom: 12px;
}

.popup-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 6px;
}
.popup-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
}

.popup-options {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.popup-select {
    width: 100%;
    min-height: 34px;
    border: 1px solid #dbe2ea;
    border-radius: 10px;
    background: #f8fafc;
    color: #1d1d1f;
    font-size: 11px;
    padding: 0 10px;
    outline: none;
}

.popup-select:focus {
    border-color: #8360c3;
    box-shadow: 0 0 0 3px rgba(131, 96, 195, 0.12);
}

.popup-option {
    padding: 6px 10px;
    background: #f8f9fa;
    border: 1px solid #e5e5e7;
    border-radius: 999px;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.popup-option:hover {
    background: #e5e5e7;
}

.popup-option.active {
    background: #8360c3;
    color: white;
    border-color: #8360c3;
}
.preset-manage-btn,
.preset-secondary-btn,
.preset-primary-btn,
.empty-action-btn {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: white;
    color: #1d1d1f;
    cursor: pointer;
    font-size: 10px;
    padding: 6px 10px;
    transition: all 0.2s ease;
}
.preset-manage-btn:hover,
.preset-secondary-btn:hover,
.preset-primary-btn:hover,
.empty-action-btn:hover {
    background: #f8f9fa;
}
.preset-primary-btn {
    background: #8360c3;
    border-color: #8360c3;
    color: white;
}
.preset-primary-btn:hover {
    background: #6f4fae;
}
.preset-secondary-btn.danger {
    color: #b91c1c;
    border-color: #fecaca;
    background: #fff5f5;
}
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(17, 24, 39, 0.32);
    display: none;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 2000;
}
.modal-overlay.show {
    display: flex;
}
.preset-manager-modal {
    width: min(680px, 100%);
    max-height: 90vh;
    background: white;
    border-radius: 16px;
    box-shadow: 0 18px 48px rgba(0,0,0,0.18);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.preset-manager-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px;
    border-bottom: 1px solid #eef0f3;
}
.preset-manager-title {
    font-size: 14px;
    font-weight: 600;
    color: #1d1d1f;
}
.modal-close-btn {
    border: none;
    background: #f8fafc;
    color: #6b7280;
    cursor: pointer;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.preset-manager-body {
    padding: 16px 18px 18px;
    overflow-y: auto;
}
.preset-manager-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 180px;
    overflow-y: auto;
    margin-bottom: 6px;
}
.preset-list-item {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 10px 12px;
    background: white;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
}
.preset-list-item:hover {
    border-color: #c4b5fd;
    background: #faf8ff;
}
.preset-list-item.active {
    border-color: #8360c3;
    background: #f5f0ff;
}
.preset-list-name {
    font-size: 11px;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 4px;
}
.preset-list-preview {
    font-size: 10px;
    color: #6b7280;
    line-height: 1.4;
}
.preset-input,
.preset-textarea {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 11px;
    font-family: inherit;
    color: #1d1d1f;
    background: white;
    outline: none;
}
.preset-input:focus,
.preset-textarea:focus {
    border-color: #8360c3;
    box-shadow: 0 0 0 3px rgba(131, 96, 195, 0.12);
}
.preset-textarea {
    min-height: 140px;
    resize: vertical;
    line-height: 1.5;
}
.preset-manager-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
}
.empty-preset-state {
    padding: 14px;
    border: 1px dashed #d1d5db;
    border-radius: 10px;
    font-size: 10px;
    color: #6b7280;
    text-align: center;
    line-height: 1.5;
}

.array-info {
    background: transparent;
    width: 100%;
    padding: 2px 4px 6px;
    border-radius: 4px;
    font-size: 10px;
    color: #2563eb;
    border: none;
    margin-top: 2px;
    text-align: center;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.messages::-webkit-scrollbar {
    width: 4px;
}
.messages::-webkit-scrollbar-track {
    background: transparent;
}
.messages::-webkit-scrollbar-thumb {
    background: #c7c7cc;
    border-radius: 4px;
}
.typing-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 10px 14px;
    background: white;
    border-radius: 18px;
    border-bottom-left-radius: 4px;
}
.typing-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #86868b;
    animation: typing 1.4s infinite;
}
.typing-dot:nth-child(2) {
    animation-delay: 0.2s;
}
.typing-dot:nth-child(3) {
    animation-delay: 0.4s;
}
@keyframes typing {
    0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
    }
    30% {
        transform: translateY(-4px);
        opacity: 1;
    }
}
.empty-state {
    text-align: center;
    color: #86868b;
    font-size: 14px;
    padding: 0;
    line-height: 1.5;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    pointer-events: none;
}

/* Quick Actions Styles */
.quick-actions {
    width: 100%;
    padding: 0 0 12px 0;
    background: transparent;
}
.quick-actions-label {
    font-size: 11px;
    color: #86868b;
    margin-bottom: 0;
    text-align: center;
    cursor: pointer;
    transition: color 0.2s ease;
}
.quick-actions:hover .quick-actions-buttons {
    opacity: 1;
    max-height: 100px;
    margin-top: 8px;
}

.quick-actions:hover .quick-actions-label {
    color: #1d1d1f;
}
.quick-actions-buttons {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    transition: all 0.3s ease;
}
.quick-action-btn {
    background: #1d1d1f;
    border: 1px solid #1d1d1f;
    border-radius: 16px;
    padding: 3px 7px;
    font-size: 7px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    font-family: inherit;
}
.quick-action-btn:hover {
    background: #2d2d2f;
    border-color: #2d2d2f;
    transform: translateY(-1px);
}
.quick-action-btn:active {
    transform: translateY(0);
    background: #0d0d0f;
}
</style>
</head>
<body>
<div class="container" id="main-container">
    <div class="custom-title-bar">
        <div class="app-title">Real Universe Agentic</div>
        <button class="mode-switch-button" id="mode-switch-button" onclick="toggleDisplayMode()" aria-label="Toggle panel">
            <i data-lucide="panel-right-open"></i>
        </button>
    </div>
    
    <div class="chat-container">
        <div class="messages" id="messages">
            <div class="empty-state">Intelligent insights for your Google Sheets</div>
        </div>
    </div>

    <div class="input-area">
        <!-- Quick Action Buttons -->
        <div class="quick-actions" id="quick-actions">
            <div class="quick-actions-label">⚡️Quick Action</div>
            <div class="quick-actions-buttons">
                <button class="quick-action-btn" onclick="sendQuickAction('วิเคราะห์ข้อมูล')">วิเคราะห์ข้อมูล</button>
                <button class="quick-action-btn" onclick="sendQuickAction('วิเคราะห์ข้อมูลพร้อมสัดส่วน')">วิเคราะห์ข้อมูลพร้อมสัดส่วน</button>
                <button class="quick-action-btn" onclick="sendQuickAction('ค้นหาประเด็นสำคัญ')">ค้นหาประเด็นสำคัญ</button>
            </div>
        </div>

        <!-- New Expanded Input Container -->
        <div class="expanded-input-container">
            <div class="input-content">
                <textarea
                    class="message-input"
                    id="messageInput"
                    placeholder="Ask me anything.."
                    rows="1"
                ></textarea>
                
                <!-- Controls in input box -->
                <div class="in-box-controls">
                    <button class="hamburger-btn" onclick="toggleSettingsPopup(event)" aria-label="Settings"><span class="settings-fallback" aria-hidden="true">⚙</span><i data-lucide="settings-2"></i></button>
                    <span class="status-text" id="statusText">Answer • Loading... • Exact</span>
                    <button class="turbo-toggle" id="turbo-toggle" onclick="toggleTurbo()" style="display: none;"><i data-lucide="lightbulb"></i><span>Deep</span></button>
                    
                    <!-- Settings Popup -->
                    <div class="settings-popup" id="settingsPopup">
                        <div class="popup-section">
	                            <div class="popup-title"><i data-lucide="circle-dot"></i><span>Mode</span></div>
<div class="popup-options" id="popupModeOptions">
    <div class="popup-option active" onclick="selectPopupMode('Answer', this, 'action')">Answer</div>
    <div class="popup-option" onclick="selectPopupMode('Array', this, 'array')">Array</div>
    <div class="popup-option" onclick="selectPopupMode('Agent', this, 'agent')">Agent</div>
    <div class="popup-option" onclick="selectPopupMode('Image', this, 'image')">Image</div>
</div>
</div>

		                        <div class="popup-section" id="popupPresetSection">
		                            <div class="popup-title-row">
		                                <div class="popup-title"><i data-lucide="library-big"></i><span>Preset</span></div>
		                                <button class="preset-manage-btn" onclick="openPresetManager()">Manage</button>
	                            </div>
                            <div class="popup-options" id="popupPresetOptions">
                                <div style="padding: 12px; text-align: center; font-size: 10px; color: #86868b;">
                                    Loading presets...
	                                </div>
	                            </div>
	                        </div>
	                        
	                        <div class="popup-section" id="popupModelSection">
	                            <div class="popup-title"><i data-lucide="cpu"></i><span>Model</span></div>
	                            <select class="popup-select" id="popupModelSelect" onchange="selectPopupModel(this.value)"></select>
	                        </div>
	                        
	                        <div class="popup-section" id="popupCapabilitySection">
	                            <div class="popup-title" id="popupCapabilityTitle"><i data-lucide="sliders-horizontal"></i><span>Tone</span></div>
	                            <div class="popup-options" id="popupCapabilityOptions"></div>
	                        </div>
	                        <div class="popup-section" id="popupAgentLogSection" style="display: none;">
	                            <div class="popup-title-row">
	                                <div class="popup-title"><i data-lucide="logs"></i><span>Agent Log</span></div>
	                                <button class="agent-log-btn" onclick="openAgentLogModal()">View Log</button>
	                            </div>
	                        </div>
	                    </div>
                    <button class="sendButton" id="sendButton" onclick="sendMessage()" aria-label="Send"></button>
                </div>
            </div>
        </div>
        
        <div id="selected-cell" class="array-info">Data selected: No data selected</div>
    </div>
</div>
<div class="modal-overlay" id="presetManagerModal" onclick="handlePresetModalBackdrop(event)">
    <div class="preset-manager-modal">
        <div class="preset-manager-header">
            <div class="preset-manager-title">Preset Library</div>
            <button class="modal-close-btn" onclick="closePresetManager()" aria-label="Close"><i data-lucide="x"></i></button>
        </div>
        <div class="preset-manager-body">
            <div class="popup-section">
                <div class="popup-title"><i data-lucide="circle-dot"></i><span>Mode</span></div>
                <div class="popup-options" id="presetManagerModeOptions">
                    <div class="popup-option active" data-mode="action" onclick="selectPresetManagerMode('action', this)">Answer</div>
                    <div class="popup-option" data-mode="array" onclick="selectPresetManagerMode('array', this)">Array</div>
                    <div class="popup-option" data-mode="image" onclick="selectPresetManagerMode('image', this)">Image</div>
                </div>
            </div>

            <div class="popup-section">
                <div class="popup-title"><i data-lucide="library-big"></i><span>Presets</span></div>
                <div class="preset-manager-list" id="presetManagerList"></div>
            </div>

            <div class="popup-section">
                <div class="popup-title"><i data-lucide="tag"></i><span>Name</span></div>
                <input class="preset-input" id="presetNameInput" type="text" placeholder="e.g. General" />
            </div>

            <div class="popup-section">
                <div class="popup-title"><i data-lucide="file-text"></i><span>Prompt</span></div>
                <textarea class="preset-textarea" id="presetPromptInput" placeholder="Write a system prompt"></textarea>
            </div>

            <div class="preset-manager-actions">
                <button class="preset-secondary-btn" onclick="resetPresetForm()">New</button>
                <button class="preset-secondary-btn danger" id="deletePresetButton" onclick="deletePresetFromModal()" style="display: none;">Delete</button>
                <button class="preset-primary-btn" onclick="savePresetFromModal()">Save</button>
            </div>
        </div>
    </div>
</div>
<div class="modal-overlay" id="agentLogModal" onclick="handleAgentLogModalBackdrop(event)">
    <div class="agent-log-modal">
        <div class="agent-log-toolbar">
            <div class="agent-log-title">
                <strong>Agent Log</strong>
                <div class="agent-log-subtitle" id="agentLogSubtitle">Current thread</div>
            </div>
            <div class="agent-log-actions">
                <button class="agent-log-btn" onclick="copyAgentLog()">Copy Log</button>
                <button class="agent-log-btn" onclick="clearAgentLog()">Clear Log</button>
                <button class="modal-close-btn" onclick="closeAgentLogModal()" aria-label="Close"><i data-lucide="x"></i></button>
            </div>
        </div>
        <div class="agent-log-body" id="agentLogBody">
            <div class="agent-log-empty">No log yet.</div>
        </div>
    </div>
</div>
<script>
let currentMode = 'action';
let currentPreset = null;
let currentTemperature = 0;
let isTyping = false;
let currentTypingElement = null;
let currentTypingText = '';
let turboMode = false;
let presetManagerMode = 'action';
let editingPresetId = null;

// Dynamic presets storage
let dynamicPresets = null;
let modelUiConfig = {
   models: [],
   defaultModels: { action: 'gpt-4.1', array: 'gpt-4.1' },
   reasoningLabels: {
       none: 'None',
       minimal: 'Minimal',
       low: 'Low',
       medium: 'Medium',
       high: 'High',
       xhigh: 'Extra High'
   },
   temperatureOptions: [
       { label: 'Exact', value: 0 },
       { label: 'Focused', value: 0.2 },
       { label: 'Balance', value: 0.5 },
       { label: 'Creative', value: 0.7 }
   ]
};
let currentModelSelections = {
   action: 'gpt-4.1',
   array: 'gpt-4.1',
   agent: 'gpt-5.4'
};
let currentReasoningSelections = {
   action: null,
   array: null,
   agent: null
};
let activeAgentThreadId = null;
let currentAgentState = null;
let hasBootstrappedRealUniverseApp = false;
let agentLogCurrentThreadId = null;
let currentAgentWorkRun = null;
let currentAgentCancelRequested = false;

const AGENT_DB_NAME = 'realuniverse-agent-v1';
const AGENT_DB_VERSION = 1;
const AGENT_MAX_RECENT_TURNS = 20;
const AGENT_MAX_RECENT_EVENTS = 120;
const AGENT_MAX_SUMMARY_LENGTH = 4000;

function openAgentDb() {
   return new Promise((resolve, reject) => {
       const request = indexedDB.open(AGENT_DB_NAME, AGENT_DB_VERSION);

       request.onupgradeneeded = event => {
           const db = event.target.result;

           if (!db.objectStoreNames.contains('agent_threads')) {
               const threadStore = db.createObjectStore('agent_threads', { keyPath: 'id' });
               threadStore.createIndex('sheetKey', 'sheetKey', { unique: false });
               threadStore.createIndex('updatedAt', 'updatedAt', { unique: false });
           }

           if (!db.objectStoreNames.contains('agent_turns')) {
               const turnStore = db.createObjectStore('agent_turns', { keyPath: 'id' });
               turnStore.createIndex('threadId', 'threadId', { unique: false });
               turnStore.createIndex('createdAt', 'createdAt', { unique: false });
           }

           if (!db.objectStoreNames.contains('agent_events')) {
               const eventStore = db.createObjectStore('agent_events', { keyPath: 'id' });
               eventStore.createIndex('threadId', 'threadId', { unique: false });
               eventStore.createIndex('createdAt', 'createdAt', { unique: false });
           }

           if (!db.objectStoreNames.contains('agent_memory')) {
               const memoryStore = db.createObjectStore('agent_memory', { keyPath: 'id' });
               memoryStore.createIndex('threadId', 'threadId', { unique: false });
               memoryStore.createIndex('memoryKey', 'memoryKey', { unique: false });
           }
       };

       request.onsuccess = () => resolve(request.result);
       request.onerror = () => reject(request.error);
   });
}

function idbRequestToPromise(request) {
   return new Promise((resolve, reject) => {
       request.onsuccess = () => resolve(request.result);
       request.onerror = () => reject(request.error);
   });
}

async function runInAgentTransaction(storeNames, mode, handler) {
   const db = await openAgentDb();
   return new Promise((resolve, reject) => {
       const transaction = db.transaction(storeNames, mode);
       const stores = {};
       storeNames.forEach(storeName => {
           stores[storeName] = transaction.objectStore(storeName);
       });

       let handlerResult = null;
       Promise.resolve(handler(stores, transaction))
           .then(result => {
               handlerResult = result;
           })
           .catch(error => {
               reject(error);
               try {
                   transaction.abort();
               } catch (abortError) {
                   console.error('Abort transaction failed:', abortError);
               }
           });

       transaction.oncomplete = () => resolve(handlerResult);
       transaction.onerror = () => reject(transaction.error);
       transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'));
   });
}

function createAgentRecordId(prefix) {
   return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
}

function buildAgentSheetKey(context) {
   return context.spreadsheetId + ':' + context.sheetId;
}

async function getAgentThread(threadId) {
   return runInAgentTransaction(['agent_threads'], 'readonly', stores => {
       return idbRequestToPromise(stores.agent_threads.get(threadId));
   });
}

async function saveAgentThread(thread) {
   return runInAgentTransaction(['agent_threads'], 'readwrite', stores => {
       stores.agent_threads.put(thread);
   });
}

async function ensureAgentThread(context) {
   const threadId = buildAgentSheetKey(context);
   const existingThread = await getAgentThread(threadId);
   const now = Date.now();

   const nextThread = {
       id: threadId,
       sheetKey: buildAgentSheetKey(context),
       spreadsheetId: context.spreadsheetId,
       spreadsheetName: context.spreadsheetName,
       sheetId: context.sheetId,
       sheetName: context.sheetName,
       title: 'Agent · ' + context.sheetName,
       status: 'active',
       currentTurn: existingThread ? (existingThread.currentTurn || 0) : 0,
       createdAt: existingThread ? existingThread.createdAt : now,
       updatedAt: now
   };

   await saveAgentThread(nextThread);
   activeAgentThreadId = threadId;
   return nextThread;
}

async function getAgentTurns(threadId) {
   return runInAgentTransaction(['agent_turns'], 'readonly', async stores => {
       const allTurns = await idbRequestToPromise(stores.agent_turns.getAll());
       return allTurns
           .filter(turn => turn.threadId === threadId)
           .sort((a, b) => a.createdAt - b.createdAt);
   });
}

async function getAgentEvents(threadId) {
   return runInAgentTransaction(['agent_events'], 'readonly', async stores => {
       const allEvents = await idbRequestToPromise(stores.agent_events.getAll());
       return allEvents
           .filter(event => event.threadId === threadId)
           .sort((a, b) => a.createdAt - b.createdAt);
   });
}

async function saveAgentTurn(threadId, role, phase, content, extra = {}) {
   const thread = await getAgentThread(threadId);
   const nextTurnNo = ((thread && thread.currentTurn) || 0) + 1;
   const now = Date.now();

   await runInAgentTransaction(['agent_turns', 'agent_threads'], 'readwrite', stores => {
       stores.agent_turns.put({
           id: createAgentRecordId('turn'),
           threadId: threadId,
           turnNo: nextTurnNo,
           role: role,
           phase: phase,
           content: content,
           createdAt: now,
           ...extra
       });

       stores.agent_threads.put({
           ...(thread || { id: threadId, createdAt: now }),
           ...(thread || {}),
           id: threadId,
           currentTurn: nextTurnNo,
           updatedAt: now,
           status: 'active'
       });
   });

   if (agentLogCurrentThreadId === threadId && document.getElementById('agentLogModal').classList.contains('show')) {
       await refreshAgentLogModal();
   }
}

async function saveAgentEvents(threadId, events) {
   if (!Array.isArray(events) || events.length === 0) return;

   await runInAgentTransaction(['agent_events'], 'readwrite', stores => {
       events.forEach(event => {
           stores.agent_events.put({
               id: createAgentRecordId('event'),
               threadId: threadId,
               createdAt: Date.now(),
               ...event
           });
       });
   });

   if (agentLogCurrentThreadId === threadId && document.getElementById('agentLogModal').classList.contains('show')) {
       await refreshAgentLogModal();
   }
}

async function upsertAgentMemory(threadId, memoryKey, value) {
   const record = {
       id: threadId + ':' + memoryKey,
       threadId: threadId,
       memoryKey: memoryKey,
       value: value,
       updatedAt: Date.now()
   };

   await runInAgentTransaction(['agent_memory'], 'readwrite', stores => {
       stores.agent_memory.put(record);
   });
}

async function getAgentMemory(threadId, memoryKey) {
   return runInAgentTransaction(['agent_memory'], 'readonly', stores => {
       return idbRequestToPromise(stores.agent_memory.get(threadId + ':' + memoryKey));
   });
}

async function compactAgentThread(threadId) {
   const turns = await getAgentTurns(threadId);
   if (turns.length <= AGENT_MAX_RECENT_TURNS) {
       return;
   }

   const turnsToSummarize = turns.slice(0, turns.length - AGENT_MAX_RECENT_TURNS);
   const recentTurns = turns.slice(turns.length - AGENT_MAX_RECENT_TURNS);
   const existingMemory = await getAgentMemory(threadId, 'rolling_summary');
   const priorSummary = existingMemory && existingMemory.value ? String(existingMemory.value) : '';
   const summaryLines = turnsToSummarize.map(turn => {
       const roleLabel = String(turn.role || '').toUpperCase();
       return roleLabel + ' · ' + String(turn.content || '').slice(0, 180);
   });
   const mergedSummary = (priorSummary + '\\n' + summaryLines.join('\\n')).trim().slice(-AGENT_MAX_SUMMARY_LENGTH);

   await runInAgentTransaction(['agent_turns', 'agent_memory'], 'readwrite', stores => {
       turnsToSummarize.forEach(turn => {
           stores.agent_turns.delete(turn.id);
       });
       stores.agent_memory.put({
           id: threadId + ':rolling_summary',
           threadId: threadId,
           memoryKey: 'rolling_summary',
           value: mergedSummary,
           updatedAt: Date.now()
       });
   });

   await upsertAgentMemory(threadId, 'recent_turns', recentTurns);
}

async function trimAgentEvents(threadId) {
   const events = await getAgentEvents(threadId);
   if (events.length <= AGENT_MAX_RECENT_EVENTS) return;

   const eventsToDelete = events.slice(0, events.length - AGENT_MAX_RECENT_EVENTS);
   await runInAgentTransaction(['agent_events'], 'readwrite', stores => {
       eventsToDelete.forEach(event => {
           stores.agent_events.delete(event.id);
       });
   });
}

async function getAgentMemorySummary(threadId) {
   const rollingSummary = await getAgentMemory(threadId, 'rolling_summary');
   return rollingSummary && rollingSummary.value ? String(rollingSummary.value) : '';
}

async function getAgentPlanningMemory(threadId) {
   const rollingSummary = await getAgentMemorySummary(threadId);
   const recentTurns = await getAgentTurns(threadId);
   const recentTurnSummary = recentTurns
       .slice(-6)
       .map(turn => String(turn.role || '').toUpperCase() + ' · ' + String(turn.content || '').slice(0, 180))
       .join('\\n');

   return [rollingSummary, recentTurnSummary].filter(Boolean).join('\\n').trim();
}

function getIconMarkup(name) {
   return '<i data-lucide="' + name + '"></i>';
}

function refreshIcons() {
   if (window.lucide && typeof window.lucide.createIcons === 'function') {
       window.lucide.createIcons();
   }

   const settingsButton = document.querySelector('.hamburger-btn');
   if (settingsButton) {
       settingsButton.dataset.iconReady = settingsButton.querySelector('svg') ? 'true' : 'false';
   }
}

function parseMarkdown(text) {
   return text.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
}

function convertLinksToClickable(text) {
   return text.replace(/(https?:\\/\\/[^\\s<>]+)/g, 
       '<a href="$1" target="_blank" style="color: #0066cc; text-decoration: underline;">Link</a>');
}

function copyToClipboard(text, button) {
   try {
       const tempDiv = document.createElement('div');
       tempDiv.innerHTML = text;
       const plainText = tempDiv.textContent || tempDiv.innerText || '';
       
       navigator.clipboard.writeText(plainText).then(() => {
           button.innerHTML = getIconMarkup('check');
           button.classList.add('copied');
           button.setAttribute('data-tooltip', 'Copied!');
           refreshIcons();
           
           setTimeout(() => {
               button.innerHTML = getIconMarkup('copy');
               button.classList.remove('copied');
               button.setAttribute('data-tooltip', 'Copy');
               refreshIcons();
           }, 2000);
       }).catch(() => {
           const textArea = document.createElement('textarea');
           textArea.value = plainText;
           textArea.style.position = 'fixed';
           textArea.style.opacity = '0';
           document.body.appendChild(textArea);
           textArea.select();
           document.execCommand('copy');
           document.body.removeChild(textArea);
           
           button.innerHTML = getIconMarkup('check');
           button.classList.add('copied');
           button.setAttribute('data-tooltip', 'Copied!');
           refreshIcons();
           
           setTimeout(() => {
               button.innerHTML = getIconMarkup('copy');
               button.classList.remove('copied');
               button.setAttribute('data-tooltip', 'Copy');
               refreshIcons();
           }, 2000);
       });
   } catch (error) {
       console.error('Copy failed:', error);
       button.setAttribute('data-tooltip', 'Copy failed');
       setTimeout(() => {
       button.setAttribute('data-tooltip', 'Copy');
       }, 2000);
   }
}

function toggleTurbo() {
   turboMode = !turboMode;
   const turboToggle = document.getElementById('turbo-toggle');
   const turboStatus = document.getElementById('turbo-status');

   if (turboMode) {
       turboToggle.classList.add('active');
       turboStatus.textContent = 'Expanded Data Analysis Active';
   } else {
       turboToggle.classList.remove('active');
       turboStatus.textContent = '';
   }
}

// New Popup Functions for Hamburger Menu
function toggleSettingsPopup(event) {
   if (event) {
       event.stopPropagation();
   }
   const popup = document.getElementById('settingsPopup');
   if (!popup) return;
   popup.classList.toggle('show');
}

function callServer(functionName, ...args) {
   return new Promise((resolve, reject) => {
       let runner = google.script.run
           .withSuccessHandler(resolve)
           .withFailureHandler(reject);

       runner[functionName](...args);
   });
}

function addAgentEventMessage(eventOrLabel) {
   const event = typeof eventOrLabel === 'object' && eventOrLabel !== null
       ? eventOrLabel
       : { label: String(eventOrLabel || '') };
   const label = event.label || '';
   const messages = document.getElementById('messages');
   const emptyState = messages.querySelector('.empty-state');
   if (emptyState) emptyState.remove();

   const messageDiv = document.createElement('div');
   messageDiv.className = 'message agent-event';

   const content = document.createElement('div');
   content.className = 'message-content';
   content.textContent = label;

   messageDiv.appendChild(content);
   messages.appendChild(messageDiv);
   scrollToBottom();
}

function buildAgentWorkItems(events, isComplete) {
   const safeEvents = Array.isArray(events) ? events : [];
   const items = safeEvents.map(event => ({
       label: event && event.label ? event.label : '',
       status: event && event.type === 'error' ? 'failed' : 'done',
       phase: event && event.trace && event.trace.phase ? event.trace.phase : ''
   })).filter(item => item.label);

   if (!isComplete && !items.some(item => item.status === 'failed')) {
       for (let index = items.length - 1; index >= 0; index -= 1) {
           if (items[index].status !== 'failed') {
               items[index].status = 'running';
               break;
           }
       }
   }

   return items;
}

function ensureAgentWorkPanel() {
   const messages = document.getElementById('messages');
   if (!messages) return null;

   if (currentAgentWorkRun && currentAgentWorkRun.panel && currentAgentWorkRun.panel.isConnected) {
       return currentAgentWorkRun.panel;
   }

   const emptyState = messages.querySelector('.empty-state');
   if (emptyState) emptyState.remove();

   const panel = document.createElement('div');
   panel.className = 'agent-work-panel';
   panel.innerHTML = [
       '<div class="agent-work-header">',
           '<div>',
               '<div class="agent-work-title">Thinking</div>',
               '<div class="agent-work-subtitle" id="agentWorkSubtitle">Working on the active sheet</div>',
           '</div>',
       '</div>',
       '<div class="agent-work-list" id="agentWorkList"></div>'
   ].join('');
   messages.appendChild(panel);
   return panel;
}

function renderAgentWorkPanel() {
   if (!currentAgentWorkRun) return;
   const panel = ensureAgentWorkPanel();
   if (!panel) return;

   currentAgentWorkRun.panel = panel;
   const subtitle = panel.querySelector('#agentWorkSubtitle');
   const list = panel.querySelector('#agentWorkList');
   const items = buildAgentWorkItems(currentAgentWorkRun.events, currentAgentWorkRun.complete);

   if (subtitle) {
       subtitle.textContent = currentAgentWorkRun.stopping ? 'Stopping after the current step' : 'Working on the active sheet';
   }
   if (list) {
       list.innerHTML = '';
       items.forEach(item => {
           const row = document.createElement('div');
           row.className = 'agent-work-item ' + item.status;

           const marker = document.createElement('div');
           marker.className = 'agent-work-marker';

           const copy = document.createElement('div');
           copy.className = 'agent-work-copy';

           const step = document.createElement('div');
           step.className = 'agent-work-step';
           step.textContent = item.label;

           const meta = document.createElement('div');
           meta.className = 'agent-work-meta';
           meta.textContent = item.status === 'running'
               ? 'Running'
               : item.status === 'failed'
                   ? 'Failed'
                   : 'Done';

           copy.appendChild(step);
           copy.appendChild(meta);
           row.appendChild(marker);
           row.appendChild(copy);
           list.appendChild(row);
       });
   }

   scrollToBottom();
}

function startAgentWorkPanel(question) {
   currentAgentWorkRun = {
       question: question,
       events: [],
       complete: false,
       stopping: false,
       panel: null
   };
   renderAgentWorkPanel();
}

function appendAgentWorkEvents(events) {
   if (!currentAgentWorkRun) {
       startAgentWorkPanel('Working on the active sheet');
   }
   currentAgentWorkRun.events = currentAgentWorkRun.events.concat(Array.isArray(events) ? events : []);
   renderAgentWorkPanel();
}

function clearAgentWorkPanel() {
   if (currentAgentWorkRun && currentAgentWorkRun.panel && typeof currentAgentWorkRun.panel.remove === 'function') {
       currentAgentWorkRun.panel.remove();
   }
   currentAgentWorkRun = null;
}

function isAgentRunActive() {
   return currentMode === 'agent' && Boolean(currentAgentState) && isTyping;
}

function requestAgentStop() {
   if (!isAgentRunActive()) return false;
   currentAgentCancelRequested = true;
   if (currentAgentWorkRun) {
       currentAgentWorkRun.stopping = true;
       renderAgentWorkPanel();
   }
   updateSendButton();
   return true;
}

function stringifyAgentLogValue(value) {
   if (value == null || value === '') return '';
   if (typeof value === 'string') return value;
   if (typeof value === 'number' || typeof value === 'boolean') return String(value);

   try {
       return JSON.stringify(value, null, 2);
   } catch (error) {
       return String(value);
   }
}

function formatAgentLogTimestamp(value) {
   if (!value) return '';

   const date = new Date(value);
   if (Number.isNaN(date.getTime())) return '';
   return date.toLocaleString();
}

function normalizeAgentLogEvent(threadId, event) {
   const trace = event && event.trace ? event.trace : {};
   return {
       kind: 'event',
       threadId: threadId,
       createdAt: event && event.createdAt ? event.createdAt : Date.now(),
       title: event && event.label ? event.label : 'Agent event',
       meta: [trace.phase, trace.eventType].filter(Boolean).join(' • '),
       sections: [
           ['Prompt', trace.userPrompt],
           ['Intent', trace.intentType],
           ['Model', [trace.selectedModel, trace.reasoningEffort].filter(Boolean).join(' • ')],
           ['Plan', trace.planSummary],
           ['Actions', trace.actions],
           ['Tool', trace.toolName],
           ['Tool Input', trace.toolInput],
           ['Tool Result', trace.toolResult],
           ['Final Message', trace.finalMessage],
           ['Error', trace.error]
       ].filter(([, value]) => value != null && value !== '')
   };
}

function normalizeAgentLogTurn(turn) {
  return {
       kind: 'turn',
       threadId: turn.threadId,
       createdAt: turn.createdAt,
       title: String(turn.role || 'agent').toUpperCase() + ' · ' + String(turn.phase || 'message'),
       meta: '',
       sections: [
        ['Content', turn.content || '']
       ]
   };
}

function normalizeAgentLogSummary(summary) {
   if (!summary) return null;
   return {
       kind: 'summary',
       threadId: '',
       createdAt: 0,
       title: 'Rolling Summary',
       meta: '',
       sections: [
           ['Content', summary]
       ]
   };
}

function buildAgentLogEntries(turns, events, summary) {
   const normalizedTurns = (Array.isArray(turns) ? turns : []).map(turn => normalizeAgentLogTurn(turn));
   const normalizedEvents = (Array.isArray(events) ? events : []).map(event => normalizeAgentLogEvent(event.threadId || '', event));
   const normalizedSummary = normalizeAgentLogSummary(summary);

   return []
       .concat(normalizedSummary ? [normalizedSummary] : [])
       .concat(normalizedTurns)
       .concat(normalizedEvents)
       .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

function buildAgentLogText(threadLabel, entries) {
   const lines = [];
   lines.push('Agent Log');
   if (threadLabel) {
       lines.push('Thread: ' + threadLabel);
   }

   entries.forEach(entry => {
       lines.push('');
       lines.push('[' + formatAgentLogTimestamp(entry.createdAt) + '] ' + entry.title);
       if (entry.meta) {
           lines.push('Meta: ' + entry.meta);
       }

       (entry.sections || []).forEach(section => {
           lines.push(section[0] + ':');
           lines.push(stringifyAgentLogValue(section[1]));
       });
   });

   return lines.join('\\n').trim();
}

function renderAgentLogEntries(entries) {
   const body = document.getElementById('agentLogBody');
   if (!body) return;

   body.innerHTML = '';
   if (!entries.length) {
       body.innerHTML = '<div class="agent-log-empty">No log yet.</div>';
       return;
   }

   entries.forEach(entry => {
       const card = document.createElement('div');
       card.className = 'agent-log-entry';

       const head = document.createElement('div');
       head.className = 'agent-log-entry-head';

       const title = document.createElement('div');
       title.className = 'agent-log-entry-title';
       title.textContent = entry.title;

       const meta = document.createElement('div');
       meta.className = 'agent-log-entry-meta';
       meta.textContent = [formatAgentLogTimestamp(entry.createdAt), entry.meta].filter(Boolean).join(' • ');

       head.appendChild(title);
       head.appendChild(meta);
       card.appendChild(head);

       (entry.sections || []).forEach(section => {
           const sectionDiv = document.createElement('div');
           sectionDiv.className = 'agent-log-entry-section';

           const label = document.createElement('div');
           label.className = 'agent-log-entry-label';
           label.textContent = section[0];

           const pre = document.createElement('pre');
           pre.className = 'agent-log-entry-pre';
           pre.textContent = stringifyAgentLogValue(section[1]);

           sectionDiv.appendChild(label);
           sectionDiv.appendChild(pre);
           card.appendChild(sectionDiv);
       });

       body.appendChild(card);
   });
}

async function getAgentLogThreadId() {
   if (activeAgentThreadId) return activeAgentThreadId;

   const context = await callServer('getActiveSheetContext');
   return buildAgentSheetKey(context);
}

async function loadAgentLogSnapshot(threadId) {
   const turns = await getAgentTurns(threadId);
   const events = await getAgentEvents(threadId);
   const summary = await getAgentMemorySummary(threadId);
   const thread = await getAgentThread(threadId);
   return {
       threadId,
       thread,
       summary,
       turns,
       events,
       entries: buildAgentLogEntries(turns, events, summary)
   };
}

async function refreshAgentLogModal() {
   const threadId = agentLogCurrentThreadId || await getAgentLogThreadId();
   agentLogCurrentThreadId = threadId;
   const snapshot = await loadAgentLogSnapshot(threadId);
   const subtitle = document.getElementById('agentLogSubtitle');
   if (subtitle) {
       subtitle.textContent = snapshot.thread && snapshot.thread.title
           ? snapshot.thread.title
           : 'Current thread';
   }
   renderAgentLogEntries(snapshot.entries);
   return snapshot;
}

async function openAgentLogModal() {
   document.getElementById('settingsPopup').classList.remove('show');
   const modal = document.getElementById('agentLogModal');
   modal.classList.add('show');
   await refreshAgentLogModal();
   refreshIcons();
}

function closeAgentLogModal() {
   document.getElementById('agentLogModal').classList.remove('show');
}

function handleAgentLogModalBackdrop(event) {
   if (event.target.id === 'agentLogModal') {
       closeAgentLogModal();
   }
}

async function copyAgentLog() {
   const snapshot = await refreshAgentLogModal();
   const text = buildAgentLogText(
       snapshot.thread && snapshot.thread.title ? snapshot.thread.title : '',
       snapshot.entries
   );
   await navigator.clipboard.writeText(text || 'Agent Log');
}

async function clearAgentThreadData(threadId) {
   await runInAgentTransaction(['agent_turns', 'agent_events', 'agent_memory', 'agent_threads'], 'readwrite', stores => {
       const turnRequest = stores.agent_turns.getAll();
       const eventRequest = stores.agent_events.getAll();
       const memoryRequest = stores.agent_memory.getAll();

       return Promise.all([
           idbRequestToPromise(turnRequest),
           idbRequestToPromise(eventRequest),
           idbRequestToPromise(memoryRequest)
       ]).then(([turns, events, memories]) => {
           turns.filter(turn => turn.threadId === threadId).forEach(turn => stores.agent_turns.delete(turn.id));
           events.filter(event => event.threadId === threadId).forEach(event => stores.agent_events.delete(event.id));
           memories.filter(memory => memory.threadId === threadId).forEach(memory => stores.agent_memory.delete(memory.id));
           stores.agent_threads.delete(threadId);
       });
   });
}

async function clearAgentLog() {
   const threadId = agentLogCurrentThreadId || await getAgentLogThreadId();
   await clearAgentThreadData(threadId);
   if (activeAgentThreadId === threadId) {
       activeAgentThreadId = null;
       currentAgentState = null;
   }
   agentLogCurrentThreadId = threadId;
   await refreshAgentLogModal();
}

async function playAgentEvents(threadId, events) {
   if (!Array.isArray(events) || events.length === 0) return;

   appendAgentWorkEvents(events);
   for (const event of events) {
       await saveAgentEvents(threadId, [event]);
       await trimAgentEvents(threadId);
       await new Promise(resolve => setTimeout(resolve, 180));
   }
}

async function finalizeAgentRun(threadId, finalMessage) {
   if (currentAgentWorkRun) {
       currentAgentWorkRun.complete = true;
       currentAgentWorkRun.stopping = false;
       renderAgentWorkPanel();
   }
   if (finalMessage) {
       addMessage(finalMessage, 'bot', false);
       await saveAgentTurn(threadId, 'agent', 'reply', finalMessage);
   }

   await compactAgentThread(threadId);
   currentAgentState = null;
   currentAgentCancelRequested = false;
   clearAgentWorkPanel();
}

async function runAgentLoop(threadId, agentState) {
   currentAgentState = agentState;
   const response = await callServer('processRealUniverseAgentStep', agentState);
   await playAgentEvents(threadId, response.events || []);

   if (currentAgentCancelRequested && !response.done) {
       const stopEvent = {
           type: 'status',
           label: 'Stopping requested',
           trace: {
               phase: agentState && agentState.phase ? agentState.phase : '',
               eventType: 'status',
               finalMessage: 'ผมหยุดการทำงานไว้แล้วครับ'
           }
       };
       await saveAgentEvents(threadId, [stopEvent]);
       await trimAgentEvents(threadId);
       await finalizeAgentRun(threadId, 'ผมหยุดการทำงานไว้แล้วครับ');
       return;
   }

   if (response.done) {
       await finalizeAgentRun(threadId, response.finalMessage || '');
       return;
   }

   currentAgentState = response.nextState || null;
   await upsertAgentMemory(threadId, 'task_state', currentAgentState || {});
   await runAgentLoop(threadId, currentAgentState);
}

async function sendAgentMessage(question) {
   const context = await callServer('getActiveSheetContext');
   const thread = await ensureAgentThread(context);
   const memorySummary = await getAgentPlanningMemory(thread.id);
   const selectedModel = getSelectedModelForMode('agent');
   const selectedReasoning = getReasoningEffortForMode('agent');

   hideTypingIndicator();

   await saveAgentTurn(thread.id, 'user', 'prompt', question);
   startAgentWorkPanel(question);
   currentAgentCancelRequested = false;

   const initialState = {
       threadId: thread.id,
       phase: 'bootstrap',
       userPrompt: question,
       memorySummary: memorySummary,
       selectedModel: selectedModel,
       reasoningEffort: selectedReasoning
   };

   await upsertAgentMemory(thread.id, 'task_state', initialState);
   await runAgentLoop(thread.id, initialState);
}

function isTextModeClient(mode) {
   return mode === 'action' || mode === 'array' || mode === 'agent';
}

function getModelDefinitionForClient(modelId) {
   return (modelUiConfig.models || []).find(model => model.id === modelId) || null;
}

function getModelOptionsForMode(mode) {
   return (modelUiConfig.models || []).filter(model => {
       return Array.isArray(model.supportedModes) && model.supportedModes.includes(mode);
   });
}

function getDefaultModelForClient(mode) {
   return (modelUiConfig.defaultModels && modelUiConfig.defaultModels[mode]) || 'gpt-4.1';
}

function getSelectedModelForMode(mode) {
   if (!isTextModeClient(mode)) return null;

   const currentSelection = currentModelSelections[mode];
   const modelOptions = getModelOptionsForMode(mode);
   const hasSelection = modelOptions.some(model => model.id === currentSelection);
   if (hasSelection) return currentSelection;

   const fallbackModel = getDefaultModelForClient(mode);
   currentModelSelections[mode] = fallbackModel;
   return fallbackModel;
}

function getReasoningLabel(effort) {
   return (modelUiConfig.reasoningLabels && modelUiConfig.reasoningLabels[effort]) || effort;
}

function getTemperatureOptions() {
   return modelUiConfig.temperatureOptions || [];
}

function getTemperatureLabel(value) {
   const option = getTemperatureOptions().find(item => Number(item.value) === Number(value));
   return option ? option.label : 'Exact';
}

function getCurrentModelDisplayLabel() {
   if (!isTextModeClient(currentMode)) return null;

   const currentModel = getSelectedModelForMode(currentMode);
   const modelDefinition = getModelDefinitionForClient(currentModel);
   return modelDefinition ? modelDefinition.label : currentModel;
}

function getReasoningEffortForMode(mode) {
   if (!isTextModeClient(mode)) return null;

   const currentModel = getSelectedModelForMode(mode);
   const modelDefinition = getModelDefinitionForClient(currentModel);
   if (!modelDefinition || !modelDefinition.supportsReasoning) return null;

   const allowedOptions = modelDefinition.reasoningOptions || [];
   const currentSelection = currentReasoningSelections[mode];
   if (currentSelection && allowedOptions.includes(currentSelection)) {
       return currentSelection;
   }

   const fallbackEffort = modelDefinition.defaultReasoning || allowedOptions[0] || null;
   currentReasoningSelections[mode] = fallbackEffort;
   return fallbackEffort;
}

function getCurrentReasoningEffort() {
   return getReasoningEffortForMode(currentMode);
}

function getCapabilityDescriptor() {
   if (currentMode === 'image') {
       return {
           type: 'temperature',
           title: 'Tone',
           icon: 'sliders-horizontal'
       };
   }

   if (isTextModeClient(currentMode)) {
       const currentModel = getSelectedModelForMode(currentMode);
       const modelDefinition = getModelDefinitionForClient(currentModel);

       if (modelDefinition && modelDefinition.supportsReasoning) {
           return {
               type: 'reasoning',
               title: 'Reasoning',
               icon: 'brain'
           };
       }
   }

   return {
       type: 'temperature',
       title: 'Tone',
       icon: 'sliders-horizontal'
   };
}

function renderModelOptions() {
   const modelSection = document.getElementById('popupModelSection');
   const modelSelect = document.getElementById('popupModelSelect');
   if (!modelSection || !modelSelect) return;

   if (!isTextModeClient(currentMode)) {
       modelSection.style.display = 'none';
       modelSelect.innerHTML = '';
       return;
   }

   modelSection.style.display = '';
   const modelOptions = getModelOptionsForMode(currentMode);
   if (modelOptions.length === 0) {
       modelSection.style.display = 'none';
       modelSelect.innerHTML = '';
       return;
   }

   const selectedModel = getSelectedModelForMode(currentMode);

   modelSelect.innerHTML = modelOptions
       .map(model => '<option value="' + model.id + '">' + model.label + '</option>')
       .join('');

   modelSelect.value = selectedModel;
}

function renderCapabilityOptions() {
   const capabilitySection = document.getElementById('popupCapabilitySection');
   const capabilityTitle = document.getElementById('popupCapabilityTitle');
   const capabilityOptions = document.getElementById('popupCapabilityOptions');
   if (!capabilitySection || !capabilityTitle || !capabilityOptions) return;

   const capability = getCapabilityDescriptor();
   capabilitySection.style.display = '';
   capabilityTitle.innerHTML = getIconMarkup(capability.icon) + '<span>' + capability.title + '</span>';
   capabilityOptions.innerHTML = '';

   if (capability.type === 'reasoning') {
       const activeReasoning = getCurrentReasoningEffort();
       const modelDefinition = getModelDefinitionForClient(getSelectedModelForMode(currentMode));
       const reasoningOptions = modelDefinition ? (modelDefinition.reasoningOptions || []) : [];

       reasoningOptions.forEach(optionKey => {
           const option = document.createElement('div');
           option.className = 'popup-option';
           option.textContent = getReasoningLabel(optionKey);
           option.onclick = () => selectReasoningEffort(optionKey, option);

           if (optionKey === activeReasoning) {
               option.classList.add('active');
           }

           capabilityOptions.appendChild(option);
       });
   } else {
       getTemperatureOptions().forEach(optionDef => {
           const option = document.createElement('div');
           option.className = 'popup-option';
           option.textContent = optionDef.label;
           option.onclick = () => selectPopupTemp(optionDef.label, option, optionDef.value);

           if (Number(optionDef.value) === Number(currentTemperature)) {
               option.classList.add('active');
           }

           capabilityOptions.appendChild(option);
       });
   }

   refreshIcons();
}

function loadModelUiConfig(callback) {
   google.script.run
       .withSuccessHandler(config => {
           if (config) {
               modelUiConfig = config;
               currentModelSelections.action = getSelectedModelForMode('action');
               currentModelSelections.array = getSelectedModelForMode('array');
               currentModelSelections.agent = getSelectedModelForMode('agent');
               currentReasoningSelections.action = getReasoningEffortForMode('action');
               currentReasoningSelections.array = getReasoningEffortForMode('array');
               currentReasoningSelections.agent = getReasoningEffortForMode('agent');
           }

           renderModelOptions();
           renderCapabilityOptions();
           updateStatusText();
           refreshIcons();
           if (typeof callback === 'function') callback();
       })
       .withFailureHandler(error => {
           console.error('Error loading model config:', error);
           renderModelOptions();
           renderCapabilityOptions();
           updateStatusText();
           refreshIcons();
           if (typeof callback === 'function') callback();
       })
       .getRealUniverseModelUiConfig();
}

function initializeUiReadyState() {
   renderModelOptions();
   renderCapabilityOptions();
   updateStatusText();
   updateSelectedCell();
   refreshIcons();
}

function applyInitFallback() {
   if (document.getElementById('statusText')?.textContent?.includes('Loading...')) {
       initializeUiReadyState();
   }
}

function bootRealUniverseApp() {
   if (hasBootstrappedRealUniverseApp) return;
   hasBootstrappedRealUniverseApp = true;

   const messageInput = document.getElementById('messageInput');

   setTimeout(() => {
       if (messageInput) {
           messageInput.focus();
       }
   }, 100);

   initializeUiReadyState();
   loadModelUiConfig(() => {
       updateMode();
       refreshIcons();
   });
   setTimeout(applyInitFallback, 1500);
   setInterval(updateSelectedCell, 1000);
   initializeDisplayMode();
}

function selectPopupMode(modeName, element, modeValue) {
   currentMode = modeValue;
   document.querySelectorAll('#popupModeOptions .popup-option').forEach(option => {
       option.classList.remove('active');
   });
   element.classList.add('active');
   updateMode();
   updateStatusText();
}

function selectPopupModel(modelId) {
   if (!isTextModeClient(currentMode)) return;

   currentModelSelections[currentMode] = modelId;
   currentReasoningSelections[currentMode] = getCurrentReasoningEffort();
   renderCapabilityOptions();
   updateStatusText();
}

function selectPopupPreset(presetName, element, presetValue) {
   currentPreset = presetValue;
   document.querySelectorAll('#popupPresetOptions .popup-option').forEach(option => {
       option.classList.remove('active');
   });
   element.classList.add('active');
   updateStatusText();
}

function selectPopupTemp(tempName, element, tempValue) {
   currentTemperature = tempValue;
   document.querySelectorAll('#popupCapabilityOptions .popup-option').forEach(option => {
       option.classList.remove('active');
   });
   element.classList.add('active');
   updateStatusText();
}

function selectReasoningEffort(reasoningEffort, element) {
   if (!isTextModeClient(currentMode)) return;

   currentReasoningSelections[currentMode] = reasoningEffort;
   document.querySelectorAll('#popupCapabilityOptions .popup-option').forEach(option => {
       option.classList.remove('active');
   });
   element.classList.add('active');
   updateStatusText();
}

function updateStatusText() {
   const mode = document.querySelector('#popupModeOptions .popup-option.active')?.textContent || 'Answer';
   const preset = document.querySelector('#popupPresetOptions .popup-option.active')?.textContent || 'No preset';

   const capability = getCapabilityDescriptor();
   const detailLabel = capability.type === 'reasoning'
       ? getReasoningLabel(getCurrentReasoningEffort() || '')
       : getTemperatureLabel(currentTemperature);

   const statusParts = currentMode === 'agent' ? ['Agent'] : [mode, preset];
   if (isTextModeClient(currentMode)) {
       statusParts.push(getCurrentModelDisplayLabel() || getDefaultModelForClient(currentMode));
   }
   statusParts.push(detailLabel);

   const statusText = statusParts.join(' • ');
   document.getElementById('statusText').textContent = statusText;
}

function getPresetEntriesByMode(mode) {
   const presetMap = (dynamicPresets && dynamicPresets[mode]) ? dynamicPresets[mode] : {};
   return Object.keys(presetMap)
       .map(key => ({ id: key, ...presetMap[key] }))
       .sort((a, b) => (a.ORDER || 0) - (b.ORDER || 0));
}

function hasAnyPresets(presets) {
   return ['action', 'array', 'image'].some(mode => Object.keys((presets && presets[mode]) || {}).length > 0);
}

function loadDynamicPresets() {
   google.script.run
       .withSuccessHandler(presets => {
           dynamicPresets = presets;
           updatePopupPresetsUI(presets);
           renderPresetManagerList();
           if (!hasAnyPresets(presets)) {
               openPresetManager(currentMode);
           }
           refreshIcons();
       })
       .withFailureHandler(error => {
           console.error('Error loading presets:', error);
           showPopupPresetError(error.message || error.toString());
           refreshIcons();
       })
       .getDynamicPresets();
}

function updatePopupPresetsUI(presets) {
   const presetContainer = document.getElementById('popupPresetOptions');
   presetContainer.innerHTML = '';

   const presetEntries = getPresetEntriesByMode(currentMode);
   
   if (presetEntries.length === 0) {
       currentPreset = null;
       showPopupPresetError('No presets in this mode');
       return;
   }
   
   const presetExists = currentPreset && presetEntries.some(item => item.id === currentPreset);
   if (!presetExists) {
       currentPreset = presetEntries[0].id;
   }
   
   presetEntries.forEach(preset => {
       const option = document.createElement('div');
       option.className = 'popup-option';
       option.textContent = preset.DISPLAY_NAME;
       option.onclick = () => selectPopupPreset(preset.DISPLAY_NAME, option, preset.id);
       
       if (preset.id === currentPreset) {
           option.classList.add('active');
       }
       
       presetContainer.appendChild(option);
   });
   
   updateStatusText();
}

/**
* Show popup preset error
*/
function showPopupPresetError(errorMessage) {
   const presetContainer = document.getElementById('popupPresetOptions');
   presetContainer.innerHTML = \`
       <div class="empty-preset-state">
           <div style="margin-bottom: 10px;">\${errorMessage.replace(/\\n/g, '<br>')}</div>
           <button class="empty-action-btn" onclick="openPresetManager()">Create preset</button>
       </div>
   \`;
   updateStatusText();
   refreshIcons();
}

function updateMode() {
   const turboToggle = document.getElementById('turbo-toggle');
   const presetSection = document.getElementById('popupPresetSection');
   const modelSection = document.getElementById('popupModelSection');
   const capabilitySection = document.getElementById('popupCapabilitySection');
   const agentLogSection = document.getElementById('popupAgentLogSection');

   if (currentMode === 'action') {
       turboToggle.style.display = 'flex';
   } else {
       turboToggle.style.display = 'none';
       turboMode = false;
       turboToggle.classList.remove('active');
   }

   if (currentMode === 'agent') {
       if (presetSection) presetSection.style.display = 'none';
       renderModelOptions();
       renderCapabilityOptions();
       if (modelSection) modelSection.style.display = '';
       if (capabilitySection) capabilitySection.style.display = '';
       if (agentLogSection) agentLogSection.style.display = '';
       updateStatusText();
       updateSelectedCell();
       return;
   }

   if (presetSection) presetSection.style.display = '';
   if (agentLogSection) agentLogSection.style.display = 'none';
   renderModelOptions();
   renderCapabilityOptions();
   if (modelSection && isTextModeClient(currentMode)) {
       modelSection.style.display = '';
   }
   if (capabilitySection) capabilitySection.style.display = '';
   
   if (dynamicPresets) {
       updatePopupPresetsUI(dynamicPresets);
   } else {
       loadDynamicPresets();
   }

   updateSelectedCell();
}

function openPresetManager(mode = currentMode) {
   presetManagerMode = mode || currentMode || 'action';
   editingPresetId = null;
   document.getElementById('settingsPopup').classList.remove('show');
   const modal = document.getElementById('presetManagerModal');
   modal.classList.add('show');
   syncPresetManagerModeOptions();
   resetPresetForm();
   renderPresetManagerList();
}

function closePresetManager() {
   document.getElementById('presetManagerModal').classList.remove('show');
}

function handlePresetModalBackdrop(event) {
   if (event.target.id === 'presetManagerModal') {
       closePresetManager();
   }
}

function syncPresetManagerModeOptions() {
   document.querySelectorAll('#presetManagerModeOptions .popup-option').forEach(option => {
       option.classList.toggle('active', option.dataset.mode === presetManagerMode);
   });
}

function selectPresetManagerMode(mode, element) {
   presetManagerMode = mode;
   editingPresetId = null;
   document.querySelectorAll('#presetManagerModeOptions .popup-option').forEach(option => {
       option.classList.remove('active');
   });
   element.classList.add('active');
   resetPresetForm();
   renderPresetManagerList();
}

function renderPresetManagerList() {
   const list = document.getElementById('presetManagerList');
   if (!list) return;

   list.innerHTML = '';
   const entries = getPresetEntriesByMode(presetManagerMode);

   if (entries.length === 0) {
       list.innerHTML = '<div class="empty-preset-state">No presets yet<br>Create your first preset below</div>';
       refreshIcons();
       return;
   }

   entries.forEach(entry => {
       const item = document.createElement('button');
       item.className = 'preset-list-item';
       item.type = 'button';
       if (entry.id === editingPresetId) {
           item.classList.add('active');
       }

       const previewText = (entry.PROMPT || '').slice(0, 120);
       item.innerHTML = \`
           <div class="preset-list-name">\${entry.DISPLAY_NAME}</div>
           <div class="preset-list-preview">\${previewText || 'ไม่มี prompt'}</div>
       \`;
       item.onclick = () => selectPresetForEditing(entry.id);
       list.appendChild(item);
   });
   refreshIcons();
}

function resetPresetForm() {
   editingPresetId = null;
   document.getElementById('presetNameInput').value = '';
   document.getElementById('presetPromptInput').value = '';
   document.getElementById('deletePresetButton').style.display = 'none';
   renderPresetManagerList();
}

function selectPresetForEditing(presetId) {
   const preset = (dynamicPresets && dynamicPresets[presetManagerMode]) ? dynamicPresets[presetManagerMode][presetId] : null;
   if (!preset) return;

   editingPresetId = presetId;
   document.getElementById('presetNameInput').value = preset.DISPLAY_NAME || '';
   document.getElementById('presetPromptInput').value = preset.PROMPT || '';
   document.getElementById('deletePresetButton').style.display = 'inline-flex';
   renderPresetManagerList();
}

function savePresetFromModal() {
   const presetName = document.getElementById('presetNameInput').value.trim();
   const prompt = document.getElementById('presetPromptInput').value.trim();

   google.script.run
       .withSuccessHandler(result => {
           dynamicPresets = result.presets;
           if (currentMode === presetManagerMode || !currentPreset) {
               currentPreset = result.selectedPresetId;
           }
           updatePopupPresetsUI(dynamicPresets);
           editingPresetId = result.selectedPresetId;
           selectPresetForEditing(result.selectedPresetId);
       })
       .withFailureHandler(error => {
           alert('เกิดข้อผิดพลาด: ' + error.toString());
       })
       .saveDynamicPreset(presetManagerMode, editingPresetId, presetName, prompt);
}

function deletePresetFromModal() {
   if (!editingPresetId) return;

   google.script.run
       .withSuccessHandler(result => {
           dynamicPresets = result.presets;
           if (currentPreset === result.deletedPresetId) {
               currentPreset = null;
           }
           updatePopupPresetsUI(dynamicPresets);
           resetPresetForm();
           renderPresetManagerList();
       })
       .withFailureHandler(error => {
           alert('เกิดข้อผิดพลาด: ' + error.toString());
       })
       .deleteDynamicPreset(presetManagerMode, editingPresetId);
}

function updateSelectedCell() {
   google.script.run.withSuccessHandler(cellInfo => {
       const selectedCell = document.getElementById('selected-cell');
       selectedCell.textContent = currentMode === 'agent' ? cellInfo : 'Data selected: ' + cellInfo;
   }).getRealUniverseFooterContext(currentMode);
}

function addMessage(text, sender, animate = false) {
   const messages = document.getElementById('messages');
   const emptyState = messages.querySelector('.empty-state');
   if (emptyState) emptyState.remove();

   const messageDiv = document.createElement('div');
   messageDiv.className = 'message ' + sender;

   const content = document.createElement('div');
   content.className = 'message-content';
   
   if (sender === 'bot') {
       const copyButton = document.createElement('button');
       copyButton.className = 'copy-button tooltip';
       copyButton.innerHTML = getIconMarkup('copy');
       copyButton.setAttribute('data-tooltip', 'Copy');
       copyButton.onclick = function() {
           copyToClipboard(content.innerHTML, this);
       };
       content.appendChild(copyButton);
   }
   
   if (sender === 'user' || !animate) {
       if (sender === 'bot') {
           const withMarkdown = parseMarkdown(text);
           content.innerHTML = convertLinksToClickable(withMarkdown);
           if (!content.querySelector('.copy-button')) {
               const copyButton = document.createElement('button');
               copyButton.className = 'copy-button tooltip';
               copyButton.innerHTML = getIconMarkup('copy');
               copyButton.setAttribute('data-tooltip', 'Copy');
               copyButton.onclick = function() {
                   copyToClipboard(content.innerHTML, this);
               };
               content.appendChild(copyButton);
           }
       } else {
           content.textContent = text;
       }
   } else {
       content.innerHTML = '';
       const copyButton = document.createElement('button');
       copyButton.className = 'copy-button tooltip';
       copyButton.innerHTML = getIconMarkup('copy');
       copyButton.setAttribute('data-tooltip', 'Copy');
       copyButton.onclick = function() {
           copyToClipboard(content.innerHTML, this);
       };
       content.appendChild(copyButton);
   }

   messageDiv.appendChild(content);
   messages.appendChild(messageDiv);

   if (sender === 'bot' && animate) {
       isTyping = true;
       currentTypingElement = content;
       currentTypingText = text;
       updateSendButton();
       typeWriterByWord(content, text);
   } else {
       scrollToBottom();
       if (sender === 'bot') {
           messageDiv.classList.add('typing-finished');
       }
   }
   refreshIcons();
}

function typeWriterByWord(element, text) {
   const words = text.split(' ');
   let wordIndex = 0;
   
   const copyButton = element.querySelector('.copy-button');
   element.innerHTML = '';
   if (copyButton) {
       element.appendChild(copyButton);
   }

   function addNextWord() {
       if (wordIndex < words.length && isTyping) {
           const currentText = words.slice(0, wordIndex + 1).join(' ');
           const withMarkdown = parseMarkdown(currentText);
           const textContainer = document.createElement('span');
           textContainer.innerHTML = convertLinksToClickable(withMarkdown);
           
           element.innerHTML = '';
           element.appendChild(textContainer);
           if (copyButton) {
               element.appendChild(copyButton);
           }
           
           wordIndex++;
           scrollToBottom();
           setTimeout(addNextWord, 150);
       } else {
           isTyping = false;
           updateSendButton();
           scrollToBottom();
           const messageDiv = element.closest('.message');
           if (messageDiv) {
               messageDiv.classList.add('typing-finished');
           }
       }
   }

   addNextWord();
}

function stopTyping() {
   if (isTyping && currentTypingElement && currentTypingText) {
       isTyping = false;
       const copyButton = currentTypingElement.querySelector('.copy-button');
       const withMarkdown = parseMarkdown(currentTypingText);
       const textContainer = document.createElement('span');
       textContainer.innerHTML = convertLinksToClickable(withMarkdown);
       
       currentTypingElement.innerHTML = '';
       currentTypingElement.appendChild(textContainer);
       if (copyButton) {
           currentTypingElement.appendChild(copyButton);
       }
       
       updateSendButton();
       scrollToBottom();
       
       const messageDiv = currentTypingElement.closest('.message');
       if (messageDiv) {
           messageDiv.classList.add('typing-finished');
       }
   }
}

function updateSendButton() {
   const sendButton = document.getElementById('sendButton');
   if (!sendButton) return;
   if (isTyping) {
       sendButton.classList.add('spinning');
   } else {
       sendButton.classList.remove('spinning');
   }
   sendButton.setAttribute('aria-label', isAgentRunActive() ? 'Stop' : 'Send');
}

function scrollToBottom() {
   const messages = document.getElementById('messages');
   messages.scrollTo({
       top: messages.scrollHeight,
       behavior: 'smooth'
   });
}

function sendQuickAction(command) {
   const input = document.getElementById('messageInput');
   input.value = command;
   sendMessage();
}

function sendMessage() {
   if (requestAgentStop()) {
       return;
   }

   if (isTyping) {
       stopTyping();
       return;
   }

   const input = document.getElementById('messageInput');
   const sendButton = document.getElementById('sendButton');
   const question = input.value.trim();
   const selectedModel = isTextModeClient(currentMode) ? getSelectedModelForMode(currentMode) : null;
   const selectedReasoning = isTextModeClient(currentMode) ? getCurrentReasoningEffort() : null;
   if (!question) return;

   if (currentMode !== 'agent' && !currentPreset) {
       alert('ยังไม่มี Preset สำหรับโหมดนี้ กรุณาสร้างหรือเลือก Preset ก่อนใช้งาน');
       return;
   }

   input.disabled = true;
   sendButton.disabled = currentMode !== 'agent';
   isTyping = true;
   updateSendButton();
   addMessage(question, 'user', false);
   input.value = '';
   input.style.height = 'auto';
   showTypingIndicator();

   if (currentMode === 'agent') {
       sendAgentMessage(question)
           .catch(error => {
               clearAgentWorkPanel();
               addMessage('เกิดข้อผิดพลาด: ' + error.toString(), 'bot', false);
           })
           .finally(() => {
               hideTypingIndicator();
               input.disabled = false;
               sendButton.disabled = false;
               isTyping = false;
               updateSendButton();
               input.focus();
               updateSelectedCell();
           });
       return;
   }

   google.script.run
       .withSuccessHandler(answer => {
           hideTypingIndicator();
           input.disabled = false;
           sendButton.disabled = false;
           isTyping = false;
           updateSendButton();
           input.focus();
           if (currentMode === 'array' && Array.isArray(answer)) {
               addMessage(answer[0][0], 'bot', true);
           } else {
               addMessage(answer, 'bot', true);
           }
       })
       .withFailureHandler(error => {
           hideTypingIndicator();
           input.disabled = false;
           sendButton.disabled = false;
           isTyping = false;
           updateSendButton();
           input.focus();
           addMessage('เกิดข้อผิดพลาด: ' + error.toString(), 'bot', true);
       })
       .processRealUniverseAI(question, currentPreset, currentTemperature, currentMode, turboMode, selectedModel, selectedReasoning);
}

function showTypingIndicator() {
   const messages = document.getElementById('messages');
   const typingDiv = document.createElement('div');
   typingDiv.className = 'message bot';
   typingDiv.id = 'typing-indicator';

   const indicator = document.createElement('div');
   indicator.className = 'typing-indicator';
   indicator.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="10" height="10" x="1" y="1" fill="#8360c3" rx="1"><animate id="svgSpinnersBlocksShuffle30" fill="freeze" attributeName="x" begin="0;svgSpinnersBlocksShuffle3b.end" dur="0.21s" values="1;13"/><animate id="svgSpinnersBlocksShuffle31" fill="freeze" attributeName="y" begin="svgSpinnersBlocksShuffle38.end" dur="0.21s" values="1;13"/><animate id="svgSpinnersBlocksShuffle32" fill="freeze" attributeName="x" begin="svgSpinnersBlocksShuffle39.end" dur="0.21s" values="13;1"/><animate id="svgSpinnersBlocksShuffle33" fill="freeze" attributeName="y" begin="svgSpinnersBlocksShuffle3a.end" dur="0.21s" values="13;1"/></rect><rect width="10" height="10" x="1" y="13" fill="#8360c3" rx="1"><animate id="svgSpinnersBlocksShuffle34" fill="freeze" attributeName="y" begin="svgSpinnersBlocksShuffle30.end" dur="0.21s" values="13;1"/><animate id="svgSpinnersBlocksShuffle35" fill="freeze" attributeName="x" begin="svgSpinnersBlocksShuffle31.end" dur="0.21s" values="1;13"/><animate id="svgSpinnersBlocksShuffle36" fill="freeze" attributeName="y" begin="svgSpinnersBlocksShuffle32.end" dur="0.21s" values="1;13"/><animate id="svgSpinnersBlocksShuffle37" fill="freeze" attributeName="x" begin="svgSpinnersBlocksShuffle33.end" dur="0.21s" values="13;1"/></rect><rect width="10" height="10" x="13" y="13" fill="#8360c3" rx="1"><animate id="svgSpinnersBlocksShuffle38" fill="freeze" attributeName="x" begin="svgSpinnersBlocksShuffle34.end" dur="0.21s" values="13;1"/><animate id="svgSpinnersBlocksShuffle39" fill="freeze" attributeName="y" begin="svgSpinnersBlocksShuffle35.end" dur="0.21s" values="13;1"/><animate id="svgSpinnersBlocksShuffle3a" fill="freeze" attributeName="x" begin="svgSpinnersBlocksShuffle36.end" dur="0.21s" values="1;13"/><animate id="svgSpinnersBlocksShuffle3b" fill="freeze" attributeName="y" begin="svgSpinnersBlocksShuffle37.end" dur="0.21s" values="1;13"/></rect></svg>';

   typingDiv.appendChild(indicator);
   messages.appendChild(typingDiv);
   scrollToBottom();
}

function hideTypingIndicator() {
   const indicator = document.getElementById('typing-indicator');
   if (indicator) indicator.remove();
}

function toggleDisplayMode() {
   try {
       google.script.run
           .withSuccessHandler(() => {
               // Backend handles everything
           })
           .withFailureHandler(error => {
               console.error('Error toggling display mode:', error);
           })
           .toggleDisplayMode();
   } catch (e) {
       console.error('Error calling toggle function:', e);
   }
}

function initializeDisplayMode() {
   google.script.run
       .withSuccessHandler(mode => {
           const container = document.getElementById('main-container');
           const button = document.getElementById('mode-switch-button');
           
           if (mode === 'sidebar') {
               container.classList.add('sidebar-mode');
               button.innerHTML = getIconMarkup('panel-right-open');
           } else {
               container.classList.remove('sidebar-mode');
               button.innerHTML = getIconMarkup('panel-right-open');
           }
           refreshIcons();
       })
       .withFailureHandler(() => {
           const container = document.getElementById('main-container');
           const button = document.getElementById('mode-switch-button');
           container.classList.remove('sidebar-mode');
           button.innerHTML = getIconMarkup('panel-right-open');
           refreshIcons();
       })
       .getCurrentDisplayMode();
}

function registerGlobalShellHandlers() {
   if (typeof window === 'undefined') return;
   Object.assign(window, {
       toggleDisplayMode,
       toggleSettingsPopup,
       sendQuickAction,
       toggleTurbo,
       selectPopupMode,
       selectPopupModel,
       openPresetManager,
       closePresetManager,
       handlePresetModalBackdrop,
       openAgentLogModal,
       closeAgentLogModal,
       handleAgentLogModalBackdrop,
       copyAgentLog,
       clearAgentLog,
       selectPresetManagerMode,
       resetPresetForm,
       deletePresetFromModal,
       savePresetFromModal,
       sendMessage
   });
}

// Close popup when clicking outside
document.addEventListener('click', function(event) {
   const popup = document.getElementById('settingsPopup');
   const trigger = document.querySelector('.hamburger-btn');

   if (!popup || !trigger) return;

   if (!popup.contains(event.target) && !trigger.contains(event.target)) {
       popup.classList.remove('show');
   }
});

const messageInput = document.getElementById('messageInput');
if (messageInput) {
   messageInput.addEventListener('input', function() {
       this.style.height = 'auto';
       this.style.height = this.scrollHeight + 'px';
   });

   messageInput.addEventListener('keydown', function(e) {
       if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
           e.preventDefault();
           sendMessage();
       }
   });
}

if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', bootRealUniverseApp, { once: true });
} else {
   bootRealUniverseApp();
}

registerGlobalShellHandlers();
</script>
</body>
</html>`;
}
