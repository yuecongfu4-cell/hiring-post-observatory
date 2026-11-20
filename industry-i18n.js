(function (root) {
  'use strict';
  const rows = root.WORKBENCH_TRANSLATIONS;
  if (!Array.isArray(rows)) return;
  rows.push(
    ['金融保险', '金融保險', 'Finance and insurance'],
    ['教育培训', '教育培訓', 'Education and training'],
    ['制造业与工业生产', '製造業與工業生產', 'Manufacturing and industrial production'],
    ['零售与电商', '零售與電商', 'Retail and e-commerce'],
    ['物流与运输', '物流與運輸', 'Logistics and transportation'],
    ['公共部门与非营利', '公共部門與非營利', 'Public sector and non-profit'],
    ['建筑房地产与工程', '建築房地產與工程', 'Architecture, real estate and construction']
  );
})(typeof globalThis !== 'undefined' ? globalThis : this);
