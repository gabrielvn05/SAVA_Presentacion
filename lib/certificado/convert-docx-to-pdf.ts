import { execFile } from "child_process";
import fs from "fs";
import libre from "libreoffice-convert";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const libreConvertAsync = promisify(libre.convert);

const SOFFICE_CANDIDATES = [
  process.env.LIBREOFFICE_PATH,
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  "soffice",
  "libreoffice"
].filter(Boolean) as string[];

async function findSoffice(): Promise<string | null> {
  for (const candidate of SOFFICE_CANDIDATES) {
    if (candidate.includes(path.sep) || candidate.includes("/")) {
      if (fs.existsSync(candidate)) return candidate;
    } else {
      try {
        await execFileAsync("where", [candidate], { windowsHide: true });
        return candidate;
      } catch {
        // siguiente candidato
      }
    }
  }
  return null;
}

async function convertWithLibreModule(docx: Buffer): Promise<Buffer | null> {
  try {
    const pdf = await libreConvertAsync(docx, ".pdf", undefined);
    return pdf && pdf.length > 0 ? pdf : null;
  } catch {
    return null;
  }
}

/** Convierte DOCX a PDF con LibreOffice si está instalado en el servidor. */
export async function convertDocxToPdf(docx: Buffer): Promise<Buffer | null> {
  const viaModule = await convertWithLibreModule(docx);
  if (viaModule) return viaModule;

  const soffice = await findSoffice();
  if (!soffice) return null;

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sava-oficio-"));
  const inputPath = path.join(tmpDir, "oficio.docx");
  const outDir = path.join(tmpDir, "out");
  fs.mkdirSync(outDir);
  fs.writeFileSync(inputPath, docx);

  try {
    await execFileAsync(
      soffice,
      ["--headless", "--convert-to", "pdf", "--outdir", outDir, inputPath],
      { windowsHide: true, timeout: 120_000 }
    );
    const pdfPath = path.join(outDir, "oficio.pdf");
    if (!fs.existsSync(pdfPath)) return null;
    return fs.readFileSync(pdfPath);
  } catch {
    return null;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignorar limpieza
    }
  }
}
