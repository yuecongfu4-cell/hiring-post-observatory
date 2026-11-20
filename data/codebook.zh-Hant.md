# 凍結樣本與字段說明

版本：baseline-20261120-fin-1。快照生成日：2026-11-20。整理樣本合併原始凍結表、教育／製造、建築房地產工程、兩批餐飲酒店、運營行政、醫療健康部分採集及金融保險批次；原始 CSV 收集日期和每條記錄的 collectedAt 保持分開。所有下載模板只有表頭，沒有模擬研究記錄。

## 可復核計數

| 項目 | 記錄數 |
| --- | ---: |
| 來源貼文 | 3094 |
| 非重復貼文 | 3087 |
| 標記重復并排除分析 | 7 |
| 當前規則互動分析樣本 | 2027 |
| 來源評論 | 1228 |
| 醫療與健康貼文 | 195 |
| 醫療與健康互動分析樣本 | 81 |
| 金融保險貼文 | 107 |
| 金融保險互動分析樣本 | 103 |
| 金融保險關聯評論 | 65 |
| 評論正文為空（記錄保留） | 5 |
| 評論未關聯來源帖（記錄保留） | 12 |
| 全部貼文缺可用連結 | 1123 |
| 非重復貼文缺可用連結 | 1121 |
| 全部貼文缺按讚數 | 946 |
| 全部貼文缺評論數 | 1041 |
| 全部貼文缺轉發數 | 1241 |
| 可計算帖齡 | 3076 |
| 年齡缺失 | 18 |

另有 49 條隔離記錄來自舊項目隔離說明，沒有加入 master CSV，也不屬于以上分母。數字缺失為 JSON null，真實 0 保留為 0。所有 3,094 條貼文和 1,228 條評論都保留在本快照。醫療健康部分採集匯出 89 條原始記錄，其中 80 條通過品質規則，79 條新增、1 條重復；採集因 LinkedIn 登入或驗證要求停止，尚未達到 500 條目標。金融保險檔案檢查 160 條候選，85 條貼文全部新增并歸入金融保險，另有 44 條關聯評論新增。LI00030 的源 post_time 比 collected_at 晚 1 天，其 publishedAt 與 ageDays 均留空，ageSource 為 missing；不把源日期沖突修成猜測日期。

## posts 字段

| 字段 | 類型 | 定義 |
| --- | --- | --- |
| id / sourceId | string | 原始 post_id，兩個字段在凍結樣本中相同；不是作者身份。 |
| url | string / null | 來源 LinkedIn 貼文連結；只接受 https LinkedIn 貼文路徑，移除查詢參數。目前 1,123 條記錄缺可用連結，留空不補造。 |
| text | string | 完整來源 post_text 的脫敏版本，規范空白，不截斷；不提供作者字段。 |
| jobFamily | string | 使用 16 類研究分類。已識別的行業代碼和行業關鍵詞優先，其余記錄再按職位功能詞與正文規則分類。 |
| publishedAt | ISO date / null | CSV post_time 的可解析日期；相對時間標簽不作為確切日期輸出。 |
| collectedAt | ISO date or datetime / null | CSV collected_at；保留來源的日期或時間精度及時區。 |
| ageDays | number / null | 在收集時的帖齡。確切源日期用日歷天差；相對標簽匯出的近似發布日期也用于計算收藏時帖齡。不是今天的帖齡。 |
| likes / commentsCount / reposts | number / null | CSV likes_count / comments_count / shares_count，可見互動計數。 |
| keyword | string / null | 搜索關鍵詞。 |
| isDuplicate | boolean | CSV is_duplicate_master。保留記錄；true 不進入分析。 |
| analysisEligible | boolean | 非重復、來源正文原始長度至少 80 字符、likes/comments 均非缺失，且不屬于隔離記錄。精確復現舊規則 1,318 條；脫敏后的長度不會改變此凍結標記。 |
| provenance | string | 固定 baseline。 |
| reviewStatus | string | 固定 approved，表示已納入凍結匯出；不表示人工驗證每條正文。 |
| ageSource | string | exact：CSV 絕對日期；relative：相對標簽近似；missing：年齡無法計算。 |

jobFamily 的十六類為：工程與技術、產品與項目、設計、營銷與銷售、招聘與人力、醫療與健康、餐飲與酒店、運營與行政、其他與未識別、金融保險、教育培訓、製造業與工業生產、零售與電商、物流與運輸、公共部門與非營利、建築房地產與工程。行業代碼優先于職位功能詞；分組是文本編碼，不是認證職業標簽。

## comments 字段

| 字段 | 類型 | 定義 |
| --- | --- | --- |
| id / sourceId | string | 來源 comment_id；凍結樣本中相同。 |
| postId | string / null | 來源 post_id，關聯 posts.id；12 條來源未填值，保持 null，不猜測關聯。 |
| text | string | 完整 comment_body 的脫敏版本，規范空白；原始空正文保留為空字符串。 |
| collectedAt | ISO date or datetime / null | 評論源表沒有收集時點；已關聯評論繼承對應帖 collectedAt，僅作擷取時間；未關聯時保持 null。不是評論發表時間。 |
| provenance / reviewStatus | string | 固定 baseline / approved，與 posts 同義。 |
| textEmpty | boolean | 正文為空的顯式標志。5 條為 true；空正文不計入文本主題/長度分母時應保留記錄數差異。 |

## 脫敏與限制

作者/評論者字段、原始頁面文本、公司名字段和源機器路徑均不公開。正文中的已知作者/評論者全名、郵箱、外部連結、電話候選及聯系帳號替換為 [name hidden]、[email hidden]、[link hidden]、[phone hidden] 或 [contact hidden] 等標記。僅 url 字段保留可用 LinkedIn 來源貼文連結。電話規則保護帶貨幣符號、薪資單位和常見薪資范圍的數字，避免誤吞薪資。

這些記錄是便利樣本。按讚與評論不是申請人數、錄用結果、觸達人數或因果效果。貼文年齡、職位和搜索通道不同會混雜比較。評論匯出只覆蓋已擷取可見層，不能等同于平臺評論總數。自動分類及脫敏會帶來編碼誤差。缺連結與未關聯評論仍保留，并在 meta.quality 中報告。

匯出保留 CSV 提供的所有正文內容，不額外截斷長度；來源頁面擷取本身可能只含當時可見、帶“more”的片段。

本版六類正文特征由瀏覽器按當前新規則對完整脫敏正文重新計算，不沿用舊版五類信號的聚合結果。正文存在連結不自動等于已提供申請路徑；規則命中仍需人工復核。analysisEligible 則保留舊樣本入選口徑，便于復核 1,318 條分母。

## 檔案一致性與復現

baseline.json 與 baseline.js 包含同一對象；后者賦值 globalThis.APP_BASELINE，支持本機瀏覽器直接加載。meta.fields 列出實際字段。meta.sourceFiles 儲存各批次源 CSV 的 SHA-256；meta.dataHash 儲存脫敏 posts/comments 排序鍵、緊湊 UTF-8 JSON 的 SHA-256（不含 meta，避免循環哈希）。meta.hashes 另以穩定 postsSource、commentsSource、records 鍵提供這三個哈希；腳本沒有按運行時刻變化的字段，同一輸入與規則會產生同一快照。

資料記錄哈希：`5fa05d8dd355fc4b354b54190078aceba90f9354df5834faeb519680bcb94f82`。

空匯入模板列名與上述字段完全相同。新增記錄須使用獨立 provenance 和唯一 id，缺失數值留空，不用 0 代替；相對日期不可偽裝成確切發表日期。原始凍結樣本的排除標志和來源計數應保留。
