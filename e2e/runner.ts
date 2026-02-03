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

async function runAllTests(): Promise<void> {
  let driver: WebDriver | null = null;

  try {
    console.log('\n🚀 Starting E2E Tests\n');
    console.log('Setting up WebDriver...');
    driver = await createDriver();
    console.log('Detecting server port...');
    const homePage = await HomePage.create(driver);

    console.log('\nRunning tests:\n');

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
      if (tabCount !== 5) throw new Error(`Expected 5 tabs, found ${tabCount}`);
    });

    // Test 4: Routing tab is active by default
    await runTest('Routing tab is active by default', async () => {
      const activeTab = await homePage.getActiveTabName();
      if (!activeTab.toLowerCase().includes('routing')) {
        throw new Error(`Expected Routing tab to be active, found: ${activeTab}`);
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
      // Small delay for tab switch animation
      await new Promise((resolve) => setTimeout(resolve, 300));
      const activeTab = await homePage.getActiveTabName();
      if (!activeTab.toLowerCase().includes('comparison')) {
        throw new Error(`Expected Routing Comparison tab, found: ${activeTab}`);
      }
    });

    // Switch back to Routing tab for remaining tests
    await homePage.clickTab('Routing');
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Test 7: Parameter area can collapse and expand
    await runTest('Parameter area can collapse and expand', async () => {
      // Collapse
      await homePage.clickCollapseButton();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Expand
      await homePage.clickCollapseButton();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const isVisible = await homePage.isParameterAreaVisible();
      if (!isVisible) throw new Error('Parameter area not visible after expand');
    });

    // Test 8: Can select STAGE environment
    await runTest('Can select STAGE environment', async () => {
      await homePage.selectEnvironment('STAGE');
      await new Promise((resolve) => setTimeout(resolve, 300));
      const env = await homePage.getSelectedEnvironment();
      if (!env.toUpperCase().includes('STAGE')) {
        throw new Error(`Expected STAGE environment, found: ${env}`);
      }
    });

    // Test 9: Can type in start location
    await runTest('Can type in start location', async () => {
      await homePage.typeStartLocation('Hauptbahnhof');
      await new Promise((resolve) => setTimeout(resolve, 300));
      const value = await homePage.getStartLocationValue();
      if (!value.includes('Hauptbahnhof')) {
        throw new Error(`Expected start to contain 'Hauptbahnhof', found: ${value}`);
      }
    });

    // Test 10: Swap button exchanges start and destination
    await runTest('Swap button exchanges start and destination', async () => {
      // Clear and set known values
      await homePage.typeStartLocation('StartPlace');
      await homePage.typeDestination('EndPlace');
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get initial values
      const initialStart = await homePage.getStartLocationValue();
      const initialDest = await homePage.getDestinationValue();

      // Click swap
      await homePage.clickSwapButton();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Check values are swapped
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
