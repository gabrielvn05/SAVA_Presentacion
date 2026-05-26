import { NextResponse } from "next/server";
import signpdf from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";
import { plainAddPlaceholder } from "@signpdf/placeholder-plain";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = createSupabaseRouteHandlerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const formData = await req.formData();
  const pdfFile = formData.get("pdf");
  const p12File = formData.get("p12");
  const password = typeof formData.get("password") === "string" ? formData.get("password") : "";

  if (!(pdfFile instanceof File) || pdfFile.size === 0) {
    return NextResponse.json({ error: "Falta el PDF a firmar." }, { status: 400 });
  }
  if (!(p12File instanceof File) || p12File.size === 0) {
    return NextResponse.json({ error: "Falta el certificado .p12." }, { status: 400 });
  }

  const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
  const p12Buffer = Buffer.from(await p12File.arrayBuffer());

  try {
    const pdfWithPlaceholder = plainAddPlaceholder({
      pdfBuffer,
      reason: "Firma electrónica del solicitante (certificado de justificación).",
      contactInfo: user.email ?? "sava",
      name: `${user.email ?? "Solicitante"}`,
      location: "Ecuador"
    });

    const signer = new P12Signer(p12Buffer, { passphrase: String(password ?? "") });
    const signedPdf = await signpdf.sign(pdfWithPlaceholder, signer);

    return new NextResponse(signedPdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="certificado-firmado.pdf"'
      }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudo firmar el PDF.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
