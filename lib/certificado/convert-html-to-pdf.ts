/** Convierte HTML a PDF con Chromium (Playwright). No requiere LibreOffice. */
export async function convertHtmlToPdf(html: string): Promise<Buffer | null> {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" }
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[SAVA] Playwright PDF no disponible:", err instanceof Error ? err.message : err);
    }
    return null;
  }
}

export async function isPlaywrightPdfAvailable(): Promise<boolean> {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    return true;
  } catch {
    return false;
  }
}
