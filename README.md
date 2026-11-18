# 职帖观察站

一个可离线运行的招聘帖研究网站，支持简体中文、繁体中文和英文。

## 页面

打开 `index.html` 即可使用。新增帖子、评论、审核事件和报告版本会同步到 Firebase Firestore（香港区域 `asia-east2`），同时保留浏览器本地缓存与 JSON 导出。站点不设账号或角色权限；任何访问者都可查看和提交数据、执行审核，但不能物理删除云端记录。提交者以自行设置的别名标识。

## GitHub Pages

本仓库根目录即网站发布目录，`main` 分支启用 GitHub Pages 后可通过 `https://yuecongfu4-cell.github.io/hiring-post-observatory/` 访问。

本项目与 LinkedIn 没有隶属或合作关系。

## Firebase

Firebase 项目：`hiring-post-observatory`。Firestore 安全规则位于 `firestore.rules`，只允许追加记录、审核事件和冻结报告，不允许修改或删除已写入记录。
