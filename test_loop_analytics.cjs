const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  let loopDetected = false;
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
       console.log('BROWSER ERROR:', msg.text());
       if (msg.text().includes('Maximum update depth exceeded')) {
          loopDetected = true;
       }
    }
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
    if (err.toString().includes('Maximum update depth exceeded')) {
       loopDetected = true;
    }
  });

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // We have 6 tabs
    const tabSelectors = [
       '#tab-dashboard',
       '#tab-logging',
       '#tab-imei-tracking',
       '#tab-products',
       '#tab-monthly-plan',
       '#tab-history'
    ];
    // Find if analytics tab exists
    const tabs = await page.$$('button');
    for (const tab of tabs) {
        const text = await page.evaluate(el => el.textContent, tab);
        if (text && text.includes('Phân tích AI')) {
            console.log('Clicking analytics tab');
            await tab.click();
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    
    for (const selector of tabSelectors) {
       console.log('Clicking tab:', selector);
       const el = await page.$(selector);
       if (el) {
           await el.click();
           await new Promise(r => setTimeout(r, 1000));
       }
    }
    
    console.log('Done clicking tabs.');
  } catch (err) {
    console.error('Script error:', err);
  } finally {
    await browser.close();
    if (loopDetected) process.exit(1);
    process.exit(0);
  }
})();
