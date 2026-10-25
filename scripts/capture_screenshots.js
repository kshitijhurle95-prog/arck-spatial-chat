const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve(__dirname, '../assets/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching headless Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2, // HiDPI retina capture
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // 1. Capture Auth Screen (Quantum Stark HUD)
    const authPath = path.join(SCREENSHOT_DIR, 'auth-quantum-hud.png');
    await page.screenshot({ path: authPath, fullPage: false });
    console.log('✓ Captured:', authPath);

    // 2. Perform Demo Login (Click "Alex Vance" demo profile card)
    console.log('Clicking Alex Vance demo card...');
    const alexBtn = await page.waitForSelector('button:has-text("Alex Vance"), button:has-text("Cyberneticist")', { timeout: 5000 }).catch(() => null);
    
    if (alexBtn) {
      await alexBtn.click();
    } else {
      // Fallback: fill inputs directly
      const inputs = await page.$$('input');
      if (inputs.length >= 2) {
        await inputs[0].type('alex_vance');
        await inputs[1].type('Nebula2046!');
      }
    }

    await new Promise((r) => setTimeout(r, 600));

    // Click Establish Session
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      console.log('Submitting session...');
      await submitBtn.click();
    }

    // Wait for main dashboard to mount
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 3500));

    // 3. Hero Preview (Main Spatial Workspace / Dashboard)
    const heroPath = path.join(SCREENSHOT_DIR, 'hero-preview.png');
    await page.screenshot({ path: heroPath, fullPage: false });
    console.log('✓ Captured:', heroPath);

    // 4. Feature Interaction: Select first chat conversation
    console.log('Interacting with chat stream...');
    const chatItems = await page.$$('button');
    for (const btn of chatItems) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.includes('General') || text.includes('Elena') || text.includes('Design') || text.includes('Quantum'))) {
        await btn.click();
        break;
      }
    }

    await new Promise((r) => setTimeout(r, 2000));

    // Open AI Copilot or type in composer
    const composer = await page.$('textarea, input[placeholder*="message"]');
    if (composer) {
      await composer.type('Quantum mesh relays locked and synchronized. Ready for mission briefing.');
    }

    const featurePath = path.join(SCREENSHOT_DIR, 'feature-interaction.png');
    await page.screenshot({ path: featurePath, fullPage: false });
    console.log('✓ Captured:', featurePath);

    // 5. Dark Mode Preview
    const themeBtn = await page.$('button[title*="Theme"], button[aria-label*="Theme"], aside button:has(svg)');
    if (themeBtn) {
      console.log('Toggling theme to dark mode...');
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      });
      await new Promise((r) => setTimeout(r, 1000));

      const darkPath = path.join(SCREENSHOT_DIR, 'dark-mode-preview.png');
      await page.screenshot({ path: darkPath, fullPage: false });
      console.log('✓ Captured:', darkPath);
    }

    console.log('All screenshots successfully generated!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
