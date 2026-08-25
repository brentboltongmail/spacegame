const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.error('Page error: ' + err.toString());
  });
  
  page.on('error', err => {
    console.error('Error: ' + err.toString());
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Console error: ' + msg.text());
    }
  });

  await page.goto('file://' + __dirname + '/index.html');
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
