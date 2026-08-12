# 云端同步版 · 部署指南（永久 24/7 可用）

本目录是一个**零依赖 Node.js 同步后端 + 学习计划器前端**。部署后，你和任何设备（手机 / 另一台电脑）用同一个网址打开，进度、笔记、操作历史就会实时云端同步。

## 目录结构
```
cloud-sync/
├── server.js          # 同步后端（零依赖，存 ./data/<同步码>.json）
├── package.json       # npm start -> node server.js
├── public/index.html  # 学习计划器（云端同步版）
├── cloudflared.exe    # 仅本地临时隧道用，部署时不需
└── DEPLOY.md          # 本文件
```

## 方式一：部署到 Render（推荐，免费，约 5 分钟）
1. 把 `cloud-sync/` 整个文件夹推到一个 GitHub 仓库（新建仓库，把 server.js / package.json / public/ 传上去即可）。
2. 打开 https://render.com → 注册（可用 GitHub 登录）→ 右上角 **New** → **Web Service** → 关联你的仓库。
3. 配置：
   - **Runtime**: Node
   - **Build Command**: `npm install`（可留空）
   - **Start Command**: `node server.js`
   - **Plan**: Free
4. 点 **Create Web Service**，等待约 1–2 分钟，得到网址如 `https://ai-planner-xxxx.onrender.com`。
5. 用手机和电脑都打开这个网址 → 完成。点顶部「复制同步链接」发给另一台设备即可对齐数据。

> 免费版说明：Render 免费实例 15 分钟无访问会休眠，下次访问自动唤醒（首次慢 30–60 秒，前端会自动重连）。文件存于实例磁盘，不重新部署则长期保留；即使云端偶尔清空，你的每台设备本地仍有缓存，打开后会自动把本地数据重新推回云端，不会丢。

## 方式二：部署到 Railway / Fly.io（同样免费额度）
- Railway：New Project → Deploy from GitHub → 选本仓库 → 默认识别 Node，Start 填 `node server.js`。
- Fly.io：装 `flyctl` 后 `fly launch`（端口选 3000）→ `fly deploy`。需要绑一张卡（仅验证，免费额度内不扣费）。

## 方式三：自己有服务器（VPS / 群晖 / 内网穿透）
- 把目录拷过去，`node server.js`（建议用 `pm2` 或 `systemd` 守护）。
- 用 Nginx 反代 3000 端口并配 HTTPS 域名。
- 打开 `https://你的域名/` 即可。

## 本地临时自测（同一台机器）
```
cd cloud-sync
node server.js        # 需 Node 16+
# 浏览器打开 http://localhost:3000
```
注意：localhost 只在本机有效，做不到跨设备，仅用于开发验证。

## 前端怎么找到后端？
- 默认**同源**：页面由 `server.js` 托管（部署后同一个网址），自动走 `/api/*`，无需任何配置。
- 高级：如果你把 `public/index.html` 单独托管到别处（比如静态页），在网址后加 `?api=https://你的后端/api` 指定同步后端即可。

## 数据安全
- 同步码（URL 里的 `sync=xxxx`）就是云端的存储键，知道这个链接的人都能读写这份数据。不要把链接发给不信任的人。
- 数据以纯 JSON 存于后端 `./data/`，你可随���备份该目录。
- 本工具是学习用途，不建议存敏感隐私信息。
