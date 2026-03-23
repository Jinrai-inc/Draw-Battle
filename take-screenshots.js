const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome';

const screenshots = [
  {
    name: 'iphone_6.5inch',
    width: 1284,
    height: 2778,
    deviceScaleFactor: 3,
  },
  {
    name: 'ipad_13inch',
    width: 2048,
    height: 2732,
    deviceScaleFactor: 2,
  },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  for (const config of screenshots) {
    console.log(`Taking screenshot: ${config.name} (${config.width}x${config.height})`);

    const page = await browser.newPage();
    await page.setViewport({
      width: Math.floor(config.width / config.deviceScaleFactor),
      height: Math.floor(config.height / config.deviceScaleFactor),
      deviceScaleFactor: config.deviceScaleFactor,
    });

    await page.goto('http://localhost:8081', { waitUntil: 'networkidle0', timeout: 60000 });

    // Wait extra time for animations/rendering
    await new Promise(r => setTimeout(r, 3000));

    const filePath = path.join(__dirname, 'screenshots', `${config.name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`Saved: ${filePath}`);

    await page.close();
  }

  await browser.close();
  console.log('Done!');
})();
