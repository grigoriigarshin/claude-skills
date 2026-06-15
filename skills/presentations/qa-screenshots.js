#!/usr/bin/env node
// Usage: node qa-screenshots.js /path/to/deck.html [output-dir]
// Takes a screenshot of every slide and saves them as slide-01.png, slide-02.png, …

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const htmlPath = process.argv[2];
if (!htmlPath) { console.error('Usage: node qa-screenshots.js deck.html [out-dir]'); process.exit(1); }

const outDir = process.argv[3] || path.join(path.dirname(htmlPath), 'qa-screenshots');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const fileUrl = 'file://' + path.resolve(htmlPath);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Count slides
  const total = await page.evaluate(() => document.querySelectorAll('.slide').length);
  console.log(`Found ${total} slides`);

  for (let i = 0; i < total; i++) {
    // Activate slide i by index
    await page.evaluate((idx) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach((s, j) => s.classList.toggle('active', j === idx));
    }, i);

    await new Promise(r => setTimeout(r, 120)); // let blobs/transitions settle

    const num = String(i + 1).padStart(2, '0');
    const file = path.join(outDir, `slide-${num}.png`);
    await page.screenshot({ path: file });
    console.log(`  saved slide-${num}.png`);
  }

  await browser.close();
  console.log(`\nDone → ${outDir}`);
})();
