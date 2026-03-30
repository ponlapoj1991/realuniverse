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

/* ------------------ DYNAMIC PRESET FUNCTIONS ------------------ */

/**
 * Get dynamic presets from Sheet "Preset"
 * Returns object with action and array presets based on sheet content
 */
function getDynamicPresets() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Preset');

  // หยุดทำงานทันทีหากไม่พบ Sheet Preset
  if (!sheet) {
    throw new Error('❌ ไม่พบ Sheet "Preset" โปรดสร้าง Sheet ชื่อ "Preset" ก่อนใช้งาน');
  }

  try {
    const presets = {
      action: {},
      array: {},
      image: {}
    };

    // อ่าน Action Presets (คอลัมน์ A-B) - รองรับได้สูงสุด 20 แถว
    const actionRange = sheet.getRange('A2:B21');
    const actionValues = actionRange.getValues();

    actionValues.forEach((row, index) => {
      const [name, systemMessage] = row;
      if (name && String(name).trim() && systemMessage && String(systemMessage).trim()) {
        const key = `action_preset_${index + 2}`;
        presets.action[key] = {
          SYSTEM_MESSAGE: `Preset!B${index + 2}`,
          DISPLAY_NAME: String(name).trim(),
          ROW_NUMBER: index + 2
        };
      }
    });

    // อ่าน Array Presets (คอลัมน์ D-E)
    const arrayRange = sheet.getRange('D2:E21');
    const arrayValues = arrayRange.getValues();

    arrayValues.forEach((row, index) => {
      const [name, systemMessage] = row;
      if (name && String(name).trim() && systemMessage && String(systemMessage).trim()) {
        const key = `array_preset_${index + 2}`;
        presets.array[key] = {
          SYSTEM_MESSAGE: `Preset!E${index + 2}`,
          DISPLAY_NAME: String(name).trim(),
          ROW_NUMBER: index + 2
        };
      }
    });

    // อ่าน Image Presets (คอลัมน์ G-H)
    const imageRange = sheet.getRange('G2:H21');
    const imageValues = imageRange.getValues();

    imageValues.forEach((row, index) => {
      const [name, promptTemplate] = row;
      if (name && String(name).trim() && promptTemplate && String(promptTemplate).trim()) {
        const key = `image_preset_${index + 2}`;
        presets.image[key] = {
          SYSTEM_MESSAGE: `Preset!H${index + 2}`,
          DISPLAY_NAME: String(name).trim(),
          ROW_NUMBER: index + 2
        };
      }
    });

    if (Object.keys(presets.action).length === 0 && Object.keys(presets.array).length === 0) {
      throw new Error('❌ Sheet "Preset" ว่างเปล่า\n\nโปรดเพิ่มข้อมูล Preset:\n- Action Presets: คอลัมน์ A-B (ชื่อ-คำสั่ง)\n- Array Presets: คอลัมน์ D-E (ชื่อ-คำสั่ง)');
    }

    Logger.log('Dynamic presets loaded successfully:');
    Logger.log('Action presets: ' + Object.keys(presets.action).length);
    Logger.log('Array presets: ' + Object.keys(presets.array).length);

    return presets;

  } catch (e) {
    if (e.message.includes('❌')) throw e;
    throw new Error('❌ เกิดข้อผิดพลาดในการอ่าน Sheet "Preset":\n' + e.message);
  }
}

function getPresetDescriptionByKey(presetKey) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Preset');
    if (!sheet) return 'ไม่มีคำอธิบาย';

    if (presetKey.includes('action_preset_')) {
      const rowNum = presetKey.split('_')[2];
      const descValue = sheet.getRange(`C${rowNum}`).getValue();
      if (descValue && String(descValue).trim()) return String(descValue).trim();
    } else if (presetKey.includes('array_preset_')) {
      const rowNum = presetKey.split('_')[2];
      const descValue = sheet.getRange(`F${rowNum}`).getValue();
      if (descValue && String(descValue).trim()) return String(descValue).trim();
    } else if (presetKey.includes('image_preset_')) {
      const rowNum = presetKey.split('_')[2];
      const descValue = sheet.getRange(`I${rowNum}`).getValue();
      if (descValue && String(descValue).trim()) return String(descValue).trim();
    }

    return 'ไม่มีคำอธิบาย';
  } catch (e) {
    return 'ไม่สามารถอ่านคำอธิบายได้';
  }
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

function processRealUniverseAI(prompt, preset = 'action_preset_2', temperature = 0, mode = 'action', turboMode = false) {
  try {
    if (mode === 'action') {
      if (turboMode) {
        return processRealUniverseTurbo(prompt, preset, temperature);
      } else {
        return processRealUniverseStandard(prompt, preset, temperature);
      }
    } else if (mode === 'array') {
      return processRealUniverseArray(prompt, preset, temperature);
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

function processRealUniverseStandard(prompt, preset, temperature) {
  const systemMessage = getRealUniverseSystemMessage(getDynamicPresetSystemMessage(preset, 'action'), 'action');
  const config = MODEL_CONFIG.action_standard;

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
    max_tokens: config.max_tokens
  };

  const result = makeRealUniverseApiCallWithRetry(payload);
  saveRealUniverseHistory(prompt + ' (Smart)', result);
  return result;
}

function getDynamicPresetSystemMessage(presetKey, mode) {
  try {
    const presets = getDynamicPresets();
    const modePresets = presets[mode] || {};

    if (modePresets[presetKey]) {
      return modePresets[presetKey].SYSTEM_MESSAGE;
    }

    const firstKey = Object.keys(modePresets)[0];
    if (firstKey) return modePresets[firstKey].SYSTEM_MESSAGE;

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

function processRealUniverseTurbo(userPrompt, presetName, temperature) {
  const reduceSystemMessage = getRealUniverseSystemMessage(getDynamicPresetSystemMessage(presetName, 'action'), 'action');
  const config = MODEL_CONFIG.action_turbo;

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
      response_format: { "type": "json_object" }
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
    max_tokens: config.max_tokens
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

function processRealUniverseArray(prompt, preset, temperature) {
  try {
    const systemMessage = getRealUniverseSystemMessage(getDynamicPresetSystemMessage(preset, 'array'), 'array');
    const config = MODEL_CONFIG.array;
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
        max_tokens: config.max_tokens
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
  const { model, messages, temperature, max_tokens, response_format } = payload || {};
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
}
.messages {
    flex: 1;
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
}

/* Sidebar Mode - Keep Dialog Layout */
.sidebar-mode .expanded-input-container {
    max-width: none;
    width: 100%;
}
.sidebar-mode .turbo-wrapper {
    max-width: none;
    width: 100%;
}
.sidebar-mode .quick-actions-buttons {
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}
.sidebar-mode .quick-action-btn {
    border-radius: 12px;
    text-align: center;
    flex: none;
}

.sidebar-mode .in-box-controls {
    flex-wrap: wrap;
    gap: 4px;
}

.sidebar-mode .status-text {
    font-size: 9px;
    padding: 3px 6px;
}

.sidebar-mode .turbo-toggle {
    font-size: 9px;
    padding: 3px 6px;
}

.sidebar-mode .hamburger-btn {
    padding: 3px 6px;
    font-size: 10px;
}

.sidebar-mode .sendButton {
    width: 28px;
    height: 28px;
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
    gap: 4px;
    padding: 4px 8px;
    border-radius: 6px;
    background: transparent;
    border: 1px solid #d1d5db;
    cursor: pointer;
    font-size: 10px;
    color: #86868b;
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
    color: white;
    border: 2px solid #e5e5e7;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
    background-image: url('https://i.ibb.co/vvCrQ8DW/RS.jpg');
    background-size: 26px 26px;
    background-repeat: no-repeat;
    background-position: center;
    transition: all 0.2s ease;
}
.send-button:hover {
    background-color: #f8f9fa;
    border-color: #d1d5db;
    transform: scale(1.05);
}
.send-button:disabled {
    background-color: #f5f5f5;
    background-image: url('https://i.ibb.co/vvCrQ8DW/RS.jpg');
    border-color: #e5e5e7;
    cursor: not-allowed;
    opacity: 0.6;
}
.send-button:disabled.spinning {
    animation: spin 1s linear infinite !important;
    background-color: #f5f5f5 !important;
    background-image: url('https://i.ibb.co/vvCrQ8DW/RS.jpg') !important;
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
    max-height: 100px;
    min-height: 24px;
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
   margin-top: 14px;
   padding: 4px 0 8px 0;
   position: relative;
}

.hamburger-btn {
    background: transparent;
    border: 1px solid #d1d5db;
    color: #86868b;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 12px;
    transition: all 0.2s ease;
}

.hamburger-btn:hover {
    background: rgba(255,255,255,0.5);
    color: #1d1d1f;
}

.status-text {
    font-size: 10px;
    color: #86868b;
    border: 1px solid #d1d5db;
    padding: 4px 8px;
    border-radius: 4px;
}

.sendButton {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid #E6E6FA;
    background: white;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
    flex-shrink: 0;
    align-self: flex-end;
    background-image: url('https://i.ibb.co/vvCrQ8DW/RS.jpg');
    background-size: 26px 26px;
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
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    padding: 16px;
    width: 320px;
    max-height: 350px;
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
    font-size: 12px;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 6px;
}

.popup-options {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.popup-option {
    padding: 4px 8px;
    background: #f8f9fa;
    border: 1px solid #e5e5e7;
    border-radius: 6px;
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

.array-info {
    background: #F0FFFF;
    padding: 6px 8px;
    border-radius: 4px;
    font-size: 10px;
    color: #0066cc;
    border: 1px solid #F0FFFF;
    margin-top: -4px;
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
    padding: 8px 16px 12px 16px;
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
        <button class="mode-switch-button" id="mode-switch-button" onclick="toggleDisplayMode()">
            ▢▣
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
                    <button class="hamburger-btn" onclick="toggleSettingsPopup()">👁</button>
                    <span class="status-text" id="statusText">Answer • Loading... • Exact</span>
                    <button class="turbo-toggle" id="turbo-toggle" onclick="toggleTurbo()" style="display: none;">💡 Deep</button>
                    
                    <!-- Settings Popup -->
                    <div class="settings-popup" id="settingsPopup">
                        <div class="popup-section">
                            <div class="popup-title">🎯 Mode</div>
<div class="popup-options">
    <div class="popup-option active" onclick="selectPopupMode('Answer', this, 'action')">Answer</div>
    <div class="popup-option" onclick="selectPopupMode('Array', this, 'array')">Array</div>
    <div class="popup-option" onclick="selectPopupMode('Create Picture', this, 'image')">Create Picture</div>
</div>
                        </div>
                        
                        <div class="popup-section">
                            <div class="popup-title">⚙️ Preset</div>
                            <div class="popup-options" id="popupPresetOptions">
                                <div style="padding: 12px; text-align: center; font-size: 10px; color: #86868b;">
                                    Loading presets...
                                </div>
                            </div>
                        </div>
                        
                        <div class="popup-section">
                            <div class="popup-title">🎓 AI Creativity</div>
                            <div class="popup-options">
                                <div class="popup-option active" onclick="selectPopupTemp('Exact', this, 0)">Exact</div>
                                <div class="popup-option" onclick="selectPopupTemp('Focused', this, 0.2)">Focused</div>
                                <div class="popup-option" onclick="selectPopupTemp('Balance', this, 0.5)">Balance</div>
                                <div class="popup-option" onclick="selectPopupTemp('Creative', this, 0.7)">Creative</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <button class="sendButton" id="sendButton" onclick="sendMessage()"></button>
        </div>
        
        <div id="selected-cell" class="array-info">Selected: No data selected</div>
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

// Dynamic presets storage
let dynamicPresets = null;
let presetDescriptions = {};

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
           button.innerHTML = '☑';
           button.classList.add('copied');
           button.setAttribute('data-tooltip', 'Copied!');
           
           setTimeout(() => {
               button.innerHTML = '🗒';
               button.classList.remove('copied');
               button.setAttribute('data-tooltip', 'Copy');
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
           
           button.innerHTML = '☑';
           button.classList.add('copied');
           button.setAttribute('data-tooltip', 'Copied!');
           
           setTimeout(() => {
               button.innerHTML = '🗒';
               button.classList.remove('copied');
               button.setAttribute('data-tooltip', 'Copy');
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

function selectPopupMode(modeName, element, modeValue) {
   currentMode = modeValue;
   document.querySelectorAll('#settingsPopup .popup-section:nth-child(1) .popup-option').forEach(option => {
       option.classList.remove('active');
   });
   element.classList.add('active');
   updateMode();
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
   document.querySelectorAll('#settingsPopup .popup-section:nth-child(3) .popup-option').forEach(option => {
       option.classList.remove('active');
   });
   element.classList.add('active');
   updateStatusText();
}

function updateStatusText() {
   const mode = document.querySelector('#settingsPopup .popup-section:nth-child(1) .popup-option.active').textContent;
   const preset = document.querySelector('#popupPresetOptions .popup-option.active')?.textContent || 'Loading...';
   const creativity = document.querySelector('#settingsPopup .popup-section:nth-child(3) .popup-option.active').textContent;
   
   const statusText = \`\${mode} • \${preset} • \${creativity}\`;
   document.getElementById('statusText').textContent = statusText;
}

/**
* Load dynamic presets from backend
*/
function loadDynamicPresets() {
   google.script.run
       .withSuccessHandler(presets => {
           dynamicPresets = presets;
           updatePopupPresetsUI(presets);
           loadPresetDescriptions();
       })
       .withFailureHandler(error => {
           console.error('Error loading presets:', error);
           showPopupPresetError(error.message || error.toString());
       })
       .getDynamicPresets();
}

/**
* Load preset descriptions for UI
*/
function loadPresetDescriptions() {
   if (!dynamicPresets) return;
   
   const allPresetKeys = [
       ...Object.keys(dynamicPresets.action || {}),
       ...Object.keys(dynamicPresets.array || {})
   ];
   
   allPresetKeys.forEach(key => {
       google.script.run
           .withSuccessHandler(description => {
               presetDescriptions[key] = description;
           })
           .withFailureHandler(() => {
               presetDescriptions[key] = 'ไม่มีคำอธิบาย';
           })
           .getPresetDescriptionByKey(key);
   });
}

/**
* Update popup presets UI with dynamic data
*/
function updatePopupPresetsUI(presets) {
   const presetContainer = document.getElementById('popupPresetOptions');
   presetContainer.innerHTML = '';

   const currentPresetList = presets[currentMode] || {};
   const presetKeys = Object.keys(currentPresetList)
       .sort((a, b) => currentPresetList[a].ROW_NUMBER - currentPresetList[b].ROW_NUMBER);
   
   if (presetKeys.length === 0) {
       showPopupPresetError(\`❌ ไม่มี \${currentMode === 'action' ? 'Action' : 'Array'} Presets ใน Sheet "Preset"\`);
       return;
   }
   
   let presetExists = currentPreset && presetKeys.includes(currentPreset);
   if (!presetExists && presetKeys.length > 0) {
       currentPreset = presetKeys[0];
   }
   
   presetKeys.forEach(key => {
       const preset = currentPresetList[key];
       const option = document.createElement('div');
       option.className = 'popup-option';
       option.textContent = preset.DISPLAY_NAME;
       option.onclick = () => selectPopupPreset(preset.DISPLAY_NAME, option, key);
       
       if (key === currentPreset) {
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
       <div style="padding: 12px; color: #dc2626; font-size: 10px; text-align: center; line-height: 1.4;">
           \${errorMessage.replace(/\\n/g, '<br>')}
       </div>
   \`;
   updateStatusText();
}

/**
* Updated updateMode function
*/
function updateMode() {
   const turboToggle = document.getElementById('turbo-toggle');
   if (currentMode === 'action') {
       turboToggle.style.display = 'flex';
   } else {
       turboToggle.style.display = 'none';
       turboMode = false;
       turboToggle.classList.remove('active');
   }
   
   loadDynamicPresets();
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
       copyButton.innerHTML = '🗒';
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
               copyButton.innerHTML = '🗒';
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
       copyButton.innerHTML = '🗒';
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
   if (!question) return;

   if (!currentPreset) {
       alert('โปรดรอให้ระบบโหลด Presets เสร็จก่อนใช้งาน');
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
       .processRealUniverseAI(question, currentPreset, currentTemperature, currentMode, turboMode);
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
               button.innerHTML = '▢▣';
           } else {
               container.classList.remove('sidebar-mode');
               button.innerHTML = '▢▣';
           }
       })
       .withFailureHandler(() => {
           const container = document.getElementById('main-container');
           const button = document.getElementById('mode-switch-button');
           container.classList.remove('sidebar-mode');
           button.innerHTML = '▢▣';
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
   
   loadDynamicPresets();
   updateMode();
   setInterval(updateSelectedCell, 1000);
   initializeDisplayMode();
};
</script>
</body>
</html>`;
}
