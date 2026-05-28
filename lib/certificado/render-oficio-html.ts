import fs from "fs";
import path from "path";
import { FACULTAD_DEFAULT } from "@/lib/certificado/constants";
import type { BuildCertificadoInput } from "@/lib/certificado/build-certificado-pdf";
import { buildOficioReplacements, type OficioDestinatario } from "@/lib/certificado/oficio-placeholders";
import { oficioExtractedMediaDir } from "@/lib/certificado/pack-oficio-template";

function imageDataUri(fileName: string) {
  const dir = oficioExtractedMediaDir();
  const candidates = [
    path.join(dir, fileName),
    path.join(dir, "image1.png"),
    path.join(dir, "image2.png"),
    path.join(process.cwd(), "public", "templates", "oficio-media", fileName)
  ];
  const map: Record<string, string> = {
    "logo-facultad.png": "image1.png",
    "marca-uleam.png": "image2.png"
  };
  if (map[fileName]) candidates.unshift(path.join(dir, map[fileName]));

  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) return "";
  const buf = fs.readFileSync(found);
  const ext = path.extname(found).slice(1) || "png";
  return `data:image/${ext};base64,${buf.toString("base64")}`;
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML fiel al diseño Word (encabezado con logos + cuerpo + tabla de firmas). */
export function renderOficioHtml(input: BuildCertificadoInput, destinatario: OficioDestinatario): string {
  const r = buildOficioReplacements(input, destinatario);
  const decanoNombre = `${destinatario.nombres} ${destinatario.apellidos}`.trim();
  const logo = imageDataUri("logo-facultad.png");
  const marca = imageDataUri("marca-uleam.png");

  const parrafos = [r.cuerpo_parrafo_1, r.cuerpo_parrafo_2, r.cuerpo_parrafo_3, r.cuerpo_parrafo_4]
    .filter((p) => p?.trim())
    .map((p) => `<p class="cuerpo">${esc(p)}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 20mm 14mm 22mm 28mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      font-size: 11pt;
      color: #111;
      line-height: 1.45;
      margin: 0;
    }
    .header {
      position: relative;
      min-height: 95px;
      margin-bottom: 18px;
    }
    .header__logo {
      position: absolute;
      left: 0;
      top: 0;
      max-width: 210px;
      max-height: 72px;
    }
    .header__facultad {
      position: absolute;
      right: 0;
      top: 4px;
      text-align: right;
      font-style: italic;
      font-weight: 700;
      font-size: 17pt;
      line-height: 1.2;
      max-width: 55%;
    }
    .header__marca {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: 0;
      max-width: 200px;
      opacity: 0.07;
      z-index: 0;
    }
    .bloque { position: relative; z-index: 1; }
    p { margin: 0 0 0.65em; text-align: justify; }
    .cuerpo { text-indent: 0; }
    .oficio-num { margin-bottom: 1em; }
    .atentamente { margin-top: 1.2em; margin-bottom: 2em; }
    table.firma {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 9.5pt;
    }
    table.firma td {
      border: 1px solid #333;
      vertical-align: top;
      width: 50%;
      padding: 10px 12px;
      min-height: 100px;
    }
    .firma-nombre { font-weight: 700; margin-bottom: 6px; }
  </style>
</head>
<body>
  <header class="header">
    ${logo ? `<img class="header__logo" src="${logo}" alt="Facultad" />` : ""}
    ${marca ? `<img class="header__marca" src="${marca}" alt="" />` : ""}
    <div class="header__facultad">
      Facultad Ciencias de la Vida y<br />Tecnologías.
    </div>
  </header>

  <div class="bloque">
    <p class="oficio-num"><strong>OFICIO N° ${esc(r.numero_oficio)}</strong></p>
    <p>${esc(destinatario.titulo)}</p>
    <p>${esc(decanoNombre)}</p>
    <p>Decano de la ${esc(destinatario.facultad)}</p>
    <p style="margin-top: 0.8em">De mis consideraciones.</p>
    ${parrafos}
    <p class="atentamente">Atentamente,</p>

    <table class="firma">
      <tr>
        <td>
          <div class="firma-nombre">${esc(r.nombre_solicitante)}</div>
          <div>${esc(r.cargo_firma)}</div>
          <div style="margin-top:8px">Cédula: ${esc(r.cedula)}</div>
          <div>Correo institucional: ${esc(r.correo_solicitante)}</div>
          <div>Fecha de generación del documento: ${esc(r.fecha_generacion)}</div>
        </td>
        <td>
          <div>Aprobado por:</div>
          <div style="margin-top:36px" class="firma-nombre">${esc(decanoNombre)}</div>
          <div>Decano de la ${esc(FACULTAD_DEFAULT)}</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
