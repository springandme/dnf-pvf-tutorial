const express = require('express');
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const app = express();
const port = process.env.PORT || 3000;

const MEDIA_CACHE_DIR = path.join(__dirname, 'media-cache');
const PROXY_CACHE_DIR = path.join(MEDIA_CACHE_DIR, 'proxy');

// 教程图片的源站（DAF 论坛）。教程 JSON 中的图片都是 /media/uploads/... 相对路径，
// 首次访问时从这里拉取并落盘到 media-cache/media/，之后全部走本地缓存。
const DAF_ORIGIN = 'https://daf.linglonger.com';

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Root path redirect to main tutorial page
app.get('/', (req, res) => {
  res.redirect('/dnf_pvf_tutorial.html');
});

// Serve tutorial images that have been restored locally (media-cache/media/...)
app.use('/media', express.static(path.join(MEDIA_CACHE_DIR, 'media')));

// Fallback for /media/uploads/...: fetch from the DAF origin on first request
// and persist to media-cache so later requests are served from disk.
const MEDIA_CONTENT_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};
const mediaInflight = new Map();

app.use('/media', (req, res) => {
  // 只代理白名单前缀，避免变成开放代理
  const relPath = decodeURIComponent(req.path.replace(/^\/+/, ''));
  if (!relPath.startsWith('uploads/') || relPath.includes('..')) {
    return res.status(404).send('not found');
  }

  const contentType = MEDIA_CONTENT_TYPES[path.extname(relPath).toLowerCase()];
  if (!contentType) {
    return res.status(404).send('unsupported media type');
  }

  const target = `${DAF_ORIGIN}/media/${relPath}`;
  const cacheFile = path.join(MEDIA_CACHE_DIR, 'media', relPath);

  const fetchAndCache = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const upstream = await fetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      if (!upstream.ok) {
        throw Object.assign(new Error(`upstream ${upstream.status}`), { statusCode: upstream.status });
      }
      return Buffer.from(await upstream.arrayBuffer());
    } finally {
      clearTimeout(timer);
    }
  };

  (async () => {
    try {
      let buf;
      let inflight = mediaInflight.get(target);
      if (inflight) {
        // 并发请求同一张图时复用同一次下载
        buf = await inflight;
      } else {
        const p = fetchAndCache().then(async (b) => {
          // 落盘失败不影响返回（例如容器内目录只读）
          try {
            fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
            fs.writeFileSync(cacheFile, b);
          } catch (e) { /* ignore cache write errors */ }
          return b;
        });
        mediaInflight.set(target, p);
        try {
          buf = await p;
        } finally {
          mediaInflight.delete(target);
        }
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=604800');
      res.send(buf);
    } catch (err) {
      const code = err.statusCode === 404 ? 404 : 502;
      res.status(code).send(`media fetch failed: ${err.message}`);
    }
  })();
});

// Referer hints for hosts with hotlink protection
const REFERER_BY_HOST = [
  { match: /(^|\.)baidu\.com$|(^|\.)bdstatic\.com$|(^|\.)bdimg\.com$/, referer: 'https://www.baidu.com/' },
  { match: /(^|\.)bilibili\.com$|(^|\.)biliapi\.net$/, referer: 'https://www.bilibili.com/' },
  { match: /(^|\.)colg\.cn$/, referer: 'https://bbs.colg.cn/' },
];

// Proxy remote images server-side: bypasses mixed-content blocks and adds a
// Referer for hotlink-protected hosts. Successful responses are cached on disk.
app.get('/api/image-proxy', async (req, res) => {
  const rawUrl = req.query.url;
  if (!rawUrl) {
    return res.status(400).send('url is required');
  }

  let target;
  try {
    target = new URL(rawUrl);
  } catch (e) {
    return res.status(400).send('invalid url');
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return res.status(400).send('unsupported protocol');
  }

  const cacheKey = Buffer.from(target.href).toString('base64url')
    .replace(/-/g, '_').replace(/~/g, '__');
  const cacheFile = path.join(PROXY_CACHE_DIR, cacheKey);
  const metaFile = cacheFile + '.meta';

  const sendCached = () => {
    try {
      const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      res.setHeader('Content-Type', meta.contentType || 'application/octet-stream');
    } catch (e) { /* fall through with default type */ }
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.sendFile(cacheFile);
  };

  try {
    if (fs.existsSync(cacheFile)) {
      return sendCached();
    }

    const refererEntry = REFERER_BY_HOST.find(r => r.match.test(target.hostname));
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    };
    if (refererEntry) {
      headers.Referer = refererEntry.referer;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const upstream = await fetch(target.href, { headers, signal: controller.signal, redirect: 'follow' });
    clearTimeout(timer);

    if (!upstream.ok) {
      return res.status(502).send(`upstream ${upstream.status}`);
    }
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    if (!contentType.startsWith('image/') && contentType !== 'application/octet-stream') {
      return res.status(415).send(`not an image: ${contentType}`);
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    fs.mkdirSync(PROXY_CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, buf);
    fs.writeFileSync(metaFile, JSON.stringify({ contentType, url: target.href }));
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800');
    return res.send(buf);
  } catch (err) {
    res.status(502).send('fetch failed');
  }
});

// API endpoint to get the list of .json files
app.get('/api/files', async (req, res) => {
  try {
    const files = await glob('pvfCourse/**/*.json', { cwd: __dirname });
    const fileData = files.map(file => ({
      path: file,
      name: path.basename(file),
    }));
    res.json(fileData);
  } catch (err) {
    res.status(500).send('Error scanning files');
  }
});

// API endpoint to get the content of a specific file
app.get('/api/content', (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).send('File path is required');
  }

  // Security: Ensure the path is within the pvfCourse directory
  const safeBasePath = path.resolve(path.join(__dirname, 'pvfCourse'));
  const requestedPath = path.resolve(path.join(__dirname, filePath));

  if (!requestedPath.startsWith(safeBasePath)) {
    return res.status(403).send('Access denied');
  }

  fs.readFile(requestedPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).send('File not found');
    }
    try {
      const jsonContent = JSON.parse(data);
      res.json(jsonContent);
    } catch (parseErr) {
      res.status(500).send('Error parsing JSON file');
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});