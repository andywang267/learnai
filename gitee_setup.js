// Gitee 一键部署脚本：用 Gitee token 自动建页面仓库(公开)+同步仓库(私有)并推入 index.html
// 用法：GITEE_TOKEN=xxx node gitee_setup.js
const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.GITEE_TOKEN;
if (!TOKEN) { console.error('缺少 GITEE_TOKEN 环境变量'); process.exit(1); }
const OWNER = process.env.GITEE_OWNER; // 可选，默认从 /user 取
const PAGE_REPO = 'ai-planner';
const SYNC_REPO = 'ai-planner-sync';
const HTML_PATH = process.argv[2] || path.join(__dirname, 'public', 'index.html');

function req(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opt = {
      hostname: 'gitee.com', path: '/api/v5' + apiPath, method,
      headers: { 'Authorization': 'token ' + TOKEN, 'Accept': 'application/json', 'Content-Type': 'application/json' }
    };
    const r = https.request(opt, res => {
      let s = ''; res.on('data', d => s += d);
      res.on('end', () => {
        let j = null; try { j = JSON.parse(s); } catch (e) {}
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(j);
        else reject(new Error(method + ' ' + apiPath + ' -> ' + res.statusCode + ' ' + (j && j.message || s.slice(0, 200))));
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}
const b64 = s => Buffer.from(s, 'utf8').toString('base64');

(async () => {
  let owner = OWNER;
  if (!owner) owner = (await req('GET', '/user')).login;
  console.log('owner =', owner);

  // 1) 页面仓库（公开）
  try { await req('POST', '/user/repos', { name: PAGE_REPO, private: false, auto_init: true, description: 'andy老师 AI学习计划器（云端同步版）' }); console.log('页面仓库已建/已存在:', PAGE_REPO); }
  catch (e) { console.log('页面仓库:', e.message); }

  // 2) 同步仓库（私有）
  try { await req('POST', '/user/repos', { name: SYNC_REPO, private: true, auto_init: true, description: 'AI学习计划器云端同步数据' }); console.log('同步仓库已建/已存在:', SYNC_REPO); }
  catch (e) { console.log('同步仓库:', e.message); }

  // 3) 推送 index.html 到页面仓库 master 根目录
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  try {
    await req('POST', `/repos/${owner}/${PAGE_REPO}/contents/index.html`, { message: 'init planner', content: b64(html), branch: 'master' });
    console.log('index.html 已推送到', PAGE_REPO);
  } catch (e) {
    // 已存在则更新（需 sha）
    try {
      const cur = await req('GET', `/repos/${owner}/${PAGE_REPO}/contents/index.html?ref=master`);
      await req('PUT', `/repos/${owner}/${PAGE_REPO}/contents/index.html`, { message: 'update planner', content: b64(html), sha: cur.sha, branch: 'master' });
      console.log('index.html 已更新到', PAGE_REPO);
    } catch (e2) { console.log('推送 index.html 失败:', e2.message); }
  }

  console.log('\n=== 下一步（用户手动）===');
  console.log('1) 打开 https://gitee.com/' + owner + '/' + PAGE_REPO + '/pages');
  console.log('2) 部署来源选 master 分支 / 根目录，点「启动」');
  console.log('3) 等待 1-2 分钟，访问 https://' + owner + '.gitee.io/' + PAGE_REPO + '/');
  console.log('4) 手机打开该网址 → 点「立即同步」→ 粘贴 Gitee token（projects 权限）→ 自动建云端笔记本');
  console.log('5) 复制同步链接发另一台设备');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
