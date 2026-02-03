import { By, WebDriver, until } from 'selenium-webdriver';
import { getBaseUrl } from '../config/driver';

export class HomePage {
  private driver: WebDriver;
  private baseUrl: string;

  constructor(driver: WebDriver) {
    this.driver = driver;
    this.baseUrl = getBaseUrl();
  }

  async navigate(): Promise<void> {
    await this.driver.get(this.baseUrl);
    // Wait for page to be interactive
    await this.driver.wait(until.elementLocated(By.css('body')), 10000);
    // Wait for main content to load
    await this.driver.sleep(1000);
  }

  async isParameterAreaVisible(): Promise<boolean> {
    try {
      // ParameterArea uses aside element with "Parameter area" header
      const sidebar = await this.driver.findElement(By.css('aside'));
      return await sidebar.isDisplayed();
    } catch {
      return false;
    }
  }

  async clickCollapseButton(): Promise<void> {
    // Collapse button has title="Collapse" or title="Expand"
    const button = await this.driver.findElement(
      By.css('aside button[title="Collapse"], aside button[title="Expand"]')
    );
    await button.click();
  }

  async getTabCount(): Promise<number> {
    // Tabs are buttons inside a div with flex border-b
    const tabs = await this.driver.findElements(
      By.css('div.flex.border-b button')
    );
    return tabs.length;
  }

  async getActiveTabName(): Promise<string> {
    try {
      // Active tab has border-blue-500 class
      const activeTab = await this.driver.findElement(
        By.css('div.flex.border-b button.border-blue-500')
      );
      return await activeTab.getText();
    } catch {
      return '';
    }
  }

  async clickTab(name: string): Promise<void> {
    const tab = await this.driver.findElement(
      By.xpath(`//div[contains(@class, 'border-b')]//button[contains(text(), '${name}')]`)
    );
    await tab.click();
  }

  async getSelectedEnvironment(): Promise<string> {
    // Environment buttons - selected one has border-blue-500 bg-blue-50
    const selected = await this.driver.findElement(
      By.css('button.border-blue-500.bg-blue-50 span, button[class*="border-blue-500"][class*="bg-blue-50"] span')
    );
    return await selected.getText();
  }

  async selectEnvironment(name: string): Promise<void> {
    // Find environment button by text content
    const button = await this.driver.findElement(
      By.xpath(`//button[.//span[contains(text(), '${name}')]]`)
    );
    await button.click();
  }

  async typeStartLocation(text: string): Promise<void> {
    // Start input is identified by placeholder "Enter start location"
    const input = await this.driver.findElement(
      By.css('input[placeholder="Enter start location"]')
    );
    await input.clear();
    await input.sendKeys(text);
  }

  async typeDestination(text: string): Promise<void> {
    // Destination input is identified by placeholder "Enter destination"
    const input = await this.driver.findElement(
      By.css('input[placeholder="Enter destination"]')
    );
    await input.clear();
    await input.sendKeys(text);
  }

  async getStartLocationValue(): Promise<string> {
    const input = await this.driver.findElement(
      By.css('input[placeholder="Enter start location"]')
    );
    return await input.getAttribute('value') || '';
  }

  async getDestinationValue(): Promise<string> {
    const input = await this.driver.findElement(
      By.css('input[placeholder="Enter destination"]')
    );
    return await input.getAttribute('value') || '';
  }

  async clickSwapButton(): Promise<void> {
    // Swap button has title="Swap start and destination"
    const button = await this.driver.findElement(
      By.css('button[title="Swap start and destination"]')
    );
    // Scroll into view and use JavaScript click to avoid intercept issues
    await this.driver.executeScript('arguments[0].scrollIntoView({block: "center"});', button);
    await this.driver.sleep(200);
    await this.driver.executeScript('arguments[0].click();', button);
  }

  async isMapVisible(): Promise<boolean> {
    try {
      const map = await this.driver.findElement(By.css('.leaflet-container'));
      return await map.isDisplayed();
    } catch {
      return false;
    }
  }
}
