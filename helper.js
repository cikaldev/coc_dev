const pup = require("puppeteer-core");

exports.whatIsMyIP = async () => {
  const browser = await pup.launch({
    // headless: false,
    executablePath: "/usr/bin/chromium", // <- change this to your chromium path
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // <- this one doesn't works in Windows
      "--disable-gpu",
      "--start-maximized",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto(
    "https://www.google.com/search?client=firefox-b-lm&q=what+is+my+ip",
    {
      waitUntil: "networkidle2",
    }
  );
  const ip = await page.evaluate(() => {
    const elem = document.querySelector(
      "div.NEM4H:nth-child(1) > span:nth-child(1) > span:nth-child(1)"
    );
    return elem.textContent;
  });
  await browser.close();
  return ip;
};
