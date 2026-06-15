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

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 导入该仓库
3. 在环境变量中添加 `BILI_SESSDATA`
4. 部署

> SESSDATA 有时效，过期后需在 Vercel 项目设置中更新。

## 项目结构

```
├── api/index.js        # Vercel 入口
├── server.js           # Express 服务端
├── src/bili-api.js     # B站字幕爬取
├── public/             # 前端页面
├── vercel.json         # Vercel 配置
└── .env.example        # 配置模板
```

## 技术栈

Node.js + Express + 原生前端
