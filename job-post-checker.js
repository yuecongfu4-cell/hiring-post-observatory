(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.JobPostChecker = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const RULES = {
    titleMin: 21,
    titleMax: 60,
    longBody: 1400,
    minBody: 80,
  };

  const PATTERNS = {
    salaryAmount:
      /(?:[$£€¥￥]\s*\d[\d,.]*(?:\s*[kKmM万千])?(?:\s*[-–—~至到]\s*[$£€¥￥]?\s*\d[\d,.]*(?:\s*[kKmM万千])?)?|\b(?:USD|GBP|EUR|RMB|CNY|HKD|SGD|AUD|CAD|INR)\s*\d[\d,.]*(?:\s*[kKmM])?(?:\s*[-–—~至到]\s*\d[\d,.]*)?|(?:薪资|薪酬|薪水|工资|年薪|月薪|时薪|底薪)[^\n。.!?]{0,18}\d[\d,.]*(?:\s*[-–—~至到]\s*\d[\d,.]*)?)/i,
    remote:
      /\b(?:remote|hybrid|wfh|work[ -]from[ -]home|work[ -]from[ -]anywhere)\b|远程|遠程|居家办公|居家辦公|混合办公|混合辦公|在家办公|在家辦公/i,
    visa:
      /\b(?:sponsor(?:ship|ed|ing)?|visa|work\s+permit|work\s+authori[sz]ation|relocation\s+support)\b|签证|簽證|工签|工簽|工作许可|工作許可|担保|擔保|技术移民|技術移民/i,
    qualification:
      /\b(?:experience|years?|degree|bachelor|master|phd|certification|license|proficien(?:t|cy)|skills?|qualification|required)\b|经验|經驗|学历|學歷|本科|硕士|碩士|博士|资格|資格|证书|證書|技能|要求/i,
    benefits:
      /\b(?:benefits?|bonus|equity|insurance|pension|allowance|paid leave|parental leave|wellbeing|holiday|vacation)\b|福利|奖金|獎金|股权|股權|保险|保險|公积金|公積金|年假|带薪|帶薪|补贴|補貼|假期/i,
    cta:
      /\b(?:apply|dm|message|comment|repost|share|tag|refer|contact|send\s+(?:your\s+)?(?:cv|resume)|check\s+the\s+link)\b|申请|申請|私信|联系|聯繫|评论|評論|留言|转发|轉發|分享|内推|內推|投递|投遞/i,
    jargon:
      /\b(?:synerg(?:y|ies|istic)|stakeholder|leverage|scalable|holistic|ecosystem|cross-functional|best-in-class|transformative|growth mindset|dynamic environment|thought leadership|mission-critical|future-ready|data-driven|paradigm)\b|赋能|賦能|闭环|閉環|抓手|对齐|對齊|协同|協同|生态|生態|颠覆|顛覆|全链路|全鏈路|底层逻辑|底層邏輯|提质增效|提質增效|数智化|數智化|敏捷|沉淀|沉澱|复盘|復盤|顶层设计|頂層設計|颗粒度|顆粒度/gi,
  };

  const COPY = {
    "zh-Hans": {
      titleShort: "标题偏短，可补充岗位级别或核心方向。",
      titleLong: "标题偏长，建议压缩为 21 至 60 个字符。",
      titleGood: "标题长度在建议的 21 至 60 个字符内。",
      salaryMissing: "未看到具体薪资范围。透明薪酬不一定提高互动，但能减少求职者的筛选成本。",
      salaryFound: "已识别具体薪资或范围。",
      remoteMissing: "未说明 Remote、Hybrid 或 On-site。",
      remoteFound: "已说明办公方式。",
      visaMissing: "未说明签证或工作授权。若不适用，可明确写“无需 sponsorship 讨论”。",
      visaFound: "已说明签证、工作许可或 relocation 支持。",
      qualificationMissing: "缺少明确的经验、技能或资格要求。",
      qualificationFound: "已列出经验、技能或资格线索。",
      benefitsMissing: "福利信息较少，可补充保险、奖金、假期或成长预算。",
      benefitsFound: "已包含福利线索。",
      ctaMissing: "没有明确申请动作或联系路径。",
      ctaFound: "已包含申请或联系动作。",
      jargon: "检测到较多行业黑话，建议替换为具体职责和结果。",
      jargonClear: "未检测到密集行业黑话。",
      longUnsegmented: "正文较长且分段不足，建议拆成职责、要求、薪酬和申请方式。",
      segmented: "正文分段可读性较好。",
      hardSell: "检测到“纯硬广短帖”特征：行动号召多，但岗位信息少。",
      notHardSell: "未检测到纯硬广短帖特征。",
      evidenceHigh: "互动证据匹配较高",
      evidenceMid: "互动证据匹配中等",
      evidenceLow: "互动证据匹配偏低",
      overallHigh: "整体结构较强",
      overallMid: "整体结构可用，仍有改进空间",
      overallLow: "优先重写结构",
      completeHigh: "信息完整度较高",
      completeMid: "信息完整度中等",
      completeLow: "信息完整度偏低",
      readableHigh: "可读性较好",
      readableMid: "可读性需要调整",
      readableLow: "可读性风险较高",
      recommendation: "可直接复制的修改示例",
      instruction: "复制后请替换方括号内容，不要发布未经核实的薪资、地点或授权信息。",
    },
    "zh-Hant": {
      titleShort: "標題偏短，可補充職位級別或核心方向。",
      titleLong: "標題偏長，建議壓縮為 21 至 60 個字元。",
      titleGood: "標題長度在建議的 21 至 60 個字元內。",
      salaryMissing: "未看到具體薪資範圍。透明薪酬不一定提高互動，但能減少求職者的篩選成本。",
      salaryFound: "已識別具體薪資或範圍。",
      remoteMissing: "未說明 Remote、Hybrid 或 On-site。",
      remoteFound: "已說明辦公方式。",
      visaMissing: "未說明簽證或工作授權。若不適用，可明確寫「無需 sponsorship 討論」。",
      visaFound: "已說明簽證、工作許可或 relocation 支持。",
      qualificationMissing: "缺少明確的經驗、技能或資格要求。",
      qualificationFound: "已列出經驗、技能或資格線索。",
      benefitsMissing: "福利資訊較少，可補充保險、獎金、假期或成長預算。",
      benefitsFound: "已包含福利線索。",
      ctaMissing: "沒有明確申請動作或聯絡路徑。",
      ctaFound: "已包含申請或聯絡動作。",
      jargon: "檢測到較多行業黑話，建議替換為具體職責和結果。",
      jargonClear: "未檢測到密集行業黑話。",
      longUnsegmented: "正文較長且分段不足，建議拆成職責、要求、薪酬和申請方式。",
      segmented: "正文分段可讀性較好。",
      hardSell: "檢測到「純硬廣短帖」特徵：行動號召多，但職位資訊少。",
      notHardSell: "未檢測到純硬廣短貼特徵。",
      evidenceHigh: "互動證據匹配較高",
      evidenceMid: "互動證據匹配中等",
      evidenceLow: "互動證據匹配偏低",
      overallHigh: "整體結構較強",
      overallMid: "整體結構可用，仍有改進空間",
      overallLow: "優先重寫結構",
      completeHigh: "資訊完整度較高",
      completeMid: "資訊完整度中等",
      completeLow: "資訊完整度偏低",
      readableHigh: "可讀性較好",
      readableMid: "可讀性需要調整",
      readableLow: "可讀性風險較高",
      recommendation: "可直接複製的修改示例",
      instruction: "複製後請替換方括號內容，不要發布未經核實的薪資、地點或授權資訊。",
    },
    en: {
      titleShort: "The title is short. Add the level or core specialism.",
      titleLong: "The title is long. Aim for 21 to 60 characters.",
      titleGood: "The title is within the suggested 21 to 60 character range.",
      salaryMissing: "No specific salary or range was found. Pay transparency may not lift engagement, but it reduces candidate screening time.",
      salaryFound: "A specific salary or range was found.",
      remoteMissing: "Work arrangement is not stated as Remote, Hybrid or On-site.",
      remoteFound: "The work arrangement is stated.",
      visaMissing: "Visa or work authorization is not stated. If irrelevant, say that sponsorship is not available or not required.",
      visaFound: "Visa, work permit or relocation support is stated.",
      qualificationMissing: "Required experience, skills or qualifications are unclear.",
      qualificationFound: "Experience, skills or qualifications are stated.",
      benefitsMissing: "Benefits are light. Consider insurance, bonus, leave or learning budget.",
      benefitsFound: "Benefits are mentioned.",
      ctaMissing: "There is no clear application action or contact route.",
      ctaFound: "A clear application or contact action is present.",
      jargon: "Industry jargon is dense. Replace it with concrete work and outcomes.",
      jargonClear: "No dense industry jargon was detected.",
      longUnsegmented: "The body is long and poorly segmented. Split it into role, requirements, pay and application.",
      segmented: "The body is reasonably segmented.",
      hardSell: "This reads as a hard-sell short post: many calls to action, little role information.",
      notHardSell: "No hard-sell short-post pattern was detected.",
      evidenceHigh: "Strong match with evidence-backed engagement patterns",
      evidenceMid: "Moderate match with evidence-backed engagement patterns",
      evidenceLow: "Weak match with evidence-backed engagement patterns",
      overallHigh: "Strong overall structure",
      overallMid: "Usable structure with room to improve",
      overallLow: "Rewrite the structure first",
      completeHigh: "High information completeness",
      completeMid: "Moderate information completeness",
      completeLow: "Low information completeness",
      readableHigh: "Good readability",
      readableMid: "Readability needs adjustment",
      readableLow: "High readability risk",
      recommendation: "Copy-ready revision example",
      instruction: "Replace bracketed placeholders and publish only verified pay, location and authorization details.",
    },
  };

  function clamp(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, Math.round(value)));
  }

  function normalize(value) {
    return String(value || "").replace(/\r\n?/g, "\n").trim();
  }

  function paragraphCount(body) {
    return body.split("\n").filter((line) => line.trim()).length;
  }

  function jargonHits(text) {
    const matches = text.match(PATTERNS.jargon);
    return matches ? matches.length : 0;
  }

  function signalState(source) {
    const text = source.title + "\n" + source.body;
    const salary = PATTERNS.salaryAmount.test(text);
    const remote = PATTERNS.remote.test(text);
    const visa = PATTERNS.visa.test(text);
    const qualification = PATTERNS.qualification.test(text);
    const benefits = PATTERNS.benefits.test(text);
    const cta = PATTERNS.cta.test(text);
    return {
      salary,
      remote,
      visa,
      qualification,
      benefits,
      cta,
    };
  }

  function scoreBand(score, kind, copy) {
    const high = score >= 75;
    const middle = score >= 50;
    const prefix =
      kind === "overall"
        ? "overall"
        : kind === "evidence"
        ? "evidence"
        : kind === "complete"
          ? "complete"
          : "readable";
    return copy[`${prefix}${high ? "High" : middle ? "Mid" : "Low"}`];
  }

  function cleanTitle(title) {
    const value = normalize(title)
      .replace(/[🚨📣🔥✅💸📍⏰👉👇]/gu, "")
      .replace(/^[#\s-]+/g, "")
      .replace(/\s+/g, " ");
    if (value.length <= 60) return value;
    const words = value.split(" ");
    let result = "";
    for (const word of words) {
      if ((result + " " + word).trim().length > 60) break;
      result = (result + " " + word).trim();
    }
    return result || value.slice(0, 60).trim();
  }

  function buildExample(source, signals, locale, copy) {
    const title = cleanTitle(source.title) || (locale === "en" ? "[Role title]" : "[岗位标题]");
    const bullet = locale === "en" ? "-" : "•";
    if (locale === "en") {
      return [
        title,
        "",
        "Location: [City / region] · [Remote / Hybrid / On-site]",
        signals.salary ? "Compensation: [Keep or refine the verified salary range]" : "Compensation: [Verified salary range]",
        signals.visa ? "Work authorization: [Keep the verified sponsorship or permit statement]" : "Work authorization: [Visa sponsorship / local authorization / not applicable]",
        "",
        "What you will do",
        `${bullet} [Outcome or responsibility 1]`,
        `${bullet} [Outcome or responsibility 2]`,
        "",
        "What we are looking for",
        `${bullet} [Required experience or skill]`,
        `${bullet} [Preferred but not required skill]`,
        "",
        "Benefits and process",
        `${bullet} [Benefits worth naming]`,
        `${bullet} [Interview steps and expected timing]`,
        "",
        `Apply: [Application link or contact route]`,
        copy.instruction,
      ].join("\n");
    }
    const traditional = locale === "zh-Hant";
    return [
      title,
      "",
      `${traditional ? "工作地點" : "工作地点"}：[城市 / 地区] · [Remote / Hybrid / On-site]`,
      `${traditional ? "薪酬" : "薪酬"}：${signals.salary ? "[核对并保留真实薪资范围]" : "[填写已核实的薪资范围]"}`,
      `${traditional ? "工作授權" : "工作授权"}：${signals.visa ? "[保留已核实的工作许可或 sponsorship 说明]" : "[说明签证 sponsorship / 本地授权 / 不适用]"}`,
      "",
      traditional ? "你會做什麼" : "你会做什么",
      `${bullet} [核心职责或业务结果 1]`,
      `${bullet} [核心职责或业务结果 2]`,
      "",
      traditional ? "我們在找什麼樣的人" : "我们在找什么样的人",
      `${bullet} [必须满足的经验或技能]`,
      `${bullet} [加分项，不必堆砌黑话]`,
      "",
      traditional ? "福利與流程" : "福利与流程",
      `${bullet} [值得明确写出的福利]`,
      `${bullet} [面试流程和时间预期]`,
      "",
      `${traditional ? "申請" : "申请"}：[申请链接或联系路径]`,
      copy.instruction,
    ].join("\n");
  }

  function score(input) {
    const locale = COPY[input.locale] ? input.locale : "zh-Hans";
    const copy = COPY[locale];
    const source = {
      title: normalize(input.title),
      body: normalize(input.body),
    };
    const text = `${source.title}\n${source.body}`;
    const signals = signalState(source);
    const titleLength = source.title.length;
    const bodyParagraphs = paragraphCount(source.body);
    const bodyLength = source.body.length;
    const jargon = jargonHits(text);
    const hardSell =
      signals.cta &&
      text.length < 350 &&
      !signals.salary &&
      !signals.qualification &&
      !signals.benefits;
    const longUnsegmented =
      bodyLength >= RULES.longBody && bodyParagraphs < 3;

    let engagement = 50;
    if (signals.qualification) engagement += 12;
    if (signals.cta) engagement += 3;
    if (hardSell) engagement -= 15;
    if (titleLength >= RULES.titleMin && titleLength <= RULES.titleMax) {
      engagement += 2;
    }
    engagement = clamp(engagement, 20, 90);

    let completeness = 0;
    if (titleLength >= 8) completeness += 10;
    if (signals.salary) completeness += 24;
    if (signals.remote) completeness += 14;
    if (signals.visa) completeness += 12;
    if (signals.qualification) completeness += 16;
    if (signals.benefits) completeness += 9;
    if (signals.cta) completeness += 10;
    completeness += Math.min(5, bodyLength / 180);
    completeness = clamp(completeness);

    let readability = 60;
    if (titleLength >= RULES.titleMin && titleLength <= RULES.titleMax) readability += 14;
    else if (titleLength < 12 || titleLength > 90) readability -= 10;
    else if (titleLength > RULES.titleMax) readability -= 4;
    if (bodyLength >= 200) readability += 8;
    if (bodyLength < RULES.minBody) readability -= 18;
    if (bodyParagraphs >= 4) readability += 8;
    if (jargon >= 2) readability -= jargon >= 4 ? 18 : 10;
    if (longUnsegmented) readability -= 16;
    if (hardSell) readability -= 18;
    readability = clamp(readability);

    const overall = clamp(
      engagement * 0.35 + completeness * 0.4 + readability * 0.25,
    );

    const checks = [
      {
        key: "title",
        status:
          titleLength >= RULES.titleMin && titleLength <= RULES.titleMax
            ? "pass"
            : "warn",
        title: `${copy.titleGood} (${titleLength})`,
        detail:
          titleLength < RULES.titleMin
            ? copy.titleShort
            : titleLength > RULES.titleMax
              ? copy.titleLong
              : "",
        weight: "readability",
      },
      {
        key: "salary",
        status: signals.salary ? "pass" : "info",
        title: signals.salary ? copy.salaryFound : copy.salaryMissing,
        detail:
          locale === "en"
            ? "Completeness signal only. The current sample does not show a reliable engagement lift for specific pay amounts."
            : locale === "zh-Hant"
              ? "僅作資訊完整度提示；目前樣本未顯示具體薪酬與更高互動之間有穩定關係。"
              : "仅作信息完整度提示；当前样本未显示具体薪酬与更高互动之间存在稳定关系。",
        weight: "completeness",
      },
      {
        key: "remote",
        status: signals.remote ? "pass" : "info",
        title: signals.remote ? copy.remoteFound : copy.remoteMissing,
        detail:
          locale === "en"
            ? "Remote or hybrid did not show higher engagement in the matched role-age comparison."
            : locale === "zh-Hant"
              ? "在職位與時間匹配比較中，Remote 或 Hybrid 沒有呈現更高互動。"
              : "在岗位与时间匹配比较中，Remote 或 Hybrid 没有呈现更高互动。",
        weight: "completeness",
      },
      {
        key: "visa",
        status: signals.visa ? "pass" : "info",
        title: signals.visa ? copy.visaFound : copy.visaMissing,
        detail:
          locale === "en"
            ? "Treat this as a clarity check, not a proven engagement lever."
            : locale === "zh-Hant"
              ? "將此視為資訊清晰度檢查，而不是已證實的互動提升因素。"
              : "请将此视为信息清晰度检查，而不是已验证的互动提升因素。",
        weight: "completeness",
      },
      {
        key: "qualification",
        status: signals.qualification ? "pass" : "warn",
        title: signals.qualification
          ? copy.qualificationFound
          : copy.qualificationMissing,
        detail:
          locale === "en"
            ? "Posts mentioning qualifications had a 26.7% high-engagement rate versus 22.0% without it."
            : locale === "zh-Hant"
              ? "提及資格或經驗的帖子高互動率為 26.7%，未提及為 22.0%。"
              : "提及资格或经验的帖子高互动率为 26.7%，未提及为 22.0%。",
        weight: "evidence",
      },
      {
        key: "benefits",
        status: signals.benefits ? "pass" : "info",
        title: signals.benefits ? copy.benefitsFound : copy.benefitsMissing,
        detail: "",
        weight: "completeness",
      },
      {
        key: "cta",
        status: signals.cta ? "pass" : "info",
        title: signals.cta ? copy.ctaFound : copy.ctaMissing,
        detail: "",
        weight: "completeness",
      },
      {
        key: "jargon",
        status: jargon >= 2 ? "warn" : "pass",
        title: jargon >= 2 ? copy.jargon : copy.jargonClear,
        detail: jargon >= 2 ? `${jargon} matches` : "",
        weight: "readability",
      },
      {
        key: "segmentation",
        status: longUnsegmented ? "warn" : "pass",
        title: longUnsegmented ? copy.longUnsegmented : copy.segmented,
        detail: `${bodyLength} chars · ${bodyParagraphs} sections`,
        weight: "readability",
      },
      {
        key: "hardSell",
        status: hardSell ? "warn" : "pass",
        title: hardSell ? copy.hardSell : copy.notHardSell,
        detail:
          hardSell
            ? locale === "en"
              ? "High-engagement prevalence: 15.6% versus 25.5% for other posts."
              : locale === "zh-Hant"
                ? "高互動比例為 15.6%，其他帖子為 25.5%。"
                : "高互动比例为 15.6%，其他帖子为 25.5%。"
            : "",
        weight: "evidence",
      },
    ];

    return {
      overall,
      engagement,
      completeness,
      readability,
      titleLength,
      bodyLength,
      bodyParagraphs,
      jargonHits: jargon,
      hardSell,
      longUnsegmented,
      signals,
      checks,
      labels: {
        overall: scoreBand(overall, "overall", copy),
        engagement: scoreBand(engagement, "evidence", copy),
        completeness: scoreBand(completeness, "complete", copy),
        readability: scoreBand(readability, "readable", copy),
      },
      example: buildExample(source, signals, locale, copy),
      method: {
        sample: 3470,
        optimalTitle: [RULES.titleMin, RULES.titleMax],
        comparison: "matched by role and observation-age group",
      },
    };
  }

  return {
    score,
    rules: { ...RULES },
    patterns: PATTERNS,
  };
});
