# OpsFlare

一个轻量化的 CloudFlare 辅助管理工具，专为运维人员设计，提供多账户管理、域名管理、DNS 记录管理、SSL 配置以及域名安全检测等功能。

## ✨ 功能特性

### 多账户管理
- 支持添加、导入、导出多个 CloudFlare 账户
- 账户信息加密存储在本地 localStorage
- 快速切换不同账户

### 域名管理
- 查看账户下所有域名列表
- 批量添加域名到 CloudFlare
- 域名多选功能，支持批量操作
- 查看域名名称服务器
- 一键复制名称服务器地址
- 域名状态显示（启用、待激活、初始化中等）

### 批量操作
- 支持多选域名进行批量操作
- 批量添加 DNS 解析记录到多个域名
- 批量操作结果统计和反馈

### SSL/TLS 管理
- 查看当前域名的 SSL/TLS 加密模式
- 支持修改加密模式：关闭、灵活、完全、完全（严格）

### DNS 记录管理
- 查看域名的 A 记录解析列表
- 添加新的 A 记录
- 编辑现有 A 记录

### 域名安全检测
- 集成 Google Safe Browsing API
- 批量检测所有域名的安全性
- 支持检测多种威胁类型：
  - MALWARE（恶意软件）
  - SOCIAL_ENGINEERING（社会工程学攻击/钓鱼）
  - UNWANTED_SOFTWARE（不需要的软件）
  - POTENTIALLY_HARMFUL_APPLICATION（潜在有害应用）
- 域名列表中实时显示安全状态图标：
  - 🛡️ 未检测
  - 🔄 检测中（带动画）
  - ✅ 安全
  - ⚠️ 有风险（鼠标悬停查看详细威胁信息）
- 安全检测统计面板

### 主题切换
- 自动跟随系统深色/浅色模式
- 支持手动切换主题
- 平滑的主题过渡动画

### 密码保护
- 应用启动时需要输入访问密码
- 密码验证通过后记录在本地，下次无需重新输入

## 🛠 技术栈

- **前端框架**: Next.js 15 + React 19
- **UI 组件**: shadcn/ui + Tailwind CSS 3
- **状态管理**: Zustand (带持久化)
- **主题管理**: next-themes
- **数据加密**: crypto-js
- **图标**: lucide-react
- **通知提示**: sonner
- **部署**: Cloudflare Workers

## 📦 开发准备

### 环境要求

- Node.js 20+
- pnpm (推荐) 或 npm

### 安装依赖

```bash
pnpm install
```

### 环境变量配置

在 `.dev.vars` 文件中配置访问密码：

```
NEXTJS_ENV=development
ACCESS_PASSWORD=your-password-here
```

在生产环境中，你需要在 Cloudflare Workers 中设置环境变量 `NEXT_PUBLIC_ACCESS_PASSWORD`。

## 🚀 开发

运行开发服务器：

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 👀 本地预览（Cloudflare Runtime）

在本地 Cloudflare Runtime 环境中预览应用：

```bash
pnpm preview
```

## 📤 部署到 Cloudflare

### 首次部署

```bash
pnpm deploy
```

### 设置环境变量

在 Cloudflare Dashboard 中为你的 Worker 添加环境变量：

```
NEXT_PUBLIC_ACCESS_PASSWORD=your-password-here
```

或使用命令行：

```bash
wrangler secret put NEXT_PUBLIC_ACCESS_PASSWORD
```

## 📖 使用指南

### 1. 登录

首次访问应用时，输入在环境变量中配置的访问密码。

### 2. 添加 CloudFlare 账户

1. 点击左侧"账户列表"上方的"+"按钮
2. 输入 CloudFlare 账户的 Email 和 API Key
3. API Key 可以在 CloudFlare Dashboard 的"My Profile" > "API Tokens" > "Global API Key"中获取

### 3. 管理域名

1. 在左侧选择一个账户
2. 点击"域名列表"上方的"+"按钮批量添加域名
3. 每行输入一个域名，然后点击"添加"

### 4. 配置域名

1. 在域名列表中点击一个域名
2. 右侧会显示域名详情
3. 复制名称服务器到域名注册商处
4. 配置 SSL/TLS 加密模式
5. 添加或编辑 DNS A 记录

### 5. 批量操作

1. 在域名列表中勾选多个域名的复选框
2. 右侧会显示批量操作界面
3. 填写 DNS 记录信息后点击"添加记录"按钮
4. 系统会为所有选中的域名添加相同的 DNS 记录

### 6. 域名安全检测

1. 在右上角点击"设置"按钮
2. 输入 Google Safe Browsing API Key（可在 [Google Cloud Console](https://console.cloud.google.com/) 中创建）
3. 当没有选中域名时，右侧会显示批量安全检测面板
4. 点击"批量检测"按钮检测所有域名
5. 检测结果会实时显示在域名列表中，鼠标悬停在图标上查看详情

## 🔒 数据安全

- 所有账户信息（Email、API Key）都使用 AES 加密后存储在浏览器的 localStorage 中
- 加密密钥内置在代码中，建议部署时修改 `src/lib/encryption.ts` 中的 `ENCRYPTION_KEY`
- 数据仅存储在本地，不会上传到任何服务器
- Google Safe Browsing API Key 也存储在本地加密存储中

## ⚠️ 注意事项

- 本工具仅用于辅助管理 CloudFlare 账户，请妥善保管 API Key
- 批量添加域名时请确保域名格式正确
- SSL/TLS 设置和 DNS 记录修改会立即生效，请谨慎操作
- Google Safe Browsing API 有请求限制，请合理使用
- 批量操作会依次处理每个域名，大量域名可能需要较长时间

## 🎨 界面预览

应用支持自动深色/浅色模式切换，界面简洁美观：

- 左侧边栏：账户列表和域名列表
- 右侧主区域：域名详情、批量操作或安全检测面板
- 右上角：主题切换和设置按钮

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🔗 相关链接

- [CloudFlare API 文档](https://developers.cloudflare.com/api/)
- [Google Safe Browsing API](https://developers.google.com/safe-browsing/v4)
- [Next.js 文档](https://nextjs.org/docs)
- [shadcn/ui 组件](https://ui.shadcn.com/)
