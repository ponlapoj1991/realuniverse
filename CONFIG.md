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

const MODEL_REGISTRY = {
  'gpt-4.1': {
    label: 'GPT-4.1',
    apiType: 'chat',
    supportsTemperature: true,
    supportsReasoning: false,
    supportedModes: ['action', 'array']
  },
  'gpt-4.1-mini': {
    label: 'GPT-4.1 Mini',
    apiType: 'chat',
    supportsTemperature: true,
    supportsReasoning: false,
    supportedModes: ['action', 'array']
  },
  'gpt-4.1-nano': {
    label: 'GPT-4.1 Nano',
    apiType: 'chat',
    supportsTemperature: true,
    supportsReasoning: false,
    supportedModes: ['action', 'array']
  },
  'gpt-5': {
    label: 'GPT-5',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['minimal', 'low', 'medium', 'high'],
    defaultReasoning: 'medium',
    supportedModes: ['action', 'array']
  },
  'gpt-5-mini': {
    label: 'GPT-5 Mini',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['minimal', 'low', 'medium', 'high'],
    defaultReasoning: 'medium',
    supportedModes: ['action', 'array']
  },
  'gpt-5-nano': {
    label: 'GPT-5 Nano',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['minimal', 'low', 'medium', 'high'],
    defaultReasoning: 'medium',
    supportedModes: ['action', 'array']
  },
  'gpt-5.2': {
    label: 'GPT-5.2',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['none', 'low', 'medium', 'high'],
    defaultReasoning: 'none',
    supportedModes: ['action', 'array']
  },
  'gpt-5.4': {
    label: 'GPT-5.4',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['none', 'low', 'medium', 'high', 'xhigh'],
    defaultReasoning: 'none',
    supportedModes: ['action', 'array']
  },
  'gpt-5.4-mini': {
    label: 'GPT-5.4 Mini',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['none', 'low', 'medium', 'high', 'xhigh'],
    defaultReasoning: 'none',
    supportedModes: ['action', 'array']
  },
  'gpt-5.4-nano': {
    label: 'GPT-5.4 Nano',
    apiType: 'responses',
    supportsTemperature: false,
    supportsReasoning: true,
    reasoningOptions: ['none', 'low', 'medium', 'high', 'xhigh'],
    defaultReasoning: 'none',
    supportedModes: ['action', 'array']
  }
};

const TEXT_MODE_DEFAULT_MODEL = {
  action: MODEL_CONFIG.action_standard.model,
  array: MODEL_CONFIG.array.model
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
const DEBUG_LOG_SHEET_NAME = 'DebugLog';
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
  return mode === 'action' || mode === 'array';
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
  const { model, messages, temperature, max_tokens, response_format, reasoning } = payload || {};
  if (apiType === 'responses') {
    const body = {
      model: model,
      input: messages
      // ไม่ส่ง temperature ใน Responses API เพื่อหลีกเลี่ยง Unsupported parameter
    };
    if (typeof max_tokens !== 'undefined') {
      body.max_output_tokens = max_tokens; // map เฉพาะไปยังชื่อที่รองรับ
    }
    if (response_format) {
      body.response_format = response_format;
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
.message-content strong {
    font-weight: 600;
    color: #1d1d1f;
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
}

.hamburger-btn:hover {
    background: white;
    color: #1d1d1f;
    border-color: #cbd5e1;
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
                    <button class="hamburger-btn" onclick="toggleSettingsPopup()" aria-label="Settings"><i data-lucide="settings-2"></i></button>
                    <span class="status-text" id="statusText">Answer • Loading... • Exact</span>
                    <button class="turbo-toggle" id="turbo-toggle" onclick="toggleTurbo()" style="display: none;"><i data-lucide="lightbulb"></i><span>Deep</span></button>
                    
                    <!-- Settings Popup -->
                    <div class="settings-popup" id="settingsPopup">
                        <div class="popup-section">
	                            <div class="popup-title"><i data-lucide="circle-dot"></i><span>Mode</span></div>
<div class="popup-options" id="popupModeOptions">
    <div class="popup-option active" onclick="selectPopupMode('Answer', this, 'action')">Answer</div>
    <div class="popup-option" onclick="selectPopupMode('Array', this, 'array')">Array</div>
    <div class="popup-option" onclick="selectPopupMode('Image', this, 'image')">Image</div>
</div>
                        </div>
                        
	                        <div class="popup-section">
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
   array: 'gpt-4.1'
};
let currentReasoningSelections = {
   action: null,
   array: null
};

function getIconMarkup(name) {
   return '<i data-lucide="' + name + '"></i>';
}

function refreshIcons() {
   if (window.lucide && typeof window.lucide.createIcons === 'function') {
       window.lucide.createIcons();
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
function toggleSettingsPopup() {
   const popup = document.getElementById('settingsPopup');
   popup.classList.toggle('show');
}

function isTextModeClient(mode) {
   return mode === 'action' || mode === 'array';
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
               currentReasoningSelections.action = getReasoningEffortForMode('action');
               currentReasoningSelections.array = getReasoningEffortForMode('array');
           }

           if (typeof callback === 'function') callback();
       })
       .withFailureHandler(error => {
           console.error('Error loading model config:', error);
           if (typeof callback === 'function') callback();
       })
       .getRealUniverseModelUiConfig();
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

   const statusParts = [mode, preset];
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
   if (currentMode === 'action') {
       turboToggle.style.display = 'flex';
   } else {
       turboToggle.style.display = 'none';
       turboMode = false;
       turboToggle.classList.remove('active');
   }

   renderModelOptions();
   renderCapabilityOptions();
   
   if (dynamicPresets) {
       updatePopupPresetsUI(dynamicPresets);
   } else {
       loadDynamicPresets();
   }
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
       selectedCell.textContent = 'Data selected: ' + cellInfo;
   }).getRealUniverseSelectedCellInfo();
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
   if (isTyping) {
       sendButton.classList.add('spinning');
   } else {
       sendButton.classList.remove('spinning');
   }
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

   if (!currentPreset) {
       alert('ยังไม่มี Preset สำหรับโหมดนี้ กรุณาสร้างหรือเลือก Preset ก่อนใช้งาน');
       return;
   }

   input.disabled = true;
   sendButton.disabled = true;
   isTyping = true;
   updateSendButton();
   addMessage(question, 'user', false);
   input.value = '';
   input.style.height = 'auto';
   showTypingIndicator();

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

// Close popup when clicking outside
document.addEventListener('click', function(event) {
   const popup = document.getElementById('settingsPopup');
   const trigger = document.querySelector('.hamburger-btn');
   
   if (!popup.contains(event.target) && !trigger.contains(event.target)) {
       popup.classList.remove('show');
   }
});

const messageInput = document.getElementById('messageInput');
messageInput.addEventListener('input', function() {
   this.style.height = 'auto';
   this.style.height = this.scrollHeight + 'px';
});

messageInput.addEventListener('keypress', function(e) {
   if (e.key === 'Enter' && e.ctrlKey) {
       e.preventDefault();
       sendMessage();
   } else if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
   }
});

window.onload = function() {
   setTimeout(() => {
       messageInput.focus();
   }, 100);

   loadModelUiConfig(() => {
       updateMode();
       refreshIcons();
   });
   setInterval(updateSelectedCell, 1000);
   initializeDisplayMode();
};
</script>
</body>
</html>`;
}
