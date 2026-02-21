import { By, WebDriver, until } from 'selenium-webdriver';
import { getBaseUrl } from '../config/driver';

export class HomePage {
  private driver: WebDriver;
  private baseUrl: string;

  private constructor(driver: WebDriver, baseUrl: string) {
    this.driver = driver;
    this.baseUrl = baseUrl;
  }

  static async create(driver: WebDriver): Promise<HomePage> {
    const baseUrl = await getBaseUrl();
    return new HomePage(driver, baseUrl);
  }

  async navigate(): Promise<void> {
    await this.driver.get(this.baseUrl);
    await this.driver.wait(until.elementLocated(By.css('body')), 10000);
    await this.driver.sleep(1000);
  }

  async isParameterAreaVisible(): Promise<boolean> {
    try {
      const sidebar = await this.driver.findElement(By.css('aside'));
      return await sidebar.isDisplayed();
    } catch {
      return false;
    }
  }

  async clickCollapseButton(): Promise<void> {
    const button = await this.driver.findElement(
      By.css('aside button[title="Collapse"], aside button[title="Expand"]')
    );
    await button.click();
  }

  async getTabCount(): Promise<number> {
    // Tab buttons live inside the Tabs container which has gap-1 and border-b
    const tabs = await this.driver.findElements(
      By.css('div.gap-1.border-b button')
    );
    return tabs.length;
  }

  async getActiveTabName(): Promise<string> {
    try {
      // Active tab has border-b-transparent class (sits on the content edge)
      const activeTab = await this.driver.findElement(
        By.css('div.gap-1.border-b button.border-b-transparent')
      );
      return await activeTab.getText();
    } catch {
      return '';
    }
  }

  async clickTab(name: string): Promise<void> {
    const tab = await this.driver.findElement(
      By.xpath(
        `//div[contains(@class, 'gap-1') and contains(@class, 'border-b')]//button[contains(text(), '${name}')]`
      )
    );
    await tab.click();
  }

  async getSelectedEnvironment(): Promise<string> {
    try {
      // Both collapsed and expanded selected env buttons contain border-lvb-yellow
      // and a font-semibold span with the env label
      const span = await this.driver.findElement(
        By.css('button[class*="border-lvb-yellow"] span.font-semibold')
      );
      return await span.getText();
    } catch {
      return '';
    }
  }

  async selectEnvironment(name: string): Promise<void> {
    // Expand if collapsed — collapsed button has a span containing "Change"
    try {
      const collapsedBtn = await this.driver.findElement(
        By.xpath(`//button[.//span[contains(text(), 'Change')]]`)
      );
      if (await collapsedBtn.isDisplayed()) {
        await collapsedBtn.click();
        await this.driver.sleep(300);
      }
    } catch {
      // Already expanded
    }

    // Click the environment option by its label text
    const envOption = await this.driver.findElement(
      By.xpath(
        `//div[contains(@class, 'space-y-1')]//button[.//span[text()='${name}']]`
      )
    );
    await this.driver.executeScript(
      'arguments[0].scrollIntoView({block: "center"});',
      envOption
    );
    await this.driver.sleep(100);
    await envOption.click();
    await this.driver.sleep(200);

    // Click Confirm if visible (single-select mode)
    try {
      const confirmBtn = await this.driver.findElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`)
      );
      if (await confirmBtn.isDisplayed()) {
        await confirmBtn.click();
      }
    } catch {
      // No confirm button (multi-select or already closed)
    }
  }

  async typeStartLocation(text: string): Promise<void> {
    const input = await this.driver.findElement(
      By.css('input[placeholder="Enter start location"]')
    );
    await input.clear();
    await input.sendKeys(text);
  }

  async typeDestination(text: string): Promise<void> {
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
    return (await input.getAttribute('value')) || '';
  }

  async getDestinationValue(): Promise<string> {
    const input = await this.driver.findElement(
      By.css('input[placeholder="Enter destination"]')
    );
    return (await input.getAttribute('value')) || '';
  }

  async clickSwapButton(): Promise<void> {
    const button = await this.driver.findElement(
      By.css('button[title="Swap start and destination"]')
    );
    await this.driver.executeScript(
      'arguments[0].scrollIntoView({block: "center"});',
      button
    );
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

  // --- Coordinate entry (types + selects from dropdown) ---

  /**
   * Helper: set a location input to a coordinate value and confirm the
   * "Use as Coordinates" dropdown. Uses the native value setter + React's
   * internal value tracker reset so the controlled component picks up the
   * change in a single shot (avoids character-by-character sendKeys issues).
   */
  private async enterCoordinatesInField(
    placeholder: string,
    coords: string
  ): Promise<void> {
    const input = await this.driver.findElement(
      By.css(`input[placeholder="${placeholder}"]`)
    );

    // Focus the input first
    await input.click();
    await this.driver.sleep(200);

    // Set value via native setter + reset React value tracker, then dispatch
    await this.driver.executeScript(
      `
      const input = arguments[0];
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      ).set;
      nativeSetter.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      `,
      input
    );
    await this.driver.sleep(100);

    await this.driver.executeScript(
      `
      const input = arguments[0];
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      ).set;
      nativeSetter.call(input, arguments[1]);
      const tracker = input._valueTracker;
      if (tracker) tracker.setValue('');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      `,
      input,
      coords
    );
    await this.driver.sleep(800);

    // Click the "Use as Coordinates" dropdown option
    const option = await this.driver.wait(
      until.elementLocated(
        By.xpath(`//button[.//div[text()='Use as Coordinates']]`)
      ),
      5000
    );
    await option.click();
    await this.driver.sleep(500);
  }

  async enterStartCoordinates(coords: string): Promise<void> {
    await this.enterCoordinatesInField('Enter start location', coords);
  }

  async enterDestinationCoordinates(coords: string): Promise<void> {
    await this.enterCoordinatesInField('Enter destination', coords);
  }

  // --- Routing ---

  async clickStartRouting(): Promise<void> {
    const button = await this.driver.findElement(
      By.xpath(`//button[.//span[text()='Start Routing']]`)
    );
    await this.driver.executeScript(
      'arguments[0].scrollIntoView({block: "center"});',
      button
    );
    await this.driver.sleep(200);
    await button.click();
  }

  async isRoutingResultsVisible(): Promise<boolean> {
    try {
      // Results panel has the Itineraries/JSON segmented control
      const toggle = await this.driver.findElement(
        By.xpath(`//button[contains(text(), 'Itineraries')]`)
      );
      return await toggle.isDisplayed();
    } catch {
      return false;
    }
  }

  async getItineraryCardCount(): Promise<number> {
    const cards = await this.driver.findElements(
      By.css('div.rounded-lg.border.cursor-pointer')
    );
    return cards.length;
  }

  async clickItineraryCard(index: number): Promise<void> {
    const cards = await this.driver.findElements(
      By.css('div.rounded-lg.border.cursor-pointer')
    );
    if (index >= cards.length) {
      throw new Error(
        `Itinerary card index ${index} out of range (${cards.length} cards)`
      );
    }
    await cards[index].click();
  }

  async isItinerarySelected(index: number): Promise<boolean> {
    const cards = await this.driver.findElements(
      By.css('div.rounded-lg.border.cursor-pointer')
    );
    if (index >= cards.length) return false;
    const classes = await cards[index].getAttribute('class');
    return classes.includes('border-lvb-yellow');
  }

  // --- Itinerary card info ---

  /** Get departure and arrival times from the first (selected) itinerary card */
  async getItineraryTimes(index: number): Promise<{ dep: string; arr: string }> {
    const cards = await this.driver.findElements(
      By.css('div.rounded-lg.border.cursor-pointer')
    );
    if (index >= cards.length) throw new Error(`Card ${index} not found`);
    const times = await cards[index].findElements(
      By.css('span.font-semibold')
    );
    return {
      dep: times.length > 0 ? await times[0].getText() : '',
      arr: times.length > 1 ? await times[1].getText() : '',
    };
  }

  /** Get the duration text from an itinerary card */
  async getItineraryDuration(index: number): Promise<string> {
    const cards = await this.driver.findElements(
      By.css('div.rounded-lg.border.cursor-pointer')
    );
    if (index >= cards.length) throw new Error(`Card ${index} not found`);
    // Duration is the text-sm text-zinc-500 span on the right side of the first row
    const duration = await cards[index].findElement(
      By.css('span.text-sm.text-zinc-500, span.text-sm.dark\\:text-zinc-400')
    );
    return await duration.getText();
  }

  /** Get the transfer info text (e.g. "Direct" or "2 transfers") */
  async getItineraryTransferText(index: number): Promise<string> {
    const cards = await this.driver.findElements(
      By.css('div.rounded-lg.border.cursor-pointer')
    );
    if (index >= cards.length) throw new Error(`Card ${index} not found`);
    const transfer = await cards[index].findElement(
      By.xpath(`.//span[contains(text(),'Direct') or contains(text(),'transfer')]`)
    );
    return await transfer.getText();
  }

  /** Check if the transfer scheme bar (colored progress bar) is visible */
  async isTransferBarVisible(index: number): Promise<boolean> {
    try {
      const cards = await this.driver.findElements(
        By.css('div.rounded-lg.border.cursor-pointer')
      );
      if (index >= cards.length) return false;
      const bar = await cards[index].findElement(
        By.css('div.rounded-full.overflow-hidden')
      );
      return await bar.isDisplayed();
    } catch {
      return false;
    }
  }

  /** Get product badge texts (e.g. ["Tram 11", "Bus 70"]) from an itinerary card */
  async getItineraryProductBadges(index: number): Promise<string[]> {
    const cards = await this.driver.findElements(
      By.css('div.rounded-lg.border.cursor-pointer')
    );
    if (index >= cards.length) return [];
    const badges = await cards[index].findElements(
      By.css('span.text-white.font-medium')
    );
    const texts: string[] = [];
    for (const badge of badges) {
      texts.push((await badge.getText()).trim());
    }
    return texts;
  }

  // --- Selected card expanded leg details ---

  /** Check if the expanded leg details section is visible on the selected card */
  async isLegDetailsVisible(): Promise<boolean> {
    try {
      const section = await this.driver.findElement(
        By.css('div.rounded-lg.border.cursor-pointer.border-lvb-yellow div.border-t')
      );
      return await section.isDisplayed();
    } catch {
      return false;
    }
  }

  /** Get the number of leg detail rows inside the selected card */
  async getLegDetailCount(): Promise<number> {
    try {
      const section = await this.driver.findElement(
        By.css('div.rounded-lg.border.cursor-pointer.border-lvb-yellow div.border-t.space-y-0\\.5')
      );
      // Each leg is either a TransitLegDetail (has a button with mode badge) or WalkLegDetail (has a div with svg)
      const children = await section.findElements(By.css(':scope > div, :scope > button'));
      // The direct children of space-y-0.5 are the leg detail wrappers
      const legs = await section.findElements(By.xpath('./div'));
      return legs.length;
    } catch {
      return 0;
    }
  }

  /** Click a transit leg header to expand intermediate stops */
  async clickTransitLegDetail(legIndex: number): Promise<void> {
    const section = await this.driver.findElement(
      By.css('div.rounded-lg.border.cursor-pointer.border-lvb-yellow div.border-t')
    );
    const legButtons = await section.findElements(
      By.css('button.w-full')
    );
    if (legIndex >= legButtons.length) {
      throw new Error(`Transit leg ${legIndex} not found, only ${legButtons.length} expandable legs`);
    }
    await legButtons[legIndex].click();
  }

  /** Check if intermediate stops timeline is visible (the border-l-2 container) */
  async isIntermediateStopsVisible(): Promise<boolean> {
    try {
      const timeline = await this.driver.findElement(
        By.css('div.border-l-2')
      );
      return await timeline.isDisplayed();
    } catch {
      return false;
    }
  }

  /** Get the stop names from the expanded intermediate stops timeline */
  async getIntermediateStopNames(): Promise<string[]> {
    const timeline = await this.driver.findElement(By.css('div.border-l-2'));
    const nameSpans = await timeline.findElements(
      By.css('span.text-zinc-700, span.dark\\:text-zinc-300')
    );
    const names: string[] = [];
    for (const span of nameSpans) {
      const text = (await span.getText()).trim();
      if (text) names.push(text);
    }
    return names;
  }

  // --- Split panel / drag divider ---

  /** Check if the drag divider between map and results is visible */
  async isDragDividerVisible(): Promise<boolean> {
    try {
      const divider = await this.driver.findElement(
        By.css('div.cursor-row-resize, div.cursor-col-resize')
      );
      return await divider.isDisplayed();
    } catch {
      return false;
    }
  }

  /** Check if Earlier departures button is visible */
  async isEarlierButtonVisible(): Promise<boolean> {
    try {
      const btn = await this.driver.findElement(
        By.xpath(`//button[contains(text(), 'Earlier departures')]`)
      );
      return await btn.isDisplayed();
    } catch {
      return false;
    }
  }

  /** Check if Later departures button is visible */
  async isLaterButtonVisible(): Promise<boolean> {
    try {
      const btn = await this.driver.findElement(
        By.xpath(`//button[contains(text(), 'Later departures')]`)
      );
      return await btn.isDisplayed();
    } catch {
      return false;
    }
  }

  // --- Layout toggle ---

  async clickLayoutToggle(): Promise<void> {
    const button = await this.driver.findElement(
      By.css(
        'button[title="Switch to side-by-side layout"], button[title="Switch to stacked layout"]'
      )
    );
    await button.click();
  }

  async getLayoutMode(): Promise<string> {
    try {
      await this.driver.findElement(
        By.css('button[title="Switch to side-by-side layout"]')
      );
      return 'vertical';
    } catch {
      // not found
    }
    try {
      await this.driver.findElement(
        By.css('button[title="Switch to stacked layout"]')
      );
      return 'horizontal';
    } catch {
      // not found
    }
    return 'unknown';
  }

  // --- Clear results ---

  async clickClearButton(): Promise<void> {
    const button = await this.driver.findElement(
      By.css('button[title="Clear results"]')
    );
    await button.click();
  }

  async isClearConfirmVisible(): Promise<boolean> {
    try {
      const heading = await this.driver.findElement(
        By.xpath(`//h3[text()='Clear routing results?']`)
      );
      return await heading.isDisplayed();
    } catch {
      return false;
    }
  }

  async confirmClear(): Promise<void> {
    // Destructive "Clear" button in the confirmation dialog (red bg)
    const button = await this.driver.findElement(By.css('button.bg-red-600'));
    await button.click();
  }

  async cancelClear(): Promise<void> {
    // Cancel button inside the dialog that contains "Clear routing results?"
    const cancelBtn = await this.driver.findElement(
      By.xpath(
        `//h3[text()='Clear routing results?']/ancestor::div[contains(@class, 'rounded-xl')]//button[text()='Cancel']`
      )
    );
    await cancelBtn.click();
  }

  // --- JSON viewer ---

  async clickJsonTab(): Promise<void> {
    const button = await this.driver.findElement(
      By.xpath(`//button[text()='JSON']`)
    );
    await button.click();
  }

  async isJsonViewerVisible(): Promise<boolean> {
    try {
      const pre = await this.driver.findElement(By.css('pre.font-mono'));
      return await pre.isDisplayed();
    } catch {
      return false;
    }
  }

  // --- Earlier / Later ---

  async clickEarlierButton(): Promise<void> {
    const button = await this.driver.findElement(
      By.xpath(`//button[contains(text(), 'Earlier departures')]`)
    );
    await button.click();
  }

  async clickLaterButton(): Promise<void> {
    const button = await this.driver.findElement(
      By.xpath(`//button[contains(text(), 'Later departures')]`)
    );
    await button.click();
  }

  // --- Theme toggle ---

  async clickThemeToggle(): Promise<void> {
    const button = await this.driver.findElement(
      By.css(
        'button[title="Switch to dark mode"], button[title="Switch to light mode"]'
      )
    );
    await button.click();
  }

  async isDarkMode(): Promise<boolean> {
    const html = await this.driver.findElement(By.css('html'));
    const classes = await html.getAttribute('class');
    return (classes || '').includes('dark');
  }

  // --- Date/Time ---

  async setDateTime(value: string): Promise<void> {
    const input = await this.driver.findElement(
      By.css('input[type="datetime-local"]')
    );
    // Use native setter + dispatched events so React picks up the change
    await this.driver.executeScript(
      `
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      ).set;
      setter.call(arguments[0], arguments[1]);
      arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
      arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
      `,
      input,
      value
    );
  }

  async getDateTimeValue(): Promise<string> {
    const input = await this.driver.findElement(
      By.css('input[type="datetime-local"]')
    );
    return (await input.getAttribute('value')) || '';
  }

  // --- Autocomplete-based location entry ---

  /**
   * Type a search term into a location input, wait for autocomplete suggestions
   * to appear, and click the first suggestion. Returns the selected suggestion text.
   */
  private async enterAutocompleteInField(
    placeholder: string,
    searchTerm: string
  ): Promise<string> {
    const input = await this.driver.findElement(
      By.css(`input[placeholder="${placeholder}"]`)
    );

    // Clear and focus
    await input.click();
    await this.driver.sleep(200);

    // Use native setter to set the value (same approach as coordinates)
    await this.driver.executeScript(
      `
      const input = arguments[0];
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      ).set;
      nativeSetter.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      `,
      input
    );
    await this.driver.sleep(100);

    await this.driver.executeScript(
      `
      const input = arguments[0];
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      ).set;
      nativeSetter.call(input, arguments[1]);
      const tracker = input._valueTracker;
      if (tracker) tracker.setValue('');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      `,
      input,
      searchTerm
    );

    // Wait for autocomplete suggestions to appear (300ms debounce + API call)
    await this.driver.sleep(2000);

    // Click the first suggestion in the dropdown (not "Use as Coordinates" or "Use as Stop ID")
    const suggestion = await this.driver.wait(
      until.elementLocated(
        By.css(
          'ul.z-50 li button div.font-medium'
        )
      ),
      8000,
      `No autocomplete suggestions found for "${searchTerm}"`
    );
    const suggestionText = await suggestion.getText();

    // Click the parent button
    const suggestionBtn = await suggestion.findElement(By.xpath('..'));
    await suggestionBtn.click();
    await this.driver.sleep(500);

    return suggestionText;
  }

  async enterStartAutocomplete(searchTerm: string): Promise<string> {
    return this.enterAutocompleteInField('Enter start location', searchTerm);
  }

  async enterDestinationAutocomplete(searchTerm: string): Promise<string> {
    return this.enterAutocompleteInField('Enter destination', searchTerm);
  }

  /**
   * Get the from/to location names shown in the expanded leg details
   * of the selected itinerary card. These come from the API response's
   * leg.from.name / leg.to.name fields.
   */
  async getRoutingFromToNames(): Promise<{ from: string; to: string }> {
    // The first leg's from.name is the origin, the last leg's to.name is the destination
    // These appear as StopRow name spans inside the expanded border-l-2 timeline
    // OR we can get them from the walk leg detail text
    // Simplest: read the first and last stop names from the expanded details
    try {
      const selectedCard = await this.driver.findElement(
        By.css('div.rounded-lg.border.cursor-pointer.border-lvb-yellow')
      );
      const detailSection = await selectedCard.findElement(
        By.css('div.border-t')
      );
      // Get all location name texts from the leg details
      // Walk legs show "from → to" in their text, transit legs show stop names in the timeline
      // The simplest approach: get all text content and look for location names
      const allText = await detailSection.getText();
      return { from: '', to: '', ...{ _raw: allText } } as { from: string; to: string; _raw?: string };
    } catch {
      return { from: '', to: '' };
    }
  }

  /**
   * Get the raw text content of the selected card's expanded leg details.
   * Useful for checking that real place names appear (not "startpoint"/"endpoint").
   */
  async getSelectedCardDetailsText(): Promise<string> {
    try {
      const selectedCard = await this.driver.findElement(
        By.css('div.rounded-lg.border.cursor-pointer.border-lvb-yellow')
      );
      const detailSection = await selectedCard.findElement(
        By.css('div.border-t')
      );
      return await detailSection.getText();
    } catch {
      return '';
    }
  }

  // --- Autocomplete environment ---

  async selectAutocompleteEnvironment(name: string): Promise<void> {
    // Expand env selector if collapsed
    try {
      const collapsedBtn = await this.driver.findElement(
        By.xpath(`//button[.//span[contains(text(), 'Change')]]`)
      );
      if (await collapsedBtn.isDisplayed()) {
        await collapsedBtn.click();
        await this.driver.sleep(300);
      }
    } catch {
      // Already expanded
    }

    // Click the autocomplete env button under "Autocomplete Service"
    const acButton = await this.driver.findElement(
      By.xpath(
        `//span[contains(text(), 'Autocomplete Service')]/following-sibling::div//button[text()='${name}']`
      )
    );
    await acButton.click();
    await this.driver.sleep(200);

    // Confirm
    try {
      const confirmBtn = await this.driver.findElement(
        By.xpath(`//button[contains(text(), 'Confirm')]`)
      );
      if (await confirmBtn.isDisplayed()) {
        await confirmBtn.click();
      }
    } catch {
      // No confirm
    }
  }

  async getSelectedAutocompleteEnvironment(): Promise<string> {
    try {
      // In collapsed view, the autocomplete badge is a rounded-full span with border
      // inside the collapsed button (which has border-lvb-yellow)
      const text = await this.driver.executeScript<string>(`
        const btn = document.querySelector('button[class*="border-lvb-yellow"]');
        if (!btn) return '';
        const badge = btn.querySelector('span.rounded-full.border');
        return badge ? badge.textContent.trim() : '';
      `);
      return text;
    } catch {
      return '';
    }
  }
}
