#!/usr/bin/env node

/**
 * DAF 教程图片镜像脚本
 *
 * 扫描 pvfCourse 下所有教程 JSON，把内容中引用的 /media/uploads/... 图片
 * 从源站（https://daf.linglonger.com）批量下载到 media-cache/media/，
 * 这样线上无需等待首次访问即可全部走本地缓存。
 *
 * 用法：node scripts/mirror-daf-media.js [--concurrency=8] [--force]
 *   --concurrency  并发下载数，默认 8
 *   --force         已存在的文件也重新下载
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const DAF_ORIGIN = 'https://daf.linglonger.com';
const ROOT = path.join(__dirname, '..');
const MEDIA_DIR = path.join(ROOT, 'media-cache', 'media');

const args = process.argv.slice(2);
const concurrency = parseInt((args.find(a => a.startsWith('--concurrency=')) || '').split('=')[1], 10) || 8;
const force = args.includes('--force');

function collectMediaUrls() {
  const urls = new Set();
  const pattern = /src=\\?"(\/media\/uploads\/[^\\"]+?)\\?"/g;
  return glob('pvfCourse/**/*.json', { cwd: ROOT }).then(files => {
    for (const file of files) {
      let content;
      try {
        content = fs.readFileSync(path.join(ROOT, file), 'utf8');
      } catch (e) {
        continue;
      }
      let m;
      while ((m = pattern.exec(content)) !== null) {
        urls.add(m[1]);
      }
    }
    return [...urls];
  });
}

async function fetchImage(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(DAF_ORIGIN + url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      if (!res.ok) {
        throw new Error(`upstream ${res.status}`);
      }
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
}

async function main() {
  console.log('扫描教程 JSON 中的图片引用...');
  const urls = await collectMediaUrls();
  console.log(`共发现 ${urls.length} 个唯一图片地址，并发 ${concurrency}${force ? '（强制重新下载）' : ''}`);

  let done = 0, ok = 0, skip = 0, fail = 0;
  const failures = [];
  const queue = [...urls];

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      const cacheFile = path.join(MEDIA_DIR, url.replace(/^\/media\//, ''));
      done++;

      if (!force && fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 0) {
        skip++;
      } else {
        try {
          const buf = await fetchImage(url);
          fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
          fs.writeFileSync(cacheFile, buf);
          ok++;
        } catch (err) {
          fail++;
          failures.push(`${url} -> ${err.message}`);
        }
      }

      if (done % 50 === 0 || queue.length === 0) {
        console.log(`进度 ${done}/${urls.length}：下载 ${ok}，跳过 ${skip}，失败 ${fail}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));

  if (failures.length > 0) {
    const logFile = path.join(ROOT, 'media-cache', 'mirror-failures.log');
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.writeFileSync(logFile, failures.join('\n'), 'utf8');
    console.log(`\n${fail} 个下载失败，详见 ${logFile}（可重跑本脚本断点续传）`);
  } else {
    // 全部成功时清掉旧失败记录，避免误导
    try { fs.unlinkSync(path.join(ROOT, 'media-cache', 'mirror-failures.log')); } catch (e) { /* ignore */ }
  }
  console.log(`\n完成：成功 ${ok}，跳过 ${skip}，失败 ${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('镜像脚本执行失败:', err);
  process.exit(1);
});
