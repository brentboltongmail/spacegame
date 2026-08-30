const puppeteer = require("puppeteer");
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("file:///C:/github/spacegame/test_clip.html");
    await page.waitForTimeout(1000);
    await page.screenshot({path: "test.png"});
    await browser.close();
})();
