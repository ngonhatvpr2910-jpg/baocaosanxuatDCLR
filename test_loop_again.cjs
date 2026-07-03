const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  let loopDetected = false;
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('MAX UPDATE DEPTH DETECTED')) {
       console.log('LOOP TRACE:', text);
       loopDetected = true;
    } else if (msg.type() === 'error') {
       console.log('BROWSER ERROR:', text);
       if (text.includes('Maximum update depth exceeded')) {
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
    
    // Type into input
    const inputs = await page.$$('input[type="text"]');
    if (inputs.length > 0) {
        await inputs[inputs.length - 1].type('ABC');
    }
    
    await new Promise(r => setTimeout(r, 2000));
    console.log('Done.');
  } catch (err) {
    console.error('Script error:', err);
  } finally {
    await browser.close();
    if (loopDetected) process.exit(1);
    process.exit(0);
  }
})();
