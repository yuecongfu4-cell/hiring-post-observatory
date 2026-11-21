# 职帖观察站

本版本使用浏览器内置 IndexedDB 保存大型本机工作区，单类记录导入上限为 100,000 行；整理样本随站点内置，因此 Firebase 读取配额耗尽时仍能查看完整数据。Firebase Firestore 继续用于跨设备新增记录与审核状态同步。

2026-11-20 的容量验收覆盖 20,000 条新增帖子：系统 Chrome 中 IndexedDB 写入约 45 ms、读取约 24 ms；导入校验、数据集构建、统计计算和共享记录合并均完成于约 2 秒内。Firestore 是逐条追加写入的共享存储，首次上传大量记录可能需要较长时间，但同步在后台进行，不阻塞页面分析。

为避免每次打开页面都完整读取全部共享记录，自动同步间隔已调整为 6 小时；用户仍可通过“立即同步”手动刷新。Firebase 免费读取配额耗尽时，网站继续使用本机 IndexedDB 和内置整理样本，不会影响统计页面打开。

一个可离线运行的招聘帖研究网站，支持简体中文、繁体中文和英文。

## 分析结论与招聘帖文案打分器

分析页使用岗位与发布至采集时长匹配后的比较，区分有数据支持的结论、探索性关联和不能从观察数据推出的因果关系。当前 `3,470` 条可分析唯一帖子显示：明确资格与经验的帖子进入高互动组的比例较高，纯硬广短帖明显较低；具体薪资、Remote 与 Visa 在当前样本中没有稳定正向互动关系。

`Job Post Checker` 在当前浏览器内离线运行，不访问外部接口。它分别计算互动证据分、信息完整度分和可读性分，并生成可复制的修改示例。薪资、Remote 和 Visa 只进入信息完整度；行业黑话和超长未分段只进入可读性检查，均不包装成互动预测。

页面背景照片来自 [Annie Spratt / Unsplash](https://unsplash.com/photos/QckxruozjRg)，按 Unsplash License 使用。数据叙事视觉参考 The Pudding、Reuters Graphics 与 Information is Beautiful，未复制其页面或视觉资产。

## 页面

打开 `index.html` 即可使用。新增帖子、评论、审核事件和报告版本会同步到 Firebase Firestore（香港区域 `asia-east2`），同时保留浏览器本地缓存与 JSON 导出。站点不设账号或角色权限；任何访问者都可查看和提交数据、执行审核，但不能物理删除云端记录。提交者以自行设置的别名标识。

## GitHub Pages

本仓库根目录即网站发布目录，`main` 分支启用 GitHub Pages 后可通过 `https://yuecongfu4-cell.github.io/hiring-post-observatory/` 访问。

本项目与 LinkedIn 没有隶属或合作关系。

## Firebase

Firebase 项目：`hiring-post-observatory`。Firestore 安全规则位于 `firestore.rules`，只允许追加记录、审核事件和冻结报告，不允许修改或删除已写入记录。
