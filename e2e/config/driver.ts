import { Builder, WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

// Selenium 4.x uses selenium-manager to auto-download the correct chromedriver

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const HEADLESS = process.env.HEADLESS !== 'false';

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

export function getBaseUrl(): string {
  return BASE_URL;
}
