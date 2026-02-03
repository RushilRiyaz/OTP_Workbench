import { Builder, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

// Selenium 4.x uses selenium-manager to auto-download the correct chromedriver

const HEADLESS = process.env.HEADLESS !== 'false';
const POSSIBLE_PORTS = [3000, 3001, 3002];

let detectedBaseUrl: string | null = null;

async function detectServerPort(): Promise<string> {
  // If BASE_URL is explicitly set, use it
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }

  // Try each port to find the running server
  for (const port of POSSIBLE_PORTS) {
    try {
      const url = `http://localhost:${port}`;
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok || response.status === 404) {
        console.log(`  Server detected on port ${port}`);
        return url;
      }
    } catch {
      // Port not available, try next
    }
  }

  // Fallback to default
  console.log('  No server detected, using default port 3000');
  return 'http://localhost:3000';
}

export async function createDriver(): Promise<WebDriver> {
  const options = new chrome.Options();

  if (HEADLESS) {
    options.addArguments('--headless=new');
  }

  // CI-friendly options
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1920,1080');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  // Set implicit wait for element finding
  await driver.manage().setTimeouts({ implicit: 5000 });

  return driver;
}

export async function getBaseUrl(): Promise<string> {
  if (!detectedBaseUrl) {
    detectedBaseUrl = await detectServerPort();
  }
  return detectedBaseUrl;
}
