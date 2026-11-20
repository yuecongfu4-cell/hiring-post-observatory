# 职帖观察站

本版本使用浏览器内置 IndexedDB 保存大型本机工作区，单类记录导入上限为 100,000 行；整理样本随站点内置，因此 Firebase 读取配额耗尽时仍能查看完整数据。Firebase Firestore 继续用于跨设备新增记录与审核状态同步。

2026-11-20 的容量验收覆盖 20,000 条新增帖子：系统 Chrome 中 IndexedDB 写入约 45 ms、读取约 24 ms；导入校验、数据集构建、统计计算和共享记录合并均完成于约 2 秒内。Firestore 是逐条追加写入的共享存储，首次上传大量记录可能需要较长时间，但同步在后台进行，不阻塞页面分析。

一个可离线运行的招聘帖研究网站，支持简体中文、繁体中文和英文。

## 页面

打开 `index.html` 即可使用。新增帖子、评论、审核事件和报告版本会同步到 Firebase Firestore（香港区域 `asia-east2`），同时保留浏览器本地缓存与 JSON 导出。站点不设账号或角色权限；任何访问者都可查看和提交数据、执行审核，但不能物理删除云端记录。提交者以自行设置的别名标识。

## GitHub Pages

本仓库根目录即网站发布目录，`main` 分支启用 GitHub Pages 后可通过 `https://yuecongfu4-cell.github.io/hiring-post-observatory/` 访问。

本项目与 LinkedIn 没有隶属或合作关系。

## Firebase

Firebase 项目：`hiring-post-observatory`。Firestore 安全规则位于 `firestore.rules`，只允许追加记录、审核事件和冻结报告，不允许修改或删除已写入记录。
