globalThis.WORKBENCH_RULE_ANALYSIS={
  "datasetVersion": "baseline-20261121-supp-1",
  "method": {
    "sample": "Unique analysis-eligible posts with visible likes and comment counts",
    "titleProxy": "First nonempty line of the post text",
    "engagementOutcome": "Top quartile of likes plus visible comment count within observation-age groups",
    "caveat": "Associations are exploratory, not causal; posts were not randomly assigned."
  },
  "counts": {
    "posts": 3470,
    "median_likes": 14,
    "median_comments": 2,
    "median_visible_responses": 18
  },
  "titleBins": [
    {
      "label": "0-20",
      "n": 373,
      "high_rate": 0.289544235924933,
      "likes_median": 18,
      "comments_median": 2
    },
    {
      "label": "21-40",
      "n": 552,
      "high_rate": 0.24456521739130435,
      "likes_median": 10,
      "comments_median": 1
    },
    {
      "label": "41-60",
      "n": 657,
      "high_rate": 0.2709284627092846,
      "likes_median": 14,
      "comments_median": 2
    },
    {
      "label": "61-80",
      "n": 388,
      "high_rate": 0.2190721649484536,
      "likes_median": 11,
      "comments_median": 2
    },
    {
      "label": "81-100",
      "n": 289,
      "high_rate": 0.21453287197231835,
      "likes_median": 9,
      "comments_median": 1
    },
    {
      "label": "101-140",
      "n": 357,
      "high_rate": 0.226890756302521,
      "likes_median": 13,
      "comments_median": 2
    },
    {
      "label": "141+",
      "n": 854,
      "high_rate": 0.26346604215456676,
      "likes_median": 18,
      "comments_median": 3
    }
  ],
  "optimalTitle": {
    "label": "0-20",
    "n": 373,
    "high_rate": 0.289544235924933,
    "likes_median": 18,
    "comments_median": 2
  },
  "features": {
    "salary_amount": {
      "label": "Salary amount or range",
      "with_n": 303,
      "without_n": 3167,
      "with_rate": 0.20462046204620463,
      "without_rate": 0.2563940637827597,
      "difference": -0.05177360173655507,
      "rate_ratio": 0.7980702011087809,
      "with_ci": [
        0.16302741869788856,
        0.25360969960680024
      ],
      "without_ci": [
        0.24148806488613572,
        0.2718903391312709
      ],
      "with_likes_median": 9,
      "without_likes_median": 15,
      "with_comments_median": 1,
      "without_comments_median": 2,
      "matched_role_age_difference": -0.03924747721272673,
      "matched_strata": 19
    },
    "salary_mention": {
      "label": "Salary mentioned without requiring an amount",
      "with_n": 896,
      "without_n": 2574,
      "with_rate": 0.29464285714285715,
      "without_rate": 0.236985236985237,
      "difference": 0.05765762015762016,
      "rate_ratio": 1.2432962529274005,
      "with_ci": [
        0.2657197524922697,
        0.3253193815064252
      ],
      "without_ci": [
        0.22095697689951865,
        0.2537974067678099
      ],
      "with_likes_median": 12,
      "without_likes_median": 15,
      "with_comments_median": 2,
      "without_comments_median": 2,
      "matched_role_age_difference": 0.04375897887429215,
      "matched_strata": 25
    },
    "remote": {
      "label": "Remote or hybrid",
      "with_n": 777,
      "without_n": 2693,
      "with_rate": 0.23037323037323038,
      "without_rate": 0.2580764946156703,
      "difference": -0.027703264242439907,
      "rate_ratio": 0.8926548336620278,
      "with_ci": [
        0.20213539849965342,
        0.2612640925110714
      ],
      "without_ci": [
        0.24190237943448126,
        0.27493984073892463
      ],
      "with_likes_median": 10,
      "without_likes_median": 16,
      "with_comments_median": 2,
      "without_comments_median": 2,
      "matched_role_age_difference": -0.03793979860853131,
      "matched_strata": 24
    },
    "visa": {
      "label": "Visa or sponsorship",
      "with_n": 111,
      "without_n": 3359,
      "with_rate": 0.21621621621621623,
      "without_rate": 0.25305150342363797,
      "difference": -0.03683528720742174,
      "rate_ratio": 0.854435612082671,
      "with_ci": [
        0.1498210872799431,
        0.30159721410213447
      ],
      "without_ci": [
        0.23863647459330717,
        0.2680307439875501
      ],
      "with_likes_median": 16,
      "without_likes_median": 14,
      "with_comments_median": 4,
      "without_comments_median": 2,
      "matched_role_age_difference": -0.09608380959678911,
      "matched_strata": 8
    },
    "qualification": {
      "label": "Qualifications or experience",
      "with_n": 2354,
      "without_n": 1116,
      "with_rate": 0.26677994902293967,
      "without_rate": 0.22043010752688172,
      "difference": 0.04634984149605795,
      "rate_ratio": 1.2102700126406531,
      "with_ci": [
        0.24930365606513397,
        0.28501620664320065
      ],
      "without_ci": [
        0.19709067649263112,
        0.24568765930057396
      ],
      "with_likes_median": 17,
      "without_likes_median": 8,
      "with_comments_median": 3,
      "without_comments_median": 1,
      "matched_role_age_difference": 0.04663451747419316,
      "matched_strata": 25
    },
    "benefits": {
      "label": "Benefits",
      "with_n": 402,
      "without_n": 3068,
      "with_rate": 0.21890547263681592,
      "without_rate": 0.2561929595827901,
      "difference": -0.03728748694597417,
      "rate_ratio": 0.8544554580785639,
      "with_ci": [
        0.1812476250420615,
        0.2618848680291269
      ],
      "without_ci": [
        0.24105758386946333,
        0.2719381383057947
      ],
      "with_likes_median": 11,
      "without_likes_median": 14,
      "with_comments_median": 2,
      "without_comments_median": 2,
      "matched_role_age_difference": -0.01666061095419207,
      "matched_strata": 21
    },
    "cta": {
      "label": "Call to action",
      "with_n": 2586,
      "without_n": 884,
      "with_rate": 0.25638051044083526,
      "without_rate": 0.23868778280542988,
      "difference": 0.017692727635405386,
      "rate_ratio": 1.074124982131272,
      "with_ci": [
        0.23992142970555352,
        0.27356232930117486
      ],
      "without_ci": [
        0.21175522759914,
        0.2678816806061074
      ],
      "with_likes_median": 16,
      "without_likes_median": 8,
      "with_comments_median": 2,
      "without_comments_median": 1,
      "matched_role_age_difference": 0.01190002653076406,
      "matched_strata": 24
    },
    "dense_jargon": {
      "label": "Dense industry jargon",
      "with_n": 96,
      "without_n": 3374,
      "with_rate": 0.28125,
      "without_rate": 0.25103734439834025,
      "difference": 0.030212655601659755,
      "rate_ratio": 1.1203512396694215,
      "with_ci": [
        0.2010728263750154,
        0.3782608381495917
      ],
      "without_ci": [
        0.23669477417748638,
        0.26594620223774873
      ],
      "with_likes_median": 25.5,
      "without_likes_median": 14,
      "with_comments_median": 3,
      "without_comments_median": 2,
      "matched_role_age_difference": 0.2031896005094119,
      "matched_strata": 7
    },
    "long_unsegmented": {
      "label": "Long unsegmented text",
      "with_n": 507,
      "without_n": 2963,
      "with_rate": 0.27218934911242604,
      "without_rate": 0.24839689503881202,
      "difference": 0.023792454073614022,
      "rate_ratio": 1.0957840236686391,
      "with_ci": [
        0.2352671459240179,
        0.3125378879651563
      ],
      "without_ci": [
        0.2331712075303935,
        0.2642741565901581
      ],
      "with_likes_median": 18,
      "without_likes_median": 13,
      "with_comments_median": 3,
      "without_comments_median": 2,
      "matched_role_age_difference": 0.04808588750136807,
      "matched_strata": 22
    },
    "hard_sell": {
      "label": "Hard-sell short post",
      "with_n": 109,
      "without_n": 3361,
      "with_rate": 0.1559633027522936,
      "without_rate": 0.2549836358226718,
      "difference": -0.09902033307037822,
      "rate_ratio": 0.6116600473167547,
      "with_ci": [
        0.09971462165945087,
        0.23563687991443671
      ],
      "without_ci": [
        0.240533761404908,
        0.2699929748313534
      ],
      "with_likes_median": 2,
      "without_likes_median": 14,
      "with_comments_median": 1,
      "without_comments_median": 2,
      "matched_role_age_difference": -0.09440375247202003,
      "matched_strata": 8
    }
  },
  "roles": [
    {
      "role": "公共部门与非营利",
      "n": 100,
      "high_rate": 0.3,
      "likes_median": 35.5,
      "comments_median": 3,
      "salary_amount_rate": 0.13,
      "remote_rate": 0.23
    },
    {
      "role": "营销与销售",
      "n": 156,
      "high_rate": 0.28205128205128205,
      "likes_median": 3,
      "comments_median": 0,
      "salary_amount_rate": 0.08333333333333333,
      "remote_rate": 0.46153846153846156
    },
    {
      "role": "运营与行政",
      "n": 200,
      "high_rate": 0.28,
      "likes_median": 19,
      "comments_median": 3,
      "salary_amount_rate": 0.14,
      "remote_rate": 0.405
    },
    {
      "role": "建筑房地产与工程",
      "n": 146,
      "high_rate": 0.273972602739726,
      "likes_median": 30,
      "comments_median": 2.5,
      "salary_amount_rate": 0.07534246575342465,
      "remote_rate": 0.08904109589041095
    },
    {
      "role": "设计",
      "n": 165,
      "high_rate": 0.2606060606060606,
      "likes_median": 19,
      "comments_median": 5,
      "salary_amount_rate": 0.09090909090909091,
      "remote_rate": 0.48484848484848486
    },
    {
      "role": "工程与技术",
      "n": 154,
      "high_rate": 0.2597402597402597,
      "likes_median": 6,
      "comments_median": 1,
      "salary_amount_rate": 0.07792207792207792,
      "remote_rate": 0.33766233766233766
    },
    {
      "role": "其他与未识别",
      "n": 372,
      "high_rate": 0.25268817204301075,
      "likes_median": 3,
      "comments_median": 0,
      "salary_amount_rate": 0.06989247311827956,
      "remote_rate": 0.29838709677419356
    },
    {
      "role": "物流与运输",
      "n": 698,
      "high_rate": 0.2507163323782235,
      "likes_median": 11,
      "comments_median": 1,
      "salary_amount_rate": 0.10458452722063037,
      "remote_rate": 0.045845272206303724
    },
    {
      "role": "餐饮与酒店",
      "n": 204,
      "high_rate": 0.25,
      "likes_median": 50.5,
      "comments_median": 5,
      "salary_amount_rate": 0.029411764705882353,
      "remote_rate": 0.049019607843137254
    },
    {
      "role": "零售与电商",
      "n": 309,
      "high_rate": 0.24919093851132687,
      "likes_median": 13,
      "comments_median": 2,
      "salary_amount_rate": 0.08414239482200647,
      "remote_rate": 0.18770226537216828
    },
    {
      "role": "教育培训",
      "n": 169,
      "high_rate": 0.2485207100591716,
      "likes_median": 20,
      "comments_median": 3,
      "salary_amount_rate": 0.07692307692307693,
      "remote_rate": 0.20118343195266272
    },
    {
      "role": "金融保险",
      "n": 117,
      "high_rate": 0.24786324786324787,
      "likes_median": 20,
      "comments_median": 3,
      "salary_amount_rate": 0.06837606837606838,
      "remote_rate": 0.17094017094017094
    },
    {
      "role": "医疗与健康",
      "n": 145,
      "high_rate": 0.2413793103448276,
      "likes_median": 16,
      "comments_median": 3,
      "salary_amount_rate": 0.034482758620689655,
      "remote_rate": 0.30344827586206896
    },
    {
      "role": "招聘与人力",
      "n": 182,
      "high_rate": 0.23626373626373626,
      "likes_median": 5.5,
      "comments_median": 1,
      "salary_amount_rate": 0.09340659340659341,
      "remote_rate": 0.26373626373626374
    },
    {
      "role": "制造业与工业生产",
      "n": 182,
      "high_rate": 0.21428571428571427,
      "likes_median": 18,
      "comments_median": 2,
      "salary_amount_rate": 0.14285714285714285,
      "remote_rate": 0.15384615384615385
    },
    {
      "role": "产品与项目",
      "n": 171,
      "high_rate": 0.21052631578947367,
      "likes_median": 23,
      "comments_median": 3,
      "salary_amount_rate": 0.06432748538011696,
      "remote_rate": 0.4152046783625731
    }
  ]
};
