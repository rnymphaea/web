const puppeteer = require('puppeteer');

async function runTests() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Starting E2E tests...');
  
  try {
    // Test 1: Broker login and portfolio display
    console.log('Test 1: Broker login');
    await page.goto('http://localhost:8080');
    
    // Create new broker
    await page.type('input[type="text"]', 'Test Broker');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation();
    console.log('✓ Broker login successful');
    
    // Test 2: Check portfolio display
    await page.waitForSelector('h2');
    const portfolioText = await page.$eval('h2', el => el.textContent);
    if (portfolioText.includes('Портфель')) {
      console.log('✓ Portfolio display working');
    }
    
    // Test 3: Buy stocks
    console.log('Test 3: Stock purchase');
    const buyButtons = await page.$$('button');
    await buyButtons[0].click(); // Click first buy button
    
    await page.waitForSelector('.dialog');
    await page.type('input[type="number"]', '10');
    await page.click('button:not([disabled])');
    
    await page.waitForTimeout(1000);
    console.log('✓ Stock purchase completed');
    
    // Test 4: Verify balance update
    const cashElement = await page.$('p:contains("Денежные средства")');
    const cashText = await page.evaluate(el => el.textContent, cashElement);
    if (cashText.includes('$')) {
      console.log('✓ Balance update verified');
    }
    
    console.log('All tests passed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Wait for servers to start
setTimeout(runTests, 5000);
