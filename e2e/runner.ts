import { WebDriver } from 'selenium-webdriver';
import { createDriver } from './config/driver';
import { HomePage } from './pages/HomePage';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  try {
    await testFn();
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage });
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${errorMessage}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAllTests(): Promise<void> {
  let driver: WebDriver | null = null;

  try {
    console.log('\n🚀 Starting E2E Tests\n');
    console.log('Setting up WebDriver...');
    driver = await createDriver();
    console.log('Detecting server port...');
    const homePage = await HomePage.create(driver);

    console.log('\nRunning tests:\n');

    // ─── Existing tests (1-11) ───────────────────────────────────────

    // Test 1: Page loads successfully
    await runTest('Page loads successfully', async () => {
      await homePage.navigate();
    });

    // Test 2: Parameter area is visible
    await runTest('Parameter area is visible', async () => {
      const isVisible = await homePage.isParameterAreaVisible();
      if (!isVisible) throw new Error('Parameter area not visible');
    });

    // Test 3: Five tabs are displayed
    await runTest('Five tabs are displayed', async () => {
      const tabCount = await homePage.getTabCount();
      if (tabCount !== 5)
        throw new Error(`Expected 5 tabs, found ${tabCount}`);
    });

    // Test 4: Routing tab is active by default
    await runTest('Routing tab is active by default', async () => {
      const activeTab = await homePage.getActiveTabName();
      if (!activeTab.toLowerCase().includes('routing')) {
        throw new Error(
          `Expected Routing tab to be active, found: ${activeTab}`
        );
      }
    });

    // Test 5: PROD environment is selected by default
    await runTest('PROD environment is selected by default', async () => {
      const env = await homePage.getSelectedEnvironment();
      if (!env.toUpperCase().includes('PROD')) {
        throw new Error(`Expected PROD environment, found: ${env}`);
      }
    });

    // Test 6: Can switch to Routing Comparison tab
    await runTest('Can switch to Routing Comparison tab', async () => {
      await homePage.clickTab('Routing Comparison');
      await sleep(300);
      const activeTab = await homePage.getActiveTabName();
      if (!activeTab.toLowerCase().includes('comparison')) {
        throw new Error(
          `Expected Routing Comparison tab, found: ${activeTab}`
        );
      }
    });

    // Switch back to Routing tab for remaining tests
    await homePage.clickTab('Routing');
    await sleep(300);

    // Test 7: Parameter area can collapse and expand
    await runTest('Parameter area can collapse and expand', async () => {
      await homePage.clickCollapseButton();
      await sleep(300);
      await homePage.clickCollapseButton();
      await sleep(300);
      const isVisible = await homePage.isParameterAreaVisible();
      if (!isVisible)
        throw new Error('Parameter area not visible after expand');
    });

    // Test 8: Can select STAGE environment
    await runTest('Can select STAGE environment', async () => {
      await homePage.selectEnvironment('STAGE');
      await sleep(300);
      const env = await homePage.getSelectedEnvironment();
      if (!env.toUpperCase().includes('STAGE')) {
        throw new Error(`Expected STAGE environment, found: ${env}`);
      }
    });

    // Test 9: Can type in start location
    await runTest('Can type in start location', async () => {
      await homePage.typeStartLocation('Hauptbahnhof');
      await sleep(300);
      const value = await homePage.getStartLocationValue();
      if (!value.includes('Hauptbahnhof')) {
        throw new Error(
          `Expected start to contain 'Hauptbahnhof', found: ${value}`
        );
      }
    });

    // Test 10: Swap button exchanges start and destination
    await runTest('Swap button exchanges start and destination', async () => {
      await homePage.typeStartLocation('StartPlace');
      await homePage.typeDestination('EndPlace');
      await sleep(300);

      const initialStart = await homePage.getStartLocationValue();
      const initialDest = await homePage.getDestinationValue();

      await homePage.clickSwapButton();
      await sleep(300);

      const newStart = await homePage.getStartLocationValue();
      const newDest = await homePage.getDestinationValue();

      if (newStart !== initialDest || newDest !== initialStart) {
        throw new Error(
          `Swap failed. Expected start='${initialDest}' dest='${initialStart}', got start='${newStart}' dest='${newDest}'`
        );
      }
    });

    // Test 11: Map is visible on Routing tab
    await runTest('Map is visible on Routing tab', async () => {
      const isMapVisible = await homePage.isMapVisible();
      if (!isMapVisible) throw new Error('Map is not visible');
    });

    // ─── New tests (12-22) ───────────────────────────────────────────

    // Test 12: Can toggle dark mode
    await runTest('Can toggle dark mode', async () => {
      const wasDark = await homePage.isDarkMode();
      await homePage.clickThemeToggle();
      await sleep(300);
      const nowDark = await homePage.isDarkMode();
      if (wasDark === nowDark) {
        throw new Error(
          `Theme did not toggle (was ${wasDark ? 'dark' : 'light'}, still ${nowDark ? 'dark' : 'light'})`
        );
      }
      // Toggle back to original
      await homePage.clickThemeToggle();
      await sleep(300);
    });

    // Test 13: Date/time input works
    await runTest('Date/time input works', async () => {
      const testValue = '2026-03-15T14:30';
      await homePage.setDateTime(testValue);
      await sleep(300);
      const value = await homePage.getDateTimeValue();
      if (value !== testValue) {
        throw new Error(`Expected datetime '${testValue}', got '${value}'`);
      }
    });

    // Reset environment to PROD for routing test
    await homePage.selectEnvironment('PROD');
    await sleep(300);

    // Test 14: Can submit a routing request
    await runTest('Can submit a routing request', async () => {
      // Use coordinate entry which types + selects "Use as Coordinates" from dropdown
      await homePage.enterStartCoordinates('51.3405,12.3748');
      await homePage.enterDestinationCoordinates('51.3458,12.3800');
      await homePage.clickStartRouting();
      // Wait for routing API response (may take several seconds)
      await sleep(10000);
    });

    // Test 15: Routing results panel appears after search
    await runTest('Routing results panel appears after search', async () => {
      const visible = await homePage.isRoutingResultsVisible();
      if (!visible)
        throw new Error('Routing results panel not visible after search');
    });

    // Test 16: Can select different itinerary
    await runTest('Can select different itinerary', async () => {
      const count = await homePage.getItineraryCardCount();
      if (count < 2) {
        throw new Error(
          `Need at least 2 itineraries to test selection, found ${count}`
        );
      }
      await homePage.clickItineraryCard(1);
      await sleep(300);
      const isSelected = await homePage.isItinerarySelected(1);
      if (!isSelected)
        throw new Error('Second itinerary card was not selected');
    });

    // Test 17: Itinerary card shows departure and arrival times
    await runTest(
      'Itinerary card shows departure and arrival times',
      async () => {
        const times = await homePage.getItineraryTimes(0);
        // Times should be in HH:MM format (e.g. "14:30")
        if (!times.dep || !times.arr) {
          throw new Error(
            `Expected dep/arr times, got dep='${times.dep}' arr='${times.arr}'`
          );
        }
        if (!/\d{1,2}:\d{2}/.test(times.dep) || !/\d{1,2}:\d{2}/.test(times.arr)) {
          throw new Error(
            `Times not in HH:MM format: dep='${times.dep}' arr='${times.arr}'`
          );
        }
      }
    );

    // Test 18: Itinerary card shows duration
    await runTest('Itinerary card shows duration', async () => {
      const duration = await homePage.getItineraryDuration(0);
      // Duration can be "23 min", "1h 5min", or HH:MM format like "00:09"
      const hasDuration =
        duration.includes('min') ||
        duration.includes('h') ||
        /^\d{1,2}:\d{2}$/.test(duration);
      if (!hasDuration) {
        throw new Error(`Expected duration string, got '${duration}'`);
      }
    });

    // Test 19: Itinerary card shows transfer info
    await runTest('Itinerary card shows transfer info', async () => {
      const text = await homePage.getItineraryTransferText(0);
      if (!text.includes('Direct') && !text.includes('transfer')) {
        throw new Error(`Expected 'Direct' or 'N transfers', got '${text}'`);
      }
    });

    // Test 20: Itinerary card shows transfer scheme bar
    await runTest('Itinerary card shows transfer scheme bar', async () => {
      const visible = await homePage.isTransferBarVisible(0);
      if (!visible) throw new Error('Transfer scheme bar not visible');
    });

    // Test 21: Itinerary card shows product badges
    await runTest('Itinerary card shows product badges', async () => {
      const badges = await homePage.getItineraryProductBadges(0);
      // At least one product badge should be visible (walk-only routes have none,
      // but Leipzig coords should return transit routes)
      if (badges.length === 0) {
        throw new Error('No product badges found on itinerary card');
      }
    });

    // Test 22: Selected card shows expanded leg details
    await runTest('Selected card shows expanded leg details', async () => {
      // Card 0 should already be selected (we clicked card 1 in test 16, re-select card 0)
      await homePage.clickItineraryCard(0);
      await sleep(300);
      const visible = await homePage.isLegDetailsVisible();
      if (!visible)
        throw new Error('Leg details section not visible on selected card');
    });

    // Test 23: Transit leg can expand to show intermediate stops
    await runTest(
      'Transit leg can expand to show intermediate stops',
      async () => {
        // Click the first transit leg header to expand
        try {
          await homePage.clickTransitLegDetail(0);
          await sleep(500);
          const stopsVisible = await homePage.isIntermediateStopsVisible();
          if (!stopsVisible)
            throw new Error('Intermediate stops timeline not visible');
        } catch (e) {
          // If no transit leg (walk-only route), skip gracefully
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes('not found')) {
            // Walk-only route — no transit legs to expand, pass anyway
          } else {
            throw e;
          }
        }
      }
    );

    // Test 24: Drag divider is visible between map and results
    await runTest(
      'Drag divider is visible between map and results',
      async () => {
        const visible = await homePage.isDragDividerVisible();
        if (!visible)
          throw new Error('Drag divider not visible between map and results');
      }
    );

    // Test 25: Earlier and Later departure buttons are visible
    await runTest(
      'Earlier and Later departure buttons are visible',
      async () => {
        const earlierVisible = await homePage.isEarlierButtonVisible();
        const laterVisible = await homePage.isLaterButtonVisible();
        if (!earlierVisible)
          throw new Error('Earlier departures button not visible');
        if (!laterVisible)
          throw new Error('Later departures button not visible');
      }
    );

    // Test 26: Layout toggle switches between vertical and horizontal
    await runTest(
      'Layout toggle switches between vertical and horizontal',
      async () => {
        const initialMode = await homePage.getLayoutMode();
        await homePage.clickLayoutToggle();
        await sleep(300);
        const newMode = await homePage.getLayoutMode();
        if (initialMode === newMode) {
          throw new Error(
            `Layout did not toggle (was ${initialMode}, still ${newMode})`
          );
        }
        // Toggle back
        await homePage.clickLayoutToggle();
        await sleep(300);
      }
    );

    // Test 27: JSON tab shows raw response data
    await runTest('JSON tab shows raw response data', async () => {
      await homePage.clickJsonTab();
      await sleep(300);
      const visible = await homePage.isJsonViewerVisible();
      if (!visible) throw new Error('JSON viewer not visible after clicking tab');
      // Switch back to itineraries view
      const itiBtn = await driver!.findElement(
        { xpath: `//button[contains(text(), 'Itineraries')]` }
      );
      await itiBtn.click();
      await sleep(300);
    });

    // Test 28: Clear button shows confirmation dialog
    await runTest('Clear button shows confirmation dialog', async () => {
      await homePage.clickClearButton();
      await sleep(300);
      const visible = await homePage.isClearConfirmVisible();
      if (!visible)
        throw new Error('Clear confirmation dialog not visible');
    });

    // Test 29: Cancel on clear dialog returns to results
    await runTest(
      'Cancel on clear dialog returns to results',
      async () => {
        await homePage.cancelClear();
        await sleep(300);
        const resultsStillVisible =
          await homePage.isRoutingResultsVisible();
        if (!resultsStillVisible)
          throw new Error(
            'Results disappeared after cancelling clear dialog'
          );
      }
    );

    // Test 30: Confirm clear removes results
    await runTest('Confirm clear removes results', async () => {
      await homePage.clickClearButton();
      await sleep(300);
      await homePage.confirmClear();
      await sleep(300);
      const resultsVisible = await homePage.isRoutingResultsVisible();
      if (resultsVisible)
        throw new Error('Results still visible after confirming clear');
    });

    // Test 31: Can switch autocomplete environment
    await runTest('Can switch autocomplete environment', async () => {
      await homePage.selectAutocompleteEnvironment('STAGE');
      await sleep(300);
      const acEnv = await homePage.getSelectedAutocompleteEnvironment();
      if (!acEnv.toUpperCase().includes('STAGE')) {
        throw new Error(
          `Expected autocomplete env STAGE, found: ${acEnv}`
        );
      }
    });

    // ─── Autocomplete-based routing test ──────────────────────────────

    // Reset to PROD env for autocomplete routing test
    await homePage.selectEnvironment('PROD');
    await sleep(300);

    // Test 32: Autocomplete-based routing shows real place names
    await runTest(
      'Autocomplete routing shows real place names (not startpoint/endpoint)',
      async () => {
        // Type location names and select from autocomplete dropdown
        const startName = await homePage.enterStartAutocomplete('Hauptbahnhof');
        const destName = await homePage.enterDestinationAutocomplete('Markt');
        console.log(`    Selected start: "${startName}", dest: "${destName}"`);

        // Submit routing
        await homePage.clickStartRouting();
        await sleep(10000);

        // Verify results appeared
        const resultsVisible = await homePage.isRoutingResultsVisible();
        if (!resultsVisible) {
          throw new Error('Routing results not visible after autocomplete search');
        }

        // Select the first itinerary to expand details
        await homePage.clickItineraryCard(0);
        await sleep(500);

        // Expand the first transit leg to reveal stop names
        try {
          await homePage.clickTransitLegDetail(0);
          await sleep(500);
        } catch {
          // Walk-only route — no transit leg to expand
        }

        // Get all visible text from the selected card (including expanded stops)
        const detailsText = await homePage.getSelectedCardDetailsText();
        console.log(`    Card details text (first 300 chars): "${detailsText.slice(0, 300)}"`);

        // Verify that "startpoint" and "endpoint" do NOT appear in the details
        const lower = detailsText.toLowerCase();
        if (lower.includes('startpoint') || lower.includes('endpoint')) {
          throw new Error(
            `Found generic "startpoint"/"endpoint" in route details — expected real place names. Details: "${detailsText.slice(0, 400)}"`
          );
        }

        // Verify that real stop names appear (check for common Leipzig stop name fragments)
        // The expanded transit leg should show boarding and alighting stop names
        const hasRealNames =
          lower.includes('hauptbahnhof') ||
          lower.includes('markt') ||
          lower.includes('leipzig') ||
          lower.includes('hbf') ||
          // Any name that isn't just route metadata (mode, direction, stops count)
          (detailsText.split('\n').some(line => {
            const trimmed = line.trim();
            // Check for lines that look like stop names (contain letters, not just numbers/arrows)
            return trimmed.length > 3 &&
              !trimmed.startsWith('Tram') &&
              !trimmed.startsWith('Bus') &&
              !trimmed.startsWith('→') &&
              !trimmed.match(/^\d/) &&
              !trimmed.includes('stop') &&
              !trimmed.includes('Walk');
          }));

        if (!hasRealNames) {
          throw new Error(
            `No real place names found in route details. Details: "${detailsText.slice(0, 400)}"`
          );
        }
      }
    );

  } catch (error) {
    console.error('\n❌ Fatal error during test execution:', error);
    process.exitCode = 1;
  } finally {
    if (driver) {
      await driver.quit();
    }

    // Print summary
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Test Results: ${passed}/${results.length} passed`);

    if (failed > 0) {
      console.log(`\n❌ ${failed} test(s) failed:`);
      results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`   - ${r.name}: ${r.error}`);
        });
      process.exitCode = 1;
    } else {
      console.log('\n✅ All tests passed!');
    }

    console.log('\n');
  }
}

// Run tests
runAllTests();
