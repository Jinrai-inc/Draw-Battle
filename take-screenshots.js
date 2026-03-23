const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome';

const devices = [
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

const screens = [
  { name: 'draw', path: '/(tabs)/draw' },
  { name: 'battle', path: '/(tabs)/battle' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  for (const device of devices) {
    console.log(`\n=== Device: ${device.name} ===`);

    const page = await browser.newPage();
    await page.setViewport({
      width: Math.floor(device.width / device.deviceScaleFactor),
      height: Math.floor(device.height / device.deviceScaleFactor),
      deviceScaleFactor: device.deviceScaleFactor,
    });

    for (const screen of screens) {
      // Use ?screenshot=1 to bypass auth guard
      const url = `http://localhost:8081${screen.path}?screenshot=1`;
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      await new Promise(r => setTimeout(r, 4000));

      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);

      const filePath = path.join(__dirname, 'screenshots', `${device.name}_${screen.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved: ${filePath}`);
    }

    await page.close();
  }

  await browser.close();
  console.log('\nDone!');
})();
