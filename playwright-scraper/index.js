const express = require("express");
const { chromium } = require("playwright");
const app = express();
const TOKEN = process.env.SCRAPER_TOKEN || "test123";

app.get("/scrape", async (req, res) => {
  const { url, token } = req.query;
  if (!url) return res.status(400).json({ error: "missing url" });
  if (TOKEN && token !== TOKEN) return res.status(403).json({ error: "unauthorized" });
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox"]
    });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36"
    });
    const page = await context.newPage();
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 60000
    });
    await page.waitForTimeout(3000);
    const result = {
      url,
      title: await page.title(),
      text: await page.evaluate(() => document.body.innerText)
    };
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(3001, "0.0.0.0", () => {
  console.log("Playwright API running on port 3001");
});
