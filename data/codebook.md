# 冻结样本与字段说明

版本：baseline-20261118。快照生成日：2026-11-18。原始 CSV 收集日期和每条记录的 collectedAt 保持分开。所有下载模板只有表头，没有模拟研究记录。

## 可复核计数

| 项目 | 记录数 |
| --- | ---: |
| 来源帖子 | 1443 |
| 非重复帖子 | 1436 |
| 标记重复并排除分析 | 7 |
| 旧规则分析样本 | 1318 |
| 来源评论 | 1184 |
| 评论正文为空（记录保留） | 5 |
| 评论未关联来源帖（记录保留） | 12 |
| 全部帖子缺可用链接 | 654 |
| 其中来源未填链接 | 642 |
| 其中短链接目标未验证（未访问） | 12 |
| 非重复帖子缺可用链接 | 652 |
| 源日期可算年龄 | 1070 |
| 相对标签可算近似年龄 | 355 |
| 年龄缺失 | 18 |

另有 49 条隔离记录来自旧项目隔离说明，没有加入两份 master CSV，也不属于以上分母。数字缺失为 JSON null，真实 0 保留为 0。所有 1,443 条帖子和 1,184 条评论都保留在本快照。LI00030 的源 post_time 比 collected_at 晚 1 天，其 publishedAt 与 ageDays 均留空，ageSource 为 missing；不把源日期冲突修成猜测日期。

## posts 字段

| 字段 | 类型 | 定义 |
| --- | --- | --- |
| id / sourceId | string | 原始 post_id，两个字段在冻结样本中相同；不是作者身份。 |
| url | string / null | 来源 LinkedIn 帖子链接；只接受 https LinkedIn 帖子路径，移除查询参数。642 条源链接空，另 12 条 lnkd.in 短链接目标未经验证，留空不补造。 |
| text | string | 完整来源 post_text 的脱敏版本，规范空白，不截断；不提供作者字段。 |
| jobFamily | string | 沿用旧 build_website_data.py 的 9 类映射；特定搜索通道优先，其余按 job_title + post_text 的最早正则命中分类。 |
| publishedAt | ISO date / null | CSV post_time 的可解析日期；相对时间标签不作为确切日期输出。 |
| collectedAt | ISO date or datetime / null | CSV collected_at；保留来源的日期或时间精度及时区。 |
| ageDays | number / null | 在收集时的帖龄。确切源日期用日历天差；相对分钟/小时/天/周换算为天。不是今天的帖龄。 |
| likes / commentsCount / reposts | number / null | CSV likes_count / comments_count / shares_count，可见互动计数。 |
| keyword | string / null | 搜索关键词。 |
| isDuplicate | boolean | CSV is_duplicate_master。保留记录；true 不进入分析。 |
| analysisEligible | boolean | 非重复、来源正文原始长度至少 80 字符、likes/comments 均非缺失，且不属于隔离记录。精确复现旧规则 1,318 条；脱敏后的长度不会改变此冻结标记。 |
| provenance | string | 固定 baseline。 |
| reviewStatus | string | 固定 approved，表示已纳入冻结导出；不表示人工验证每条正文。 |
| ageSource | string | exact：CSV 绝对日期；relative：相对标签近似；missing：年龄无法计算。 |

jobFamily 的九类为：工程与技术、产品与项目、设计、营销与销售、招聘与人力、医疗与健康、餐饮与酒店、运营与行政、其他与未识别。分组是文本编码，不是认证职业标签。

## comments 字段

| 字段 | 类型 | 定义 |
| --- | --- | --- |
| id / sourceId | string | 来源 comment_id；冻结样本中相同。 |
| postId | string / null | 来源 post_id，关联 posts.id；12 条来源未填值，保持 null，不猜测关联。 |
| text | string | 完整 comment_body 的脱敏版本，规范空白；原始空正文保留为空字符串。 |
| collectedAt | ISO date or datetime / null | 评论源表没有收集时点；已关联评论继承对应帖 collectedAt，仅作采集时间；未关联时保持 null。不是评论发表时间。 |
| provenance / reviewStatus | string | 固定 baseline / approved，与 posts 同义。 |
| textEmpty | boolean | 正文为空的显式标志。5 条为 true；空正文不计入文本主题/长度分母时应保留记录数差异。 |

## 脱敏与限制

作者/评论者字段、原始页面文本、公司名字段和源机器路径均不公开。正文中的已知作者/评论者全名、邮箱、外部链接、电话候选及联系账号替换为 [name hidden]、[email hidden]、[link hidden]、[phone hidden] 或 [contact hidden] 等标记。仅 url 字段保留可用 LinkedIn 来源帖子链接。电话规则保护带货币符号、薪资单位和常见薪资范围的数字，避免误吞薪资。

这些记录是便利样本。点赞与评论不是申请人数、录用结果、触达人数或因果效果。帖子年龄、岗位和搜索通道不同会混杂比较。评论导出只覆盖已采集可见层，不能等同于平台评论总数。自动分类及脱敏会带来编码误差。缺链接与未关联评论仍保留，并在 meta.quality 中报告。

导出保留 CSV 提供的所有正文内容，不额外截断长度；来源页面采集本身可能只含当时可见、带“more”的片段。

本版六类正文特征由浏览器按当前新规则对完整脱敏正文重新计算，不沿用旧版五类信号的聚合结果。正文存在链接不自动等于已提供申请路径；规则命中仍需人工复核。analysisEligible 则保留旧样本入选口径，便于复核 1,318 条分母。

## 文件一致性与复现

baseline.json 与 baseline.js 包含同一对象；后者赋值 globalThis.APP_BASELINE，支持本地浏览器直接加载。meta.fields 列出实际字段。meta.sourceFiles 保存两份源 CSV 的 SHA-256；meta.dataHash 保存脱敏 posts/comments 排序键、紧凑 UTF-8 JSON 的 SHA-256（不含 meta，避免循环哈希）。meta.hashes 另以稳定 postsSource、commentsSource、records 键提供这三个哈希；脚本没有按运行时刻变化的字段，同一输入与规则会产生同一快照。

数据记录哈希：`a21d4cfacd65754daa6fbcc72510d5ddc01246f6454358b03b3686d583f65afd`。

空导入模板列名与上述字段完全相同。新增记录须使用独立 provenance 和唯一 id，缺失数值留空，不用 0 代替；相对日期不可伪装成确切发表日期。原始冻结样本的排除标志和来源计数应保留。
