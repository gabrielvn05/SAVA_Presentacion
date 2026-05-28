import fs from "fs";
import path from "path";
import PizZip from "pizzip";

const EXTRACTED_DIR = path.join(process.cwd(), "public", "templates", "oficio-extracted");
const DOCX_FILE = path.join(process.cwd(), "public", "templates", "oficio-plantilla.docx");

function addDirToZip(zip: PizZip, dir: string, base = "") {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const entry = base ? `${base}/${name}` : name;
    if (fs.statSync(full).isDirectory()) {
      addDirToZip(zip, full, entry);
    } else {
      zip.file(entry, fs.readFileSync(full));
    }
  }
}

/** Carga la plantilla desde la carpeta XML extraída (formato original con encabezado e imágenes). */
export function loadOficioTemplateZip(): PizZip {
  if (fs.existsSync(EXTRACTED_DIR)) {
    const zip = new PizZip();
    addDirToZip(zip, EXTRACTED_DIR);
    return zip;
  }

  if (!fs.existsSync(DOCX_FILE)) {
    throw new Error("No se encontró la plantilla de oficio.");
  }

  return new PizZip(fs.readFileSync(DOCX_FILE, "binary"));
}

export function oficioExtractedMediaDir() {
  const media = path.join(EXTRACTED_DIR, "word", "media");
  if (fs.existsSync(media)) return media;
  return path.join(process.cwd(), "public", "templates", "oficio-media");
}
