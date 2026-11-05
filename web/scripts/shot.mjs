import { chromium } from "playwright-core";

const [exe, base, outDir] = process.argv.slice(2);
const shots = [
  { name: "desktop", width: 1440, height: 900, full: true },
  { name: "desktop-fold", width: 1440, height: 900, full: false },
  { name: "mobile", width: 390, height: 844, full: true },
  { name: "mobile-fold", width: 390, height: 844, full: false },
];

// The themed scrollbar is a real scrollbar, so without this the capture is
// 13px wider than the viewport and looks like a responsive failure.
const browser = await chromium.launch({
  executablePath: exe,
  args: ["--hide-scrollbars"],
});
for (const s of shots) {
  const page = await browser.newPage({
    viewport: { width: s.width, height: s.height },
    deviceScaleFactor: 1,
  });
  await page.goto(base, { waitUntil: "networkidle" });
  // Let the plate finish reading itself so no well is caught mid-animation.
  await page.waitForTimeout(2200);
  const over = await page.evaluate(() => ({
    vw: document.documentElement.clientWidth,
    sw: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  }));
  await page.screenshot({ path: `${outDir}/${s.name}.png`, fullPage: s.full });
  console.log(s.name, JSON.stringify(over));
  await page.close();
}
await browser.close();
