const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('PAGE_ERROR: ' + err.toString());
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon.ico') && !msg.text().includes('CORS')) {
      console.log('CONSOLE_ERROR: ' + msg.text());
    }
  });

  await page.goto('file://' + __dirname + '/index.html');
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
     // trigger some interactions to see if runtime errors happen
     if(window.openOptionsModal) window.openOptionsModal();
  });
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
