const fs = require("fs");
const { whatIsMyIP } = require("./helper");
const pup = require("puppeteer-core");

(async (email, password) => {
  let i = 1;
  const my_ip = await whatIsMyIP();
  console.log(`Your IP address is: ${my_ip}`);

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
  await page.goto("https://developer.clashofclans.com/#/login", {
    waitUntil: "networkidle0",
  });
  await page.screenshot({ path: `jepret${i}.png` });

  // Login process
  // Input Email & Password then Submit
  await page.type("input[id=email]", email);
  await page.type("input[id=password]", password);
  await page.screenshot({ path: `jepret${i++}.png` });
  await page.click("form div button[type=submit]");

  // Wait for login response
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  // Need to call twice before lists appear
  await page.goto("https://developer.clashofclans.com/#/account", {
    waitUntil: "networkidle0",
  });
  await page.goto("https://developer.clashofclans.com/#/account", {
    waitUntil: "networkidle0",
  });
  await page.screenshot({ path: `jepret${i++}.png` });

  let list = await page.evaluate(() => {
    let tmp = [];
    const _el = $("ul.api-keys li.api-key a");
    _el.each((a, b) => {
      tmp.push({
        name: $(b).find("h4").text(),
        desc: $(b).find("p").text(),
        link: $(b).attr("href"),
        token: "",
        ip: [],
      });
    });
    return tmp;
  });
  // console.log(list)

  for await (const v of list) {
    await page.goto("https://developer.clashofclans.com/" + v.link, {
      waitUntil: "networkidle0",
    });
    v.token = await page.evaluate(() => {
      const token = $("samp").text();
      return token;
    });
    v.ip = await page.evaluate(() => {
      let ip_address = [];
      $(
        "form.api-key__details div:nth-child(3) div.form-group div.form-control.input-lg"
      ).each((a, b) => {
        const ip = $(b).text();
        ip_address.push(ip);
      });
      return ip_address;
    });
  }
  // console.log(list)

  fs.writeFileSync(__dirname + "/output.json", JSON.stringify(list, null, 2));
  await browser.close();

  // Clean up screenshot file
  for (let x = 1; x < i; x++) {
    fs.unlinkSync(`jepret${x}.png`);
  }

  // Make a check is Local IP has registered or not, compare in List results before
  list.map((v) => console.log(`${v.ip.includes(my_ip)} | ${v.ip}`));
})('YOUR_EMAIL', 'YOUR_PASSWORD');
