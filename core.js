(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WorkbenchCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DAY = 86400000;
  var ROLES = [
    '工程与技术', '产品与项目', '设计', '营销与销售', '招聘与人力', '医疗与健康', '餐饮与酒店', '运营与行政', '其他与未识别',
    '金融保险', '教育培训', '制造业与工业生产', '零售与电商', '物流与运输', '公共部门与非营利', '建筑房地产与工程'
  ];
  var SIGNAL_LABELS = { salary: '薪资提及', remote: '远程/混合安排', qualification: '资格与经验', benefits: '福利', application: '申请方式', cta: '行动号召' };
  var THEME_LABELS = { pay_benefits: '薪资福利', location_remote: '地点远程', qualification_experience: '资格经验', application_process: '申请流程', application_interest: '申请意向', other: '其他' };
  var POST_FIELDS = ['sourceId', 'url', 'relatedJobUrl', 'text', 'jobFamily', 'publishedAt', 'collectedAt', 'ageDays', 'likes', 'commentsCount', 'reposts', 'batch', 'keyword', 'isDuplicate', 'provenance'];
  var ROLE_ALIASES = [
    'Engineering and technology|工程與技術', 'Product and project management|Product and project|產品與專案|產品與項目', 'Design|設計', 'Marketing and sales|行銷與銷售|營銷與銷售', 'Recruiting and HR|招聘與人力', 'Healthcare|醫療與健康', 'Hospitality|餐飲與酒店|Hospitality and food service|餐飲酒店', 'Operations and administration|營運與行政|運營與行政|Operations and administration', 'Other or unclassified|其他與未識別|其他與未识别',
    'Finance and insurance|Financial services|Finance|Insurance|金融保險|金融與保險|金融保险', 'Education and training|Education|Training|教育培訓|教育與培訓|教育培训', 'Manufacturing and industrial production|Manufacturing|Industrial production|製造業與工業生產|制造业与工业生产', 'Retail and e-commerce|Retail|E-commerce|Ecommerce|零售與電商|零售与电商', 'Logistics and transportation|Logistics and transport|Transportation|物流與運輸|物流与运输', 'Public sector and non-profit|Public sector|Non-profit|Nonprofit|公共部門與非營利|公共部门与非营利', 'Architecture, real estate and construction|Construction|Real estate|建築房地產與工程|建筑房地产与工程'
  ];
  var ROLE_PATTERNS = [
    /\b(?:engineer(?:ing)?|developer|programmer|devops|sre|frontend|backend|full[ -]?stack|data scien(?:ce|tist)|data analyst|data architect|machine learning|cyber[ -]?security|software|technician|it support|quality assurance|qa engineer)\b|工程师|开发|程序员|技术员|前端|后端|算法|数据分析|数据科学|软件|网络安全|运维|测试工程/gi,
    /\b(?:product manager|product owner|project manager|project coordinator|program manager|business analyst|scrum master|product lead|product management)\b|产品经理|产品负责人|产品运营|项目经理|项目管理|项目协调/gi,
    /\b(?:designer|design lead|ux|ui|graphic design|creative director|art director|illustrator)\b|设计师|设计主管|视觉设计|平面设计|交互设计|用户体验/gi,
    /\b(?:sales|marketing|account executive|business development|account manager|sdr|bdr|copywriter|growth manager|brand manager|digital marketing)\b|销售|营销|商务拓展|客户经理|市场经理|市场专员|广告|文案|品牌经理/gi,
    /\b(?:recruiter|talent acquisition|human resources|hr manager|hr specialist|hrbp|recruitment consultant|recruitment specialist|people operations)\b|招聘专员|招聘顾问|招聘经理|人力资源|人事专员|人事经理/gi,
    /\b(?:nurse|nursing|physician|doctor|dentist|pharmacist|therapist|medical assistant|healthcare assistant|care assistant|clinical|paramedic|radiographer|physiotherapist)\b|护士|医生|医师|药师|理疗|护理|医疗助理|健康顾问/gi,
    /\b(?:chef|cook|barista|bartender|waiter|waitress|housekeeper|restaurant manager|restaurant server|hotel manager|hotel receptionist|hospitality|front desk)\b|厨师|餐饮|酒店|服务员|咖啡师|调酒师|客房|餐厅经理/gi,
    /\b(?:operations|administrator|administrative|executive assistant|office manager|office assistant|customer support|customer service|customer success|logistics|warehouse|receptionist|coordinator)\b|运营|行政|助理|客服|物流|仓储|前台|文员/gi,
    /(?!)/g,
    /\b(?:finance|financial|banking|bank|insurance|insurer|underwriter|actuary|wealth management|investment|risk analyst|financial analyst)\b|金融|保险|保險|银行|銀行|投资|投資|理财|理財|精算/g,
    /\b(?:education|educational|teacher|teaching|tutor|school|college|university|lecturer|professor|curriculum|student services)\b|教育|教师|教師|老师|老師|学校|學校|大学|大學|学院|學院|导师|導師|培训|培訓|课程|課程/g,
    /\b(?:manufacturing|factory|industrial production|production operator|production supervisor|assembly|machinist|industrial engineer|plant manager|quality manager)\b|制造|製造|工厂|工廠|工业生产|工業生產|生产|生產|装配|裝配|车间|車間|机械加工|機械加工/g,
    /\b(?:retail|e-commerce|ecommerce|online store|online shop|store manager|shop manager|merchandising|merchandiser|sales associate|checkout|cashier)\b|零售|电商|電商|网店|網店|门店|門店|店铺|店鋪|收银|收銀|商品运营|商品營運/g,
    /\b(?:logistics|transportation|transport|freight|shipping|supply chain|courier|warehouse|fleet|driver|distribution|dispatch)\b|物流|运输|運輸|货运|貨運|快递|快遞|仓储|倉儲|配送|供应链|供應鏈|车队|車隊|驾驶|駕駛/g,
    /\b(?:public sector|government|civil service|municipal|non-profit|nonprofit|ngo|charity|foundation|social services)\b|公共部门|公共部門|政府|公务|公務|非营利|非營利|公益|慈善|社会组织|社會組織/g,
    /\b(?:construction|real estate|property development|architecture|architect|civil engineer|structural engineer|site engineer|quantity surveyor|building|contractor|bim)\b|建筑|建築|房地产|房地產|工程|施工|工地|土木|结构|結構|造价|造價|测绘|測繪|物业|物業|开发商|開發商|总承包|總承包/g
  ];
  var postSignalCache = new WeakMap();
  var postRoleCache = new WeakMap();
  var postAgeCache = new WeakMap();

  function own(o, key) { return !!o && Object.prototype.hasOwnProperty.call(o, key); }
  function str(value) { return value === null || value === undefined ? '' : String(value); }
  function trimmed(value) { return str(value).trim(); }
  function pick(row, names) {
    for (var i = 0; i < names.length; i++) {
      if (own(row, names[i]) && row[names[i]] !== undefined && row[names[i]] !== null && trimmed(row[names[i]]) !== '') return row[names[i]];
    }
    return null;
  }
  function clone(value) {
    if (Array.isArray(value)) return value.map(clone);
    if (value && typeof value === 'object') {
      if (value instanceof Date) return new Date(value.getTime());
      var out = {};
      Object.keys(value).forEach(function (k) { if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype') out[k] = clone(value[k]); });
      return out;
    }
    return value;
  }
  function hash(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  function bool(value) { return value === true || value === 1 || /^(?:true|1|yes|是)$/i.test(trimmed(value)); }
  function explicitlyFalse(value) { return value === false || value === 0 || /^(?:false|0|no|否)$/i.test(trimmed(value)); }
  function status(record) { return trimmed(record && record.reviewStatus).toLowerCase(); }
  function active(record) { return !/^(?:draft|pending|rejected|待审核|草稿|已拒绝)$/.test(status(record)); }
  function approved(entry, record) { return status(entry) === 'approved' || (!status(entry) && status(record) === 'approved'); }
  function unwrap(entry) { return entry && entry.record && typeof entry.record === 'object' ? entry.record : entry; }

  function normalizeUrl(raw) {
    var input = trimmed(raw);
    if (!input) return '';
    if (/^(?:www\.|[a-z]{2}\.)?linkedin\.com\//i.test(input)) input = 'https://' + input;
    var u;
    try { u = new URL(input); } catch (_) { return ''; }
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) return '';
    var host = u.hostname.toLowerCase();
    if (host !== 'linkedin.com' && !/^[a-z0-9-]+\.linkedin\.com$/.test(host)) return '';
    var path;
    try { path = decodeURIComponent(u.pathname); } catch (_) { return ''; }
    var urn = path.match(/^\/feed\/update\/urn:li:(activity|ugcpost|share):([1-9]\d*)\/?$/i);
    if (urn) return 'https://www.linkedin.com/feed/update/urn:li:' + (urn[1].toLowerCase() === 'ugcpost' ? 'ugcPost' : urn[1].toLowerCase()) + ':' + urn[2] + '/';
    var groupPost = path.match(/^\/feed\/update\/urn:li:grouppost:([1-9]\d*-[1-9]\d*)\/?$/i);
    if (groupPost) return 'https://www.linkedin.com/feed/update/urn:li:groupPost:' + groupPost[1] + '/';
    if (/^\/posts\//i.test(path)) {
      var activity = path.match(/(?:^|[-_:])activity[-_:]?([1-9]\d*)(?=[^0-9]|$)/i);
      if (activity) return 'https://www.linkedin.com/feed/update/urn:li:activity:' + activity[1] + '/';
    }
    return '';
  }
  function normalizeJobUrl(raw) {
    var input=trimmed(raw);if(!input)return '';
    if (/^(?:www\.|[a-z]{2}\.)?linkedin\.com\//i.test(input)) input='https://'+input;
    var u;try{u=new URL(input);}catch(_){return '';}
    if(!/^https?:$/.test(u.protocol)||u.username||u.password||!(/^(?:[a-z0-9-]+\.)?linkedin\.com$/i.test(u.hostname)))return '';
    var path;try{path=decodeURIComponent(u.pathname);}catch(_){return '';}
    var m=path.match(/^\/jobs\/view\/(?:[^/]+-)?([1-9]\d*)\/?$/i);
    return m?'https://www.linkedin.com/jobs/view/'+m[1]+'/':'';
  }
  function urnFrom(value) {
    var s = trimmed(value);
    try { s = decodeURIComponent(s); } catch (_) { /* an invalid escape cannot identify a different post */ }
    var m = s.match(/urn:li:(activity|ugcpost|share):([1-9]\d*)/i);
    var groupPost = s.match(/urn:li:grouppost:([1-9]\d*-[1-9]\d*)/i);
    if (groupPost) return 'urn:li:groupPost:' + groupPost[1];
    return m ? 'urn:li:' + (m[1].toLowerCase() === 'ugcpost' ? 'ugcPost' : m[1].toLowerCase()) + ':' + m[2] : '';
  }

  function redactText(raw) {
    return str(raw)
      .replace(/https?:\/\/(?:[a-z0-9-]+\.)?linkedin\.com\/in\/[^\s<>"')]+/gi, '[个人主页已隐去]')
      .replace(/https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[^\s<>"')]+/gi, '[联系方式已隐去]')
      .replace(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+/gi, '[邮箱已隐去]')
      .replace(/(?:\+?86[-.\s]?)?\b1[3-9]\d{9}\b/g, '[电话已隐去]')
      .replace(/\+\d{1,3}(?:[ ().-]*\d){7,14}\b/g, '[电话已隐去]')
      .replace(/\b\d{3}[ .-]\d{3}[ .-]\d{4}\b/g, '[电话已隐去]')
      .replace(/\(\d{2,4}\)[ .-]*\d{3,4}[ .-]\d{3,4}\b/g, '[电话已隐去]')
      .replace(/(^|[\s(（])@[A-Za-z0-9_][A-Za-z0-9_.-]{1,39}/g, '$1[账号已隐去]')
      .replace(/\u0000/g, '')
      .trim();
  }
  function excerpt(text, match) {
    if (!match) return '';
    var start = Math.max(0, match.index - 35);
    var end = Math.min(text.length, match.index + match[0].length + 75);
    return (start ? '…' : '') + redactText(text.slice(start, end).replace(/\s+/g, ' ')) + (end < text.length ? '…' : '');
  }
  function extractSignals(raw) {
    var text = str(raw);
    var money = /(?:[$£€¥￥]\s*\d[\d,.]*(?:\s*[kKmM万千])?(?:\s*[-–—~至到]\s*[$£€¥￥]?\s*\d[\d,.]*(?:\s*[kKmM万千])?)?|\b(?:USD|GBP|EUR|RMB|CNY|HKD|SGD|AUD|CAD|INR)\s*\d[\d,.]*(?:\s*[kKmM])?|\d+(?:[.,]\d+)?\s*(?:[kK]\b|万|千)(?:\s*[-–—~至到]\s*\d+(?:[.,]\d+)?\s*(?:[kK]\b|万|千))?|(?:salary|compensation|pay rate|薪资|薪酬|月薪|年薪|时薪|底薪)[^\n。.!?]{0,30}?\d[\d,]*(?:\s*[-–—~至到]\s*\d[\d,]*)?)/i.exec(text);
    var salaryWord = /\b(?:salary|salaries|compensation|remuneration|pay(?:ment)?|wages?|payrate)\b|薪资|薪酬|薪水|工资|年薪|月薪|时薪|底薪|报酬/i.exec(text);
    var salaryMatch = money || salaryWord;
    var out = {
      salary: { present: !!salaryMatch, evidence: excerpt(text, salaryMatch), label: money ? '薪资：含具体金额或范围' : (salaryWord ? '薪资：仅提及，未见具体金额' : '薪资提及') }
    };
    var patterns = {
      remote: /\b(?:remote|hybrid|wfh|work[ -]from[ -]home|work[ -]from[ -]anywhere)\b|远程|居家办公|混合办公|在家办公/i,
      qualification: /\b(?:requirements?|qualifications?|experience|bachelor|master'?s?|degree|certifications?|certified|skills?|\d+\+?\s*(?:years?|yrs?))\b|任职|资格|经验|学历|学位|技能|证书|要求/i,
      benefits: /\b(?:benefits?|health insurance|medical insurance|dental|vision insurance|paid (?:leave|time off|holiday)|pto|pension|401\s*\(?k\)?|bonus(?:es)?|equity|stock options|parental leave)\b|福利|五险|公积金|年假|带薪|奖金|股权|医疗保险|补贴|员工餐|住宿/i,
      application: /\b(?:apply|application(?:s)?|send\s+(?:us\s+|your\s+|a\s+)?(?:cv|resume|résumé)|submit\s+(?:your\s+)?(?:cv|resume|application)|cv|resume|résumé)\b|投递|简历|申请|应聘|报名|招聘流程/i,
      cta: /\b(?:comment|repost|share|tag|refer|like|reach out|let me know|dm\s+(?:me|us)|apply now|join us|contact (?:me|us)|get in touch|check (?:it|this) out)\b|评论|留言|转发|分享|点赞|推荐|私信|联系我|联系我们|立即申请|欢迎加入|感兴趣.*(?:联系|留言|私信)/i
    };
    Object.keys(patterns).forEach(function (key) {
      var match = patterns[key].exec(text);
      out[key] = { present: !!match, evidence: excerpt(text, match), label: SIGNAL_LABELS[key] };
    });
    return out;
  }
  function matches(pattern, text) { pattern.lastIndex = 0; return (str(text).match(pattern) || []).length; }
  function inferRole(text, keyword) {
    var key = trimmed(keyword);
    if (ROLES.indexOf(key) >= 0) return key;
    var body = str(text);
    var best = -1, score = 0;
    ROLE_PATTERNS.forEach(function (pattern, i) {
      var s = Math.min(matches(pattern, key), 4) * 8 + Math.min(matches(pattern, body.slice(0, 280)), 5) * 3 + Math.min(matches(pattern, body.slice(280)), 4);
      if (s > score) { score = s; best = i; }
    });
    return best >= 0 ? ROLES[best] : ROLES[8];
  }

  var INDUSTRY_CODE_ROLES = {
    IND_CRE_ENG: ROLES[15],
    CRE: ROLES[15],
    CONSTRUCTION: ROLES[15],
    IND_EDU_TRAIN: ROLES[10],
    EDU: ROLES[10],
    EDUCATION: ROLES[10],
    IND_MFG_IND: ROLES[11],
    MFG: ROLES[11],
    MANUFACTURING: ROLES[11],
    IND_HOS: ROLES[6],
    HOS: ROLES[6],
    IND_HEALTH: ROLES[5],
    HLT: ROLES[5],
    HEALTHCARE: ROLES[5],
    IND_OPS_ADMIN: ROLES[7],
    OPS: ROLES[7],
    OPERATIONS_ADMIN: ROLES[7],
    IND_FIN_INS: ROLES[9],
    FIN: ROLES[9],
    FINANCE: ROLES[9],
    INSURANCE: ROLES[9],
    IND_RETAIL_ECOMM: ROLES[12],
    RETAIL: ROLES[12],
    ECOMMERCE: ROLES[12],
    IND_LOG_TRANS: ROLES[13],
    LOGISTICS: ROLES[13],
    TRANSPORT: ROLES[13],
    IND_PUB_NONPROFIT: ROLES[14],
    PUBLIC: ROLES[14],
    NONPROFIT: ROLES[14],
    B5: ROLES[14]
  };
  var INDUSTRY_MARKERS = [
    { role: ROLES[9], pattern: /\b(?:finance|financial|banking|insurance|insurer|underwriter|actuary)\b|金融|保险|保險|银行|銀行|投资|投資|理财|理財/g },
    { role: ROLES[10], pattern: /\b(?:education|educational|teacher|teaching|tutor|school|college|university|lecturer|professor|training)\b|教育|教师|教師|老师|老師|学校|學校|大学|大學|培训|培訓/g },
    { role: ROLES[11], pattern: /\b(?:manufacturing|factory|industrial production|assembly|machinist)\b|制造|製造|工厂|工廠|工业生产|工業生產|装配|裝配|车间|車間/g },
    { role: ROLES[12], pattern: /\b(?:retail|e-commerce|ecommerce|online store|store manager|merchandising|cashier)\b|零售|电商|電商|网店|網店|门店|門店|店铺|店鋪|收银|收銀/g },
    { role: ROLES[13], pattern: /\b(?:logistics|transportation|transport|freight|shipping|supply chain|courier|warehouse|fleet|dispatch)\b|物流|运输|運輸|货运|貨運|快递|快遞|仓储|倉儲|配送|供应链|供應鏈/g },
    { role: ROLES[14], pattern: /\b(?:public sector|government|civil service|municipal|non-profit|nonprofit|ngo|charity|social services)\b|公共部门|公共部門|政府|公务|公務|非营利|非營利|公益|慈善|社会组织|社會組織/g },
    { role: ROLES[15], pattern: /\b(?:construction|real estate|property development|architecture|architect|civil engineer|structural engineer|site engineer|quantity surveyor|contractor|bim)\b|建筑|建築|房地产|房地產|施工|土木|结构工程|結構工程|造价|造價|测绘|測繪|物业|物業|开发商|開發商|总承包|總承包/g }
  ];
  function inferIndustryRole(row, text, keyword) {
    var batch = trimmed(pick(row, ['batch', 'batch_id', 'batchId', 'industry_code', 'industryCode']));
    if (INDUSTRY_CODE_ROLES[batch]) return INDUSTRY_CODE_ROLES[batch];
    var industry = trimmed(pick(row, ['industry', 'industry_name', '行业', '行業', '行业类别', '行業類別']));
    var key = trimmed(keyword);
    var labels = [batch, industry, key].join(' ');
    for (var i = 0; i < INDUSTRY_MARKERS.length; i += 1) {
      var marker = INDUSTRY_MARKERS[i];
      marker.pattern.lastIndex = 0;
      if (marker.pattern.test(labels)) return marker.role;
    }
    var body = str(text).slice(0, 1200);
    var best = '', score = 0;
    for (var j = 0; j < INDUSTRY_MARKERS.length; j += 1) {
      var current = INDUSTRY_MARKERS[j];
      current.pattern.lastIndex = 0;
      var hits = (body.match(current.pattern) || []).length;
      if (hits > score) { score = hits; best = current.role; }
    }
    return score >= 2 ? best : '';
  }

  function parseCSV(raw) {
    var text = str(raw).replace(/^\uFEFF/, '');
    if (!text.trim()) return [];
    var rows = [], row = [], field = '', quoted = false, closed = false;
    function endField() { row.push(field); field = ''; closed = false; }
    function endRow() { endField(); if (row.some(function (v) { return v !== ''; })) rows.push(row); row = []; }
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else { quoted = false; closed = true; }
        } else field += c;
      } else if (c === '"') {
        if (field !== '' || closed) throw new Error('CSV 引号必须位于字段开头（字符 ' + (i + 1) + '）');
        quoted = true;
      } else if (c === ',') endField();
      else if (c === '\r' || c === '\n') { if (c === '\r' && text[i + 1] === '\n') i++; endRow(); }
      else {
        if (closed && !/^[ \t]$/.test(c)) throw new Error('CSV 闭引号后存在多余字符（字符 ' + (i + 1) + '）');
        if (!closed) field += c;
      }
    }
    if (quoted) throw new Error('CSV 含有未闭合的引号');
    if (field !== '' || row.length || closed) endRow();
    if (!rows.length) return [];
    var headers = rows.shift().map(function (v) { return v.trim(); });
    var seen = Object.create(null);
    headers.forEach(function (h) { if (!h) throw new Error('CSV 表头不能为空'); if (seen[h]) throw new Error('CSV 表头重复：' + h); seen[h] = true; });
    return rows.map(function (values, index) {
      if (values.length > headers.length) throw new Error('CSV 第 ' + (index + 2) + ' 行字段多于表头');
      var object = {};
      headers.forEach(function (h, column) { Object.defineProperty(object, h, { value: values[column] === undefined ? '' : values[column], enumerable: true, configurable: true, writable: true }); });
      return object;
    });
  }
  function toCSV(rows, columns) {
    rows = Array.isArray(rows) ? rows : [];
    var cols = (columns && columns.length ? columns : Object.keys(rows[0] || {})).map(function (column) {
      return typeof column === 'string' ? { key: column, label: column } : { key: column.key || column.field, label: column.label || column.title || column.key || column.field };
    });
    function cell(value) {
      var s = value === null || value === undefined ? '' : (typeof value === 'object' ? JSON.stringify(value) : str(value));
      if (typeof value !== 'number' && (/^[\u0000-\u0020]*[=+\-@]/.test(s) || /^[\t\r\n]/.test(s))) s = "'" + s;
      return /[",\r\n]/.test(s) || /^\s|\s$/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    var lines = [cols.map(function (c) { return cell(c.label); }).join(',')];
    rows.forEach(function (row) { lines.push(cols.map(function (c) { return cell(row && row[c.key]); }).join(',')); });
    return '\uFEFF' + lines.join('\r\n');
  }

  function parseDate(value) {
    if (value === null || value === undefined || trimmed(value) === '') return null;
    if (value instanceof Date) return isFinite(value.getTime()) ? new Date(value.getTime()) : null;
    if (typeof value === 'number') return isFinite(value) && value >= 0 && isFinite(new Date(value).getTime()) ? new Date(value) : null;
    var text = trimmed(value);
    var m = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:(?:T| )\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/);
    if (!m) return null;
    var year = +m[1], month = +m[2], day = +m[3];
    if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()) return null;
    var standardized = text.replace(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/, function (_, y, mo, d) { return y + '-' + mo.padStart(2, '0') + '-' + d.padStart(2, '0'); });
    if (/^\d{4}-\d{2}-\d{2}$/.test(standardized)) standardized += 'T00:00:00.000Z';
    else if (!/(?:Z|[+-]\d{2}:?\d{2})$/.test(standardized)) standardized = standardized.replace(' ', 'T') + 'Z';
    var parsed = new Date(standardized);
    return isFinite(parsed.getTime()) ? parsed : null;
  }
  function nowDate(options) { return parseDate(options && options.now) || new Date(); }
  function integerMetric(value, name, errors) {
    if (value === null || value === undefined || /^(?:|na|n\/a|null|undefined|unknown|missing|—|–|-)$/i.test(trimmed(value))) return null;
    var input = value;
    if (typeof input === 'string' && /^\d{1,3}(?:,\d{3})+$/.test(input.trim())) input = input.replace(/,/g, '');
    var n = typeof input === 'number' ? input : (typeof input === 'string' && /^\d+$/.test(input.trim()) ? Number(input.trim()) : NaN);
    if (!Number.isSafeInteger(n) || n < 0) { errors.push(name + '必须是非负整数或留空；缺失值不会改为 0'); return null; }
    return n;
  }
  function parsedAge(value) {
    if (value === null || value === undefined || trimmed(value) === '') return null;
    if (typeof value === 'number' || /^\d+(?:\.\d+)?$/.test(trimmed(value))) { var n = Number(value); return isFinite(n) && n >= 0 ? Math.floor(n) : null; }
    var m = trimmed(value).match(/^(\d+)\s*(d(?:ays?)?|天|日|w(?:eeks?)?|周|星期|mo(?:nths?)?|个月|月|y(?:ears?)?|年)(?:\s*ago|前)?$/i);
    if (!m) return null;
    var unit = m[2].toLowerCase();
    return +m[1] * (/^(?:w|周|星期)/.test(unit) ? 7 : /^(?:mo|个月|月)/.test(unit) ? 30 : /^(?:y|年)/.test(unit) ? 365 : 1);
  }
  function roleFor(row, text, keyword, errors, warnings) {
    var industryRole = inferIndustryRole(row, text, keyword);
    if (industryRole) return industryRole;
    var provided = trimmed(pick(row, ['jobFamily', 'job_family', 'role', 'job_category', '岗位类别', '岗位', '職位類別', '崗位類別', '職位']));
    var alias=ROLE_ALIASES.findIndex(function(list){return list.toLowerCase().split('|').indexOf(provided.toLowerCase())>=0;});
    if(alias>=0)provided=ROLES[alias];
    var role = ROLES.indexOf(provided) >= 0 ? provided : inferRole(text, provided || keyword);
    if (!provided && role === ROLES[8]) errors.push('缺少可识别的岗位类别，请明确选择或填写岗位类别');
    if (provided && ROLES.indexOf(provided) < 0) warnings.push('岗位“' + provided + '”已归入“' + role + '”');
    return role;
  }
  function newEligibility(post) {
    return !bool(post.isDuplicate) && str(post.text).trim().length >= 80 && typeof post.likes === 'number' && post.likes >= 0 && typeof post.commentsCount === 'number' && post.commentsCount >= 0;
  }
  function normalizePost(row, options) {
    row = row && typeof row === 'object' ? row : {};
    options = options || {};
    var errors = [], warnings = [], now = nowDate(options);
    var url = normalizeUrl(pick(row, ['url', 'post_url', 'postUrl', 'permalink', 'link', '链接', '帖子链接', '連結', '貼文連結']));
    if (!url) warnings.push('缺少可用 LinkedIn 帖子链接；记录可保留，但无法从页面直接回查原帖');
    var rawJobUrl=trimmed(pick(row,['relatedJobUrl','related_job_url','job_url','职位链接','職位連結','相关职位链接','相關職位連結']));
    var relatedJobUrl=normalizeJobUrl(rawJobUrl);
    if(rawJobUrl&&!relatedJobUrl)errors.push('相关职位链接须为有效的 LinkedIn /jobs/view/ 职位详情链接');
    var text = redactText(pick(row, ['text', 'post_text', 'body', 'content', '正文', '帖子正文', '貼文正文']));
    if (text.length < 40) errors.push('帖子正文至少需要 40 个字符');
    var keyword = trimmed(pick(row, ['keyword', 'search_keyword', 'searchKeyword']));
    var role = roleFor(row, text, keyword, errors, warnings);
    var rawPublished = pick(row, ['publishedAt', 'published_at', 'published_date', 'publish_date', 'publication_date', 'post_date', 'postedAt', 'datePublished', '发布日期', '发布时间', '發布日期', '發布時間']);
    var rawCollected = pick(row, ['collectedAt', 'collected_at', 'observedAt', 'observed_at', 'collection_date', 'collected_date', 'observed_date', 'snapshot_at', '采集日期', '观察日期', '采集时间', '观察时间', '擷取日期', '擷取時間', '觀察日期', '觀察時間']);
    var published = parseDate(rawPublished), collected = parseDate(rawCollected);
    if (!published) errors.push('需要真实、有效的发布日期（YYYY-MM-DD 或 ISO 时间）；相对 time_label 不能替代发布日期');
    if (!collected) errors.push('需要真实、有效的观察/采集日期（YYYY-MM-DD 或 ISO 时间）');
    if (published && published > now) errors.push('发布日期不能晚于当前时间');
    if (collected && collected > now) errors.push('观察/采集日期不能晚于当前时间');
    if (published && collected && collected < published) errors.push('观察/采集日期不能早于发布日期');
    var rawAge = pick(row, ['ageDays', 'age_days', 'days', 'time_label']);
    var age = parsedAge(rawAge);
    if (published && collected && collected >= published) {
      var calculated = Math.floor((collected.getTime() - published.getTime()) / DAY);
      if (age !== null && age !== calculated) warnings.push('发布至采集时长已按日期重算为 ' + calculated + ' 天');
      age = calculated;
    } else if (rawAge !== null && age === null) warnings.push('未能识别发布至采集时长字段，保留为缺失');
    var likes = integerMetric(pick(row, ['likes', 'likes_count', 'like_count', 'reactions', 'reactions_count', '点赞数', '点赞', '按讚數', '按讚']), '点赞数', errors);
    var commentsCount = integerMetric(pick(row, ['commentsCount', 'comments_count', 'comment_count', 'commentCount', '评论数', '評論數']), '评论数', errors);
    var reposts = integerMetric(pick(row, ['reposts', 'shares_count', 'reposts_count', 'share_count', 'shares', '转发数', '转发', '轉發數', '轉發']), '转发数', errors);
    if (likes === null || commentsCount === null || reposts === null) warnings.push('缺失互动保留为空；点赞或评论数缺失的帖子不进入岗位互动比较');
    if (text.length >= 40 && text.length < 80) warnings.push('正文少于 80 字符，可保存，但不进入岗位互动比较');
    var source = trimmed(pick(row, ['sourceId', 'source_id'])) || urnFrom(url) || trimmed(pick(row, ['post_id']));
    var id = trimmed(options.id) || trimmed(pick(row, ['id', 'post_id', '帖子ID', '帖子编号', '貼文ID', '貼文編號'])) || 'post_' + hash(url || text);
    var record = {
      id: id, sourceId: source, url: url, relatedJobUrl: relatedJobUrl, text: text, jobFamily: role,
      publishedAt: published ? published.toISOString() : null, collectedAt: collected ? collected.toISOString() : null,
      ageDays: age, likes: likes, commentsCount: commentsCount, reposts: reposts,
      batch: trimmed(pick(row, ['batch', 'batch_id', 'batchId'])) || 'manual', keyword: keyword,
      isDuplicate: bool(pick(row, ['isDuplicate', 'is_duplicate'])), analysisEligible: false,
      provenance: trimmed(pick(row, ['provenance', 'source_note', 'source'])) || '用户导入，待审核', reviewStatus: 'draft'
    };
    record.analysisEligible = !errors.length && !explicitlyFalse(pick(row, ['analysisEligible', 'analysis_eligible'])) && newEligibility(record);
    return { record: record, errors: errors, warnings: warnings };
  }

  function postList(posts) { return Array.isArray(posts) ? posts : (posts && Array.isArray(posts.posts) ? posts.posts : []); }
  function findPost(posts, id, url) {
    var canonical = normalizeUrl(url), byId = null, byUrl = null;
    posts.forEach(function (p) {
      if (!byId && id && (str(p.id) === id || str(p.sourceId) === id)) byId = p;
      if (!byUrl && canonical && normalizeUrl(p.url) === canonical) byUrl = p;
    });
    return { byId: byId, byUrl: byUrl, post: byId || byUrl };
  }
  function normalizeComment(row, options) {
    row = row && typeof row === 'object' ? row : {};
    options = options || {};
    var errors = [], warnings = [], posts = postList(options.posts);
    var suppliedId = trimmed(pick(row, ['postId', 'post_id', 'linked_post_id', 'parent_post_id', '所属帖子ID', '关联帖子编号', '所屬貼文ID', '關聯貼文編號']));
    var suppliedUrl = pick(row, ['post_url', 'postUrl', 'post_link', '帖子链接', '貼文連結']);
    if(normalizeUrl(suppliedId)){suppliedUrl=suppliedUrl||suppliedId;suppliedId='';}
    var resolved = findPost(posts, suppliedId, suppliedUrl);
    if (!resolved.post) errors.push('评论必须关联已存在的帖子 ID，或提供可匹配的 post_url');
    if (resolved.byId && resolved.byUrl && str(resolved.byId.id) !== str(resolved.byUrl.id)) errors.push('postId 与 post_url 指向不同帖子，请核对关联');
    if (suppliedId && !resolved.byId && resolved.byUrl) warnings.push('原帖子 ID 未匹配，已按 post_url 关联');
    var text = redactText(pick(row, ['text', 'comment_text', 'comment_body', 'body', 'content', '评论正文', '正文', '評論正文']));
    if (!text) errors.push('评论正文不能为空；comment_raw 不会被用作正文');
    if (own(row, 'comment_raw') || own(row, 'author') || own(row, 'author_name') || own(row, 'profile_url')) warnings.push('comment_raw、作者和个人主页字段已忽略，仅导入脱敏正文');
    if (resolved.post && bool(resolved.post.isDuplicate)) warnings.push('关联帖子为重复帖，该评论不进入评论主题分析');
    var rawCollected = pick(row, ['collectedAt', 'collected_at', 'observedAt', 'observed_at', 'collection_date', 'collected_date', '采集日期', '采集时间', '擷取日期', '擷取時間']);
    var collected = parseDate(rawCollected);
    if (rawCollected !== null && !collected) errors.push('评论采集日期格式无效');
    if (!collected) warnings.push('评论采集日期缺失，保留为空');
    if (collected && collected > nowDate(options)) errors.push('评论采集日期不能晚于当前时间');
    var published = resolved.post && parseDate(resolved.post.publishedAt);
    if (collected && published && collected < published) errors.push('评论采集日期不能早于帖子发布日期');
    var postId = resolved.post ? str(resolved.post.id) : suppliedId;
    var source = trimmed(pick(row, ['sourceId', 'source_id', 'comment_id', '评论ID', '評論ID']));
    var record = {
      id: trimmed(options.id) || trimmed(pick(row, ['id', 'comment_id', '评论ID', '評論ID'])) || 'comment_' + hash(postId + '\n' + text),
      sourceId: source, postId: postId, text: text,
      batch: trimmed(pick(row, ['batch', 'batch_id', 'batchId'])) || 'manual', collectedAt: collected ? collected.toISOString() : null,
      provenance: trimmed(pick(row, ['provenance', 'source_note', 'source'])) || '用户导入，待审核', reviewStatus: 'draft'
    };
    return { record: record, errors: errors, warnings: warnings };
  }

  function bodyKey(text) { return str(text).normalize('NFKC').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim(); }
  function identities(post) {
    var out = [], url = normalizeUrl(post && post.url), source = trimmed(post && post.sourceId), urn = urnFrom(source) || urnFrom(url);
    if (url) out.push('url:' + url);
    if (urn) out.push('urn:' + urn);
    if (source && !urnFrom(source)) out.push('source:' + source);
    return out;
  }
  function changesBetween(previous, incoming) {
    var changes = {};
    POST_FIELDS.forEach(function (field) {
      if (own(incoming, field) && JSON.stringify(previous[field] === undefined ? null : previous[field]) !== JSON.stringify(incoming[field] === undefined ? null : incoming[field])) changes[field] = { before: clone(previous[field] === undefined ? null : previous[field]), after: clone(incoming[field] === undefined ? null : incoming[field]) };
    });
    return changes;
  }
  function snapshotOrder(incoming, previous) {
    var a = parseDate(incoming && incoming.collectedAt), b = parseDate(previous && previous.collectedAt);
    return { incoming: a, previous: b, older: !!(a && b && a < b), sameTime: !!(a && b && a.getTime() === b.getTime()), missing: !a || !b };
  }
  function deduplicatePosts(incoming, existing) {
    var unique = [], duplicates = [], updates = [], errors = [];
    var identityMap = new Map(), textMap = new Map(), idMap = new Map();
    function index(post) {
      identities(post).forEach(function (key) { if (!identityMap.has(key)) identityMap.set(key, post); });
      var key = bodyKey(post.text);
      if (key && !textMap.has(key)) textMap.set(key, post);
      if (post.id && !idMap.has(str(post.id))) idMap.set(str(post.id), post);
    }
    postList(existing).slice().sort(function (a, b) { return Number(bool(a.isDuplicate)) - Number(bool(b.isDuplicate)); }).forEach(index);
    (Array.isArray(incoming) ? incoming : []).forEach(function (entry) {
      var record = clone(unwrap(entry) || {}), match = null;
      identities(record).some(function (key) { if (identityMap.has(key)) { match = identityMap.get(key); return true; } return false; });
      if (match) {
        var order = snapshotOrder(record, match);
        if (order.older) { errors.push({ record: record, existingId: str(match.id), errors: ['观察日期早于当前快照，拒绝用旧快照覆盖较新的互动数'] }); return; }
        var changes = changesBetween(match, record);
        if (order.sameTime && Object.keys(changes).length) { errors.push({ record: record, existingId: str(match.id), errors: ['同一观察时点存在不同快照，已标记为冲突；请核对来源与采集时间'] }); return; }
        if (!Object.keys(changes).length) { duplicates.push({ record: record, existingId: str(match.id), reason: 'same_snapshot', label: '相同帖子与相同快照' }); return; }
        record.id = str(match.id);
        record.reviewStatus = 'draft';
        updates.push({ postId: str(match.id), record: record, previous: clone(match), changes: changes, reviewStatus: 'draft', warnings: order.missing ? ['新旧快照至少一方缺观察日期，无法完整判定先后；请核对来源'] : [] });
        return;
      }
      var textMatch = textMap.get(bodyKey(record.text));
      if (textMatch && bodyKey(record.text)) {
        record.isDuplicate = true; record.analysisEligible = false;
        duplicates.push({ record: record, existingId: str(textMatch.id), reason: 'normalized_text', label: '规范化正文重复' }); return;
      }
      if (record.id && idMap.has(str(record.id))) { errors.push({ record: record, existingId: str(record.id), errors: ['帖子 ID 已被不同帖子使用，请分配新 ID'] }); return; }
      unique.push(record); index(record);
    });
    return { unique: unique, duplicates: duplicates, updates: updates, errors: errors };
  }

  function buildDataset(baseline, additions) {
    baseline = baseline || {}; additions = additions || {};
    var dataset = clone(baseline);
    dataset.posts = clone(Array.isArray(baseline.posts) ? baseline.posts : []);
    dataset.comments = clone(Array.isArray(baseline.comments) ? baseline.comments : []);
    dataset.meta = clone(baseline.meta || {});
    var addedPosts = 0, addedComments = 0, appliedUpdates = 0, skipped = [];
    var approvedPosts = [];
    (Array.isArray(additions.posts) ? additions.posts : []).forEach(function (entry) {
      var raw = unwrap(entry);
      if (!raw || !approved(entry, raw) || (entry.errors && entry.errors.length) || bool(raw.isDuplicate)) return;
      approvedPosts.push(raw);
    });
    var incomingPosts = deduplicatePosts(approvedPosts, dataset.posts);
    incomingPosts.unique.forEach(function (raw) {
      var record = clone(raw); record.reviewStatus = 'approved'; record.analysisEligible = newEligibility(record);
      dataset.posts.push(record); addedPosts++;
    });
    incomingPosts.duplicates.forEach(function (item) {
      skipped.push({ type: 'post', id: str(item.record && item.record.id), reason: '已存在或正文重复；同帖新快照需在 updates 中单独审批' });
    });
    incomingPosts.updates.forEach(function (item) {
      skipped.push({ type: 'post', id: str(item.record && item.record.id), reason: '检测到同帖新快照；须在 updates 中单独审批' });
    });
    incomingPosts.errors.forEach(function (item) {
      skipped.push({ type: 'post', id: str(item.record && item.record.id), reason: (item.errors || ['帖子校验失败']).join('；') });
    });
    (Array.isArray(additions.updates) ? additions.updates : []).forEach(function (entry) {
      var raw = unwrap(entry);
      if (!raw || !approved(entry, raw) || (entry.errors && entry.errors.length)) return;
      var id = trimmed(entry.postId || entry.existingId || raw.postId || raw.id);
      var at = dataset.posts.findIndex(function (p) { return str(p.id) === id; });
      if (at < 0) { skipped.push({ type: 'update', id: id, reason: '目标帖子不存在' }); return; }
      var current = dataset.posts[at], order = snapshotOrder(raw, current);
      if (order.older || (!order.incoming && order.previous)) { skipped.push({ type: 'update', id: id, reason: order.older ? '旧快照不能覆盖较新的快照' : '更新缺少观察日期，无法覆盖已有日期的快照' }); return; }
      if (order.sameTime) { skipped.push({ type: 'update', id: id, reason: Object.keys(changesBetween(current, raw)).length ? '同一观察时点存在不同快照，保留为冲突' : '相同观察时点与快照，无需重复应用' }); return; }
      var incomingUrl = own(raw, 'url') ? normalizeUrl(raw.url) : '';
      var currentUrl = normalizeUrl(current.url);
      if (incomingUrl && currentUrl && incomingUrl !== currentUrl) { skipped.push({ type: 'update', id: id, reason: '更新链接与目标帖子不同' }); return; }
      var merged = clone(current);
      POST_FIELDS.forEach(function (key) { if (own(raw, key)) merged[key] = clone(raw[key]); });
      merged.id = current.id; merged.reviewStatus = 'approved';
      var pub = parseDate(merged.publishedAt), col = parseDate(merged.collectedAt);
      if (pub && col && col < pub) { skipped.push({ type: 'update', id: id, reason: '观察日期早于发布日期' }); return; }
      if (pub && col) merged.ageDays = Math.floor((col - pub) / DAY);
      merged.analysisEligible = newEligibility(merged);
      dataset.posts[at] = merged; appliedUpdates++;
    });
    var commentIds = new Set(dataset.comments.map(function (c) { return str(c.id); }));
    var commentSources = new Set(dataset.comments.filter(function (c) { return trimmed(c.sourceId); }).map(function (c) { return str(c.sourceId); }));
    var postIds = new Set(dataset.posts.map(function (p) { return str(p.id); }));
    (Array.isArray(additions.comments) ? additions.comments : []).forEach(function (entry) {
      var raw = unwrap(entry);
      if (!raw || !approved(entry, raw) || (entry.errors && entry.errors.length) || !trimmed(raw.text) || !postIds.has(str(raw.postId))) return;
      if (commentIds.has(str(raw.id)) || (trimmed(raw.sourceId) && commentSources.has(str(raw.sourceId)))) return;
      var record = clone(raw); record.reviewStatus = 'approved'; dataset.comments.push(record); commentIds.add(str(record.id)); if (trimmed(record.sourceId)) commentSources.add(str(record.sourceId)); addedComments++;
    });
    dataset.meta.working = true;
    dataset.meta.baselineVersion = baseline.version || null;
    dataset.meta.approvedAdditions = { posts: addedPosts, comments: addedComments, updates: appliedUpdates };
    dataset.meta.skippedAdditions = skipped;
    return dataset;
  }

  function ageOf(post) {
    if (post && typeof post === 'object' && postAgeCache.has(post)) return postAgeCache.get(post);
    var age = parsedAge(own(post, 'ageDays') ? post.ageDays : post.days);
    if (age === null) {
      var published = parseDate(post.publishedAt), collected = parseDate(post.collectedAt);
      age = published && collected && collected >= published ? Math.floor((collected - published) / DAY) : null;
    }
    if (post && typeof post === 'object') postAgeCache.set(post, age);
    return age;
  }
  function ageBucket(postOrAge) {
    var age = typeof postOrAge === 'object' && postOrAge ? ageOf(postOrAge) : parsedAge(postOrAge);
    return age === null ? 'unknown' : age <= 7 ? '0-7' : age <= 30 ? '8-30' : age <= 90 ? '31-90' : age <= 180 ? '91-180' : '180+';
  }
  function metricValue(post, key) { var value = post && post[key]; return typeof value === 'number' && isFinite(value) && value >= 0 ? value : null; }
  function median(values) {
    var known = values.filter(function (v) { return typeof v === 'number' && isFinite(v); }).sort(function (a, b) { return a - b; });
    if (!known.length) return null;
    var half = Math.floor(known.length / 2);
    return known.length % 2 ? known[half] : (known[half - 1] + known[half]) / 2;
  }
  function eligible(post) { return !bool(post.isDuplicate) && active(post) && (post.analysisEligible === true || (!explicitlyFalse(post.analysisEligible) && newEligibility(post))); }
  function themeKeys(text) {
    var patterns = {
      pay_benefits: /\b(?:salary|salaries|pay|compensation|wage|benefits?|bonus|insurance|equity)\b|薪资|薪酬|薪水|工资|福利|奖金|五险|公积金|年假|待遇/i,
      location_remote: /\b(?:remote|hybrid|wfh|location|relocat\w*|where|on[ -]?site|work from|city|country)\b|远程|地点|地址|位置|城市|哪里|哪儿|居家|搬迁|办公|异地/i,
      qualification_experience: /\b(?:experience|qualifications?|requirements?|skills?|degree|bachelor|master|certificat\w*|years?|yrs?|eligible)\b|经验|资格|学历|学位|证书|技能|要求|应届|毕业|专业/i,
      application_process: /\b(?:apply|application|resume|résumé|cv|interview|deadline|link|submit|process)\b|申请|投递|简历|面试|流程|截止|链接|怎么报名|如何报名/i,
      application_interest: /\b(?:interested|keen|available|count me in|want to apply|would like to apply|looking for (?:a |an )?(?:job|role|opportunity)|please consider)\b|感兴趣|有兴趣|有意|想申请|想加入|求职|求机会|求内推|已申请|已投递|愿意加入|我想应聘/i
    };
    var keys = Object.keys(patterns).filter(function (key) { return patterns[key].test(str(text)); });
    return keys.length ? keys : ['other'];
  }
  function computeAnalytics(dataset, filters) {
    dataset = dataset || {}; filters = filters || {};
    var roleFilter = filters.role || 'all', batchFilter = filters.batch || 'all', ageFilter = filters.age || 'all';
    var metric = ({ comments: 'commentsCount', commentsCount: 'commentsCount', reposts: 'reposts', shares: 'reposts', likes: 'likes' })[filters.metric] || 'likes';
    var rawPosts = (Array.isArray(dataset.posts) ? dataset.posts : []).filter(active);
    var uniquePosts = rawPosts.filter(function (p) { return !bool(p.isDuplicate); });
    function roleOf(post) {
      if (post && typeof post === 'object' && postRoleCache.has(post)) return postRoleCache.get(post);
      var role = ROLES.indexOf(post.jobFamily) >= 0 ? post.jobFamily : inferRole(post.text, post.keyword);
      if (post && typeof post === 'object') postRoleCache.set(post, role);
      return role;
    }
    function scope(post) { return (roleFilter === 'all' || roleOf(post) === roleFilter) && (batchFilter === 'all' || str(post.batch) === str(batchFilter)); }
    var eligibleBeforeAge = uniquePosts.filter(function (p) { return eligible(p) && scope(p); });
    var missingAge = eligibleBeforeAge.filter(function (p) { return ageOf(p) === null; }).length;
    var allPosts = uniquePosts.filter(function (p) { return scope(p) && (ageFilter === 'all' || ageBucket(p) === ageFilter); });
    var posts = allPosts.filter(eligible);
    var rawComments = (Array.isArray(dataset.comments) ? dataset.comments : []).filter(active);
    var nonempty = rawComments.filter(function (c) { return trimmed(c.text); });
    var rawIdSet = new Set(rawPosts.map(function (p) { return str(p.id); }));
    var uniqueIdSet = new Set(uniquePosts.map(function (p) { return str(p.id); }));
    var selectedIdSet = new Set(allPosts.map(function (p) { return str(p.id); }));
    var comments = nonempty.filter(function (c) { return selectedIdSet.has(str(c.postId)); });
    var orphanCount = nonempty.filter(function (c) { return !rawIdSet.has(str(c.postId)); }).length;
    var duplicateLinked = nonempty.filter(function (c) { return rawIdSet.has(str(c.postId)) && !uniqueIdSet.has(str(c.postId)); }).length;
    var signalCache = new Map();
    posts.forEach(function (p) {
      var signals = postSignalCache.get(p);
      if (!signals) {
        signals = extractSignals(p.text);
        postSignalCache.set(p, signals);
      }
      signalCache.set(p, signals);
    });
    var roles = ROLES.map(function (role) {
      var group = posts.filter(function (p) { return roleOf(p) === role; });
      return { role: role, n: group.length, likesMedian: median(group.map(function (p) { return metricValue(p, 'likes'); })), commentsMedian: median(group.map(function (p) { return metricValue(p, 'commentsCount'); })), repostsMedian: median(group.map(function (p) { return metricValue(p, 'reposts'); })), salaryRate: group.length ? group.filter(function (p) { return signalCache.get(p).salary.present; }).length / group.length : null, remoteRate: group.length ? group.filter(function (p) { return signalCache.get(p).remote.present; }).length / group.length : null };
    });
    var signals = Object.keys(SIGNAL_LABELS).map(function (key) {
      var withPosts = posts.filter(function (p) { return signalCache.get(p)[key].present; });
      var withoutPosts = posts.filter(function (p) { return !signalCache.get(p)[key].present; });
      var withValues = withPosts.map(function (p) { return metricValue(p, metric); });
      var withoutValues = withoutPosts.map(function (p) { return metricValue(p, metric); });
      return { key: key, label: SIGNAL_LABELS[key], withN: withPosts.length, withoutN: withoutPosts.length, withMedian: median(withValues), withoutMedian: median(withoutValues), rate: posts.length ? withPosts.length / posts.length : null, withMetricN: withValues.filter(function (v) { return v !== null; }).length, withoutMetricN: withoutValues.filter(function (v) { return v !== null; }).length };
    });
    var themeCounts = {};
    Object.keys(THEME_LABELS).forEach(function (key) { themeCounts[key] = 0; });
    comments.forEach(function (comment) { themeKeys(comment.text).forEach(function (key) { themeCounts[key]++; }); });
    var themes = Object.keys(THEME_LABELS).map(function (key) { return { key: key, label: THEME_LABELS[key], n: themeCounts[key], rate: comments.length ? themeCounts[key] / comments.length : null }; });
    return {
      counts: { rawPosts: rawPosts.length, uniquePosts: uniquePosts.length, analysisPosts: posts.length, commentRows: rawComments.length, nonemptyComments: nonempty.length, linkedComments: comments.length, orphanComments: orphanCount, selectedUniquePosts: allPosts.length, excludedDuplicateComments: duplicateLinked },
      posts: posts, allPosts: allPosts, comments: comments, roles: roles, signals: signals, themes: themes,
      medianLikes: median(posts.map(function (p) { return metricValue(p, 'likes'); })), medianComments: median(posts.map(function (p) { return metricValue(p, 'commentsCount'); })),
      missingAge: missingAge, ageKnown: eligibleBeforeAge.length - missingAge,
      method: { commentUnit: '非空评论行，不等于人数', themes: '透明关键词、多标签；比率分母为筛选后已关联的非空评论行；标签合计可超过 100%', signals: '透明关键词提及，不等于人工编码，也不支持因果结论', age: '采集时年龄；缺失年龄不进入任何已知年龄组', metric: metric }
    };
  }

  function importKey(record) { return [record.id, record.url, record.postId, record.collectedAt, record.text].map(str).join('\u001f'); }
  function auditImport(type, rows, currentDataset) {
    rows = Array.isArray(rows) ? rows : [];
    currentDataset = currentDataset || {};
    var result = { records: [], errors: [], warnings: [], duplicates: [], updates: [] };
    var valid = [], rowMap = new Map();
    var isComment = /^(?:comment|comments)$/i.test(str(type));
    if (!isComment && !/^(?:post|posts)$/i.test(str(type))) { result.errors.push({ row: 0, errors: ['导入类型必须是 posts 或 comments'] }); return result; }
    rows.forEach(function (row, index) {
      var options = { posts: currentDataset.posts || [] };
      if (isComment && !trimmed(pick(row, ['id', 'comment_id', '评论ID']))) options.id = 'comment_import_' + hash(JSON.stringify(row)) + '_' + (index + 1);
      var normalized = isComment ? normalizeComment(row, options) : normalizePost(row, options);
      var number = index + 2;
      rowMap.set(importKey(normalized.record), number);
      if (normalized.errors.length) result.errors.push({ row: number, errors: normalized.errors });
      else valid.push(normalized.record);
      if (normalized.warnings.length) result.warnings.push({ row: number, warnings: normalized.warnings });
    });
    function rowNumber(record) { return rowMap.get(importKey(record)) || rows.findIndex(function (row) { return normalizeUrl(pick(row, ['url', 'post_url', 'postUrl'])) === normalizeUrl(record.url); }) + 2; }
    if (!isComment) {
      var deduped = deduplicatePosts(valid, currentDataset.posts || []);
      result.records = deduped.unique;
      result.duplicates = deduped.duplicates.map(function (item) { item.row = rowNumber(item.record); return item; });
      result.updates = deduped.updates.map(function (item) {
        item.row = rowNumber(item.record);
        if (item.warnings.length) result.warnings.push({ row: item.row, warnings: item.warnings.slice() });
        return item;
      });
      deduped.errors.forEach(function (item) { result.errors.push({ row: rowNumber(item.record), errors: item.errors }); });
    } else {
      var known = (currentDataset.comments || []).slice();
      valid.forEach(function (record) {
        var match = known.find(function (c) { return str(c.id) === record.id || (trimmed(record.sourceId) && str(c.sourceId) === record.sourceId); });
        if (match) result.duplicates.push({ record: record, existingId: str(match.id), reason: 'comment_identity', label: '相同评论来源或 ID', row: rowNumber(record) });
        else { result.records.push(record); known.push(record); }
      });
    }
    return result;
  }

  return { VERSION: '1.1.0', ROLES: ROLES.slice(), SIGNAL_LABELS: clone(SIGNAL_LABELS), THEME_LABELS: clone(THEME_LABELS), normalizeUrl: normalizeUrl, normalizeJobUrl: normalizeJobUrl, extractSignals: extractSignals, inferRole: inferRole, inferIndustryRole: inferIndustryRole, redactText: redactText, parseCSV: parseCSV, toCSV: toCSV, normalizePost: normalizePost, normalizeComment: normalizeComment, deduplicatePosts: deduplicatePosts, buildDataset: buildDataset, computeAnalytics: computeAnalytics, auditImport: auditImport, ageBucket: ageBucket, themeKeys: themeKeys, median: median };
});
