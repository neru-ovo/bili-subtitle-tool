# B站字幕获取工具

输入B站视频链接，自动获取字幕文本并支持下载为 `.txt` 文件。

## 功能

- 支持 UP主上传字幕 和 AI自动生成字幕
- 一键下载字幕为 `.txt` 文件
- 支持复制全文

## 快速开始

### 配置

在项目目录创建 `.env` 文件：

```bash
cp .env.example .env
```

填入你的 B站登录凭证：

```env
BILI_SESSDATA=你的SESSDATA值
```

> **如何获取 SESSDATA：**
> 1. 浏览器打开 `https://www.bilibili.com` 并登录
> 2. 按 F12 → Application → Cookies → `bilibili.com`
> 3. 复制 `SESSDATA` 的值

### 本地运行

```bash
npm install
npm start
```

打开 `http://localhost:3000`

## 部署到 Cloudflare Pages

本项目 API 依赖 Cloudflare Pages Functions（`functions/api/`），**不能只部署 `public` 静态目录**。

### 构建设置（重要）

你的 Cloudflare 界面是 **新版 Workers Builds**，没有单独的「构建输出目录」字段。静态输出目录在 `wrangler.toml` 里配置（`pages_build_output_dir = "./public"`），通过 **部署命令** 生效。

在 **设置 → 构建 → 构建配置**（点铅笔图标编辑）中填写：

| 配置项 | 正确值 | 说明 |
|--------|--------|------|
| 构建命令 | 留空 | 或 `echo 'no build needed'` |
| **部署命令** | `npx wrangler pages deploy` | **不要用 `echo 'deploy done'`** |
| 版本命令 | 留空 | 或 `echo 'no build needed'` |
| **根目录** | `/` | 表示仓库根目录，保持现状即可 |

> **构建监视路径**（显示 `包括所有路径`）只控制「哪些文件改动会触发重建」，**不是**输出目录，不用改。

> 若部署命令只是 `echo`，Cloudflare 不会上传 `public/` 和 `functions/`，`/api/subtitle` 就会 404。

### 环境变量（重要）

`BILI_SESSDATA` 必须配置在 **设置 → 环境变量**（运行时变量），不能只放在「构建变量」里。

1. 进入 **设置 → 环境变量**
2. 为 **Production**（建议 Preview 也加）添加：`BILI_SESSDATA` = 你的 SESSDATA 值
3. 保存后重新部署

部署后可用 `https://你的域名/api/status` 检查：`biliLoggedIn` 应为 `true`。

### 命令行部署

```bash
npm run deploy
```

> SESSDATA 有时效，过期后需在 Cloudflare 项目设置中更新。

## 项目结构

```
├── functions/api/      # Cloudflare Pages Functions（/api/subtitle、/api/status）
├── server.js           # Express 本地开发服务端
├── src/bili-api.js     # B站字幕爬取（本地开发用）
├── public/             # 前端静态页面
├── wrangler.toml       # Cloudflare 配置
└── .env.example        # 配置模板
```

## 技术栈

Node.js + Express + 原生前端
