/* Local CSV/XLSX readers. This module never evaluates spreadsheet formulas. */
(function (root) {
  'use strict';

  const MAX_FILE_BYTES = 100 * 1024 * 1024;
  const MAX_UNPACKED_BYTES = 256 * 1024 * 1024;
  const MAX_ROWS = 100000;
  const MAX_CELLS = 3000000;
  const MAX_COLUMNS = 16384;
  const MAX_ZIP_ENTRIES = 2000;
  const forbiddenHeaders = new Set(['__proto__', 'prototype', 'constructor']);
  const dateHeaders = new Set([
    'date', 'postdate', 'publishedat', 'publisheddate', 'publishdate', 'publicationdate',
    'postedat', 'datepublished', 'createdat', 'updatedat', 'observedat', 'observeddate',
    'capturedat', 'captureddate', 'snapshotat', 'collectedat', 'collecteddate',
    'collectiondate', 'commentdate', 'commentedat',
    'timestamp', '发布时间', '发布日期', '发帖时间', '发帖日期', '采集时间',
    '采集日期', '观察时间', '观察日期', '记录时间', '记录日期', '快照时间',
    '快照日期', '评论时间', '评论日期', '發布時間', '發布日期', '發帖時間', '發帖日期',
    '擷取時間', '擷取日期', '觀察時間', '觀察日期', '記錄時間', '記錄日期', '評論時間', '評論日期'
  ]);

  function fail(message) { throw new Error(message); }
  function localName(node) { return node.localName || node.nodeName.split(':').pop(); }
  function descendants(node, name) {
    return Array.from(node.getElementsByTagNameNS('*', name));
  }
  function children(node, name) {
    return Array.from(node.children || node.childNodes).filter(child =>
      child.nodeType === 1 && localName(child) === name);
  }
  function first(node, name) { return descendants(node, name)[0] || null; }
  function isDateHeader(header) {
    const normalized = String(header).trim().toLowerCase().replace(/[\s_\-/]/g, '');
    return dateHeaders.has(normalized);
  }

  // Check the central directory before JSZip expands anything, including CRC checks.
  function checkZipEnvelope(buffer) {
    const view = new DataView(buffer);
    if (view.byteLength < 22) fail('XLSX 文件不完整，请重新导出后再导入。');
    let end = -1;
    for (let i = view.byteLength - 22; i >= Math.max(0, view.byteLength - 65557); i--) {
      if (view.getUint32(i, true) === 0x06054b50 &&
          i + 22 + view.getUint16(i + 20, true) === view.byteLength) { end = i; break; }
    }
    if (end < 0) fail('文件不是完整的 XLSX 压缩包。');
    const entries = view.getUint16(end + 10, true);
    const directorySize = view.getUint32(end + 12, true);
    const directoryStart = view.getUint32(end + 16, true);
    if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) ||
        view.getUint16(end + 8, true) !== entries || entries === 0xffff ||
        directorySize === 0xffffffff || directoryStart === 0xffffffff) {
      fail('不支持分卷或 ZIP64 格式，请另存为普通 XLSX 文件。');
    }
    if (!entries || entries > MAX_ZIP_ENTRIES || directoryStart + directorySize > end) {
      fail('XLSX 文件结构无效或内容过多。');
    }
    let offset = directoryStart;
    let expandedBytes = 0;
    for (let i = 0; i < entries; i++) {
      if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) {
        fail('XLSX 文件目录损坏。');
      }
      const flags = view.getUint16(offset + 8, true);
      const unpacked = view.getUint32(offset + 24, true);
      const diskStart = view.getUint16(offset + 34, true);
      if ((flags & 1) || diskStart || unpacked === 0xffffffff) {
        fail('不支持加密、分卷或 ZIP64 工作簿。');
      }
      expandedBytes += unpacked;
      if (expandedBytes > MAX_UNPACKED_BYTES) fail('XLSX 解压后超过 64 MB，请拆分数据再导入。');
      offset += 46 + view.getUint16(offset + 28, true) +
        view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
      if (offset > directoryStart + directorySize) fail('XLSX 文件目录损坏。');
    }
    if (offset !== directoryStart + directorySize) fail('XLSX 文件目录不完整。');
  }

  async function xmlFromZip(zip, path, required) {
    const entry = zip.file(path);
    if (!entry) {
      if (required) fail('XLSX 缺少必要的工作簿文件：' + path);
      return null;
    }
    const source = await entry.async('string');
    if (source.length > MAX_UNPACKED_BYTES) fail('工作表内容过大，请拆分数据再导入。');
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) fail('XLSX 包含不支持的 XML 声明。');
    const document = new root.DOMParser().parseFromString(source, 'application/xml');
    if (!document.documentElement || descendants(document, 'parsererror').length) {
      fail('XLSX 中的 XML 内容损坏：' + path);
    }
    return document;
  }

  function resolvePath(base, target) {
    if (!target || /[?#\\]/.test(target) || /^[a-z][a-z\d+.-]*:/i.test(target)) {
      fail('XLSX 含有无效的工作表路径。');
    }
    const segments = (target.startsWith('/') ? target.slice(1) : base + '/' + target).split('/');
    const result = [];
    for (const segment of segments) {
      if (!segment || segment === '.') continue;
      if (segment === '..') {
        if (!result.length) fail('XLSX 工作表路径超出文件范围。');
        result.pop();
      } else result.push(segment);
    }
    return result.join('/');
  }

  function richText(node) {
    if (!node) return '';
    return Array.from(node.childNodes).map(child => {
      if (child.nodeType !== 1) return '';
      if (localName(child) === 't') return child.textContent || '';
      if (localName(child) === 'r') return children(child, 't').map(text => text.textContent || '').join('');
      return '';
    }).join('');
  }

  function columnIndex(reference) {
    const match = /^([A-Z]+)[1-9]\d*$/i.exec(reference || '');
    if (!match) fail('XLSX 中存在无效的单元格坐标。');
    let index = 0;
    for (const letter of match[1].toUpperCase()) index = index * 26 + letter.charCodeAt(0) - 64;
    if (index > MAX_COLUMNS) fail('XLSX 列数超出工作表范围。');
    return index - 1;
  }

  function excelDate(value, use1904) {
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(String(value).trim())) return value;
    const serial = Number(value);
    if (!Number.isFinite(serial) || serial < 0 || serial > 2958465) return value;
    // Excel's invented 1900-02-29 has no valid ISO date.
    if (!use1904 && serial >= 60 && serial < 61) fail('日期列包含 Excel 的无效日期 1900年2月29日，请修正后导入。');
    const base = use1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 31);
    const adjusted = !use1904 && serial >= 60 ? serial - 1 : serial;
    const time = base + Math.round(adjusted * 86400000);
    const result = new Date(time);
    return Number.isFinite(result.getTime()) ? result.toISOString() : value;
  }

  function recordsFromSheet(document, sharedStrings, use1904) {
    const sheetData = first(document, 'sheetData');
    if (!sheetData) fail('首个工作表没有可读取的数据。');
    const rows = children(sheetData, 'row');
    const records = [];
    let headers = null;
    let cellCount = 0;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const values = [];
      let lastIndex = -1;
      for (const cell of children(rows[rowIndex], 'c')) {
        if (++cellCount > MAX_CELLS) fail('工作表单元格过多，请拆分数据再导入。');
        const reference = cell.getAttribute('r');
        const index = reference ? columnIndex(reference) : lastIndex + 1;
        if (index >= MAX_COLUMNS || index <= lastIndex) fail('XLSX 单元格顺序或坐标无效。');
        lastIndex = index;
        const type = cell.getAttribute('t');
        const cached = children(cell, 'v')[0];
        let value = cached ? cached.textContent || '' : '';
        if (type === 'inlineStr') value = richText(children(cell, 'is')[0]);
        else if (type === 's' && cached) {
          if (!/^\d+$/.test(value) || Number(value) >= sharedStrings.length) {
            fail('XLSX 中的共享文本引用损坏。');
          }
          value = sharedStrings[Number(value)];
        } else if (type === 'b' && cached) value = value === '1' ? 'true' : 'false';
        values[index] = value;
      }
      if (!values.some(value => String(value || '').trim() !== '')) continue;
      if (!headers) {
        headers = Array.from({ length: values.length }, (_, index) => String(values[index] || '').replace(/^\uFEFF/, '').trim());
        const seen = new Set();
        for (const header of headers) {
          if (!header) fail('表头存在空列名，请为每个数据列填写列名。');
          if (seen.has(header.toLowerCase()) || forbiddenHeaders.has(header.toLowerCase())) {
            fail('表头有重复或不支持的列名：' + header);
          }
          seen.add(header.toLowerCase());
        }
        continue;
      }
      if (records.length >= MAX_ROWS) fail('每次最多导入 100,000 行数据，请拆分文件。');
      if (values.some((value, index) => index >= headers.length && String(value || '').trim() !== '')) {
        fail('工作表第 ' + (rowIndex + 1) + ' 行的数据超出表头列数。');
      }
      const record = Object.create(null);
      headers.forEach((header, index) => {
        const value = values[index] === undefined ? '' : values[index];
        record[header] = isDateHeader(header) && value !== '' ? excelDate(value, use1904) : value;
      });
      records.push(record);
    }
    if (!headers || !records.length) fail('文件没有数据行，请在首行填写表头，并从第二行开始填写数据。');
    return records;
  }

  async function readXLSX(file) {
    if (!root.JSZip || !root.DOMParser) fail('XLSX 读取组件未加载，请刷新页面后重试。');
    const buffer = await file.arrayBuffer();
    checkZipEnvelope(buffer);
    let zip;
    try { zip = await root.JSZip.loadAsync(buffer, { checkCRC32: true, createFolders: false }); }
    catch (error) { fail('XLSX 压缩内容损坏或已加密，请重新导出文件。'); }
    const workbook = await xmlFromZip(zip, 'xl/workbook.xml', true);
    const relationships = await xmlFromZip(zip, 'xl/_rels/workbook.xml.rels', true);
    const relations = descendants(relationships, 'Relationship');
    const sheets = descendants(workbook, 'sheet');
    let selected = null;
    for (const sheet of sheets) {
      const id = sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || sheet.getAttribute('r:id');
      const relation = relations.find(item => item.getAttribute('Id') === id);
      if (relation && /\/worksheet$/.test(relation.getAttribute('Type') || '')) { selected = relation; break; }
    }
    if (!selected || selected.getAttribute('TargetMode') === 'External') fail('XLSX 没有可读取的首个工作表。');
    const sheetPath = resolvePath('xl', selected.getAttribute('Target'));
    const sharedRelation = relations.find(item => /\/sharedStrings$/.test(item.getAttribute('Type') || ''));
    if (sharedRelation && sharedRelation.getAttribute('TargetMode') === 'External') fail('不支持外部共享文本。');
    const sharedPath = sharedRelation ? resolvePath('xl', sharedRelation.getAttribute('Target')) : 'xl/sharedStrings.xml';
    const sharedDocument = await xmlFromZip(zip, sharedPath, false);
    const sharedStrings = sharedDocument ? descendants(sharedDocument, 'si').map(richText) : [];
    const worksheet = await xmlFromZip(zip, sheetPath, true);
    const properties = first(workbook, 'workbookPr');
    const use1904 = properties && /^(1|true)$/i.test(properties.getAttribute('date1904') || '');
    return recordsFromSheet(worksheet, sharedStrings, use1904);
  }

  async function readFile(file) {
    if (!file || typeof file.name !== 'string' || typeof file.size !== 'number') fail('请先选择 CSV 或 XLSX 文件。');
    if (!file.size) fail('所选文件为空。');
    if (file.size > MAX_FILE_BYTES) fail('文件超过 100 MB，请拆分后再导入。');
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'xlsx') return readXLSX(file);
    if (extension !== 'csv') fail('仅支持 .csv 和 .xlsx 文件，旧版 .xls 请先另存为 .xlsx。');
    if (!root.WorkbenchCore || typeof root.WorkbenchCore.parseCSV !== 'function') fail('CSV 读取组件未加载，请刷新页面后重试。');
    const records = root.WorkbenchCore.parseCSV(await file.text());
    if (!Array.isArray(records) || records.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
      fail('CSV 读取结果无效，请检查首行表头和分隔符。');
    }
    if (!records.length) fail('CSV 没有数据行，请在首行填写表头。');
    if (records.length > MAX_ROWS) fail('每次最多导入 100,000 行数据，请拆分文件。');
    return records;
  }

  root.WorkbenchImports = Object.freeze({ readFile });
})(globalThis);
