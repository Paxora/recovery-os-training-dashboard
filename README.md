# Recovery OS Training Dashboard

手机优先的 Recovery OS 训练 Dashboard，采用固定报告版式，只用于今日训练现场执行和训练历史查看。

## 在线访问

https://paxora.github.io/recovery-os-training-dashboard/

## 当前内容

- 今日训练卡与完成进度
- 动作组数、次数和组间休息
- 新动作的中文教学视频直达链接
- 本次重量记录
- 安全停止条件
- 云端训练历史

训练现场草稿保存在当前浏览器；点击“结束并保存”后，训练动作记录保存到 Cloudflare D1。

## 训练计划同步

`training-plan.json` 是当前训练计划的唯一事实源。

Recovery OS 主入口在用户明确确认训练计划后：

1. 读取仓库中现有的 `training-plan.json`。
2. 只写入已经确认的训练计划，不写入讨论中的草案。
3. 新动作必须保留可点击的中文教学视频链接。
4. 更新 `planId`、`sessionLabel`、`updatedAt` 和 `exercises` 后提交到 `main`。

Dashboard 会在首次打开、重新回到前台以及使用期间每 60 秒自动读取该文件。计划更新不会覆盖已经填写的同名动作草稿；已删除动作的草稿会随计划移除。
