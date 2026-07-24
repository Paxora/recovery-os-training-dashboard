# Recovery OS Training Dashboard

手机优先的 Recovery OS 训练 Dashboard，沿用既有报告型视觉语言，只服务于训练现场执行、记录与回看。

## 功能

- 今日训练卡、逐项完成进度
- 每组重量、次数和组间休息记录
- 新动作的可点击中文教学视频
- 训练后 Energy、身体反馈和备注
- Apple Watch 截图拍摄或上传，本地 OCR 后确认保存
- 云端训练历史
- 本地草稿自动保存；正式提交后写入云端数据库
- 现场安全停止条件

## 在线地址

- Dashboard: https://recovery-os-training-dashboard.panaker.chatgpt.site
- GitHub: https://github.com/Paxora/recovery-os-training-dashboard

## 本地开发

```bash
npm install
npm run dev
```

## 验证

```bash
npm run build
node --test tests/rendered-html.test.mjs
```

GitHub 保存项目源码；线上 Dashboard 由 OpenAI Sites 承载，并使用 Cloudflare D1 保存正式训练记录。
