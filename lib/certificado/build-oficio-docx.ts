import type { BuildCertificadoInput } from "@/lib/certificado/build-certificado-pdf";
import { swapDocxBodyForTipo } from "@/lib/certificado/docx-body-swap";
import { loadOficioTemplateZip } from "@/lib/certificado/pack-oficio-template";
import { buildOficioReplacements, type OficioDestinatario } from "@/lib/certificado/oficio-placeholders";
import { applyOficioDocumentXml } from "@/lib/certificado/word-xml-replace";

export async function buildOficioDocxBuffer(
  input: BuildCertificadoInput,
  destinatario: OficioDestinatario
): Promise<Buffer> {
  const zip = loadOficioTemplateZip();
  const r = buildOficioReplacements(input, destinatario);

  let xml = zip.file("word/document.xml")?.asText() ?? "";
  if (!xml) {
    throw new Error("La plantilla no contiene word/document.xml.");
  }

  xml = applyOficioDocumentXml(xml, input, destinatario, r);
  xml = swapDocxBodyForTipo(xml, r, input);
  zip.file("word/document.xml", xml);

  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
