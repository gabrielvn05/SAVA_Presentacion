import nodemailer from "nodemailer";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta variable de entorno obligatoria: ${name}`);
  }
  return value;
}

export async function sendTemporaryPasswordEmail(params: {
  to: string;
  fullName: string;
  temporaryPassword: string;
}) {
  const host = requiredEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = requiredEnv("SMTP_USER");
  const pass = requiredEnv("SMTP_PASS");
  const from = requiredEnv("SMTP_FROM");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const subject = "Cuenta aprobada en SAVA - clave temporal";
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#1a2332">
      <h2 style="margin:0 0 12px">Tu cuenta fue aprobada</h2>
      <p>Hola <strong>${params.fullName}</strong>,</p>
      <p>El Decanato aprobó tu solicitud de acceso en SAVA.</p>
      <p>
        <strong>Usuario:</strong> ${params.to}<br/>
        <strong>Clave temporal:</strong> <code style="font-size:15px">${params.temporaryPassword}</code>
      </p>
      <p>Ingresa en <a href="${appUrl}/login">${appUrl}/login</a>. En el primer inicio, el sistema te pedirá cambiar la contraseña.</p>
      <p style="color:#5c6b7f">Si no solicitaste esta cuenta, ignora este mensaje.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: params.to,
    subject,
    html
  });
}

