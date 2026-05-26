# SAVA - Permisos y Justificaciones

Sistema web inicial con `Next.js` + `Supabase` para gestionar permisos/justificaciones con flujo por roles.

## Roles implementados

- `administrativo`: crea, edita y visualiza solicitudes.
- `secretaria`: revisa solicitudes y las envía a Decano.
- `decano`: aprueba/firma solicitudes y es el único que crea usuarios y delega funcionalidades.
- `superusuario`: acceso total al flujo funcional (sin creación de usuarios, por la regla solicitada).

## Flujo

1. Cualquier rol crea solicitud (con justificativo en archivo).
2. Secretaria revisa y envía a aprobación.
3. Decano aprueba (firma) o rechaza.
4. Decano puede delegar capacidades específicas a otros usuarios.

## Configuración rápida

1. Instala dependencias:
   - `npm install`
2. Crea `.env.local` desde `.env.example`.
3. Ejecuta `sql/schema.sql` en Supabase SQL Editor.
4. Crea los 4 usuarios de prueba:
   - `npm run seed`
   - correos: `superusuario@sava.test`, `decano@sava.test`, `secretaria@sava.test`, `administrativo@sava.test`
   - contraseña por defecto: `SavaDemo2026!` (o `SEED_TEST_PASSWORD`)
   - contraseña temporal para altas: `SavaTemporal2026!` (o `SEED_TEMP_PASSWORD`)
5. Levanta el proyecto:
   - `npm run dev`

## Variables de entorno

Define estas variables en `.env.local` (puedes copiar desde `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (ej. `http://localhost:3000` en local)
- `SMTP_HOST`
- `SMTP_PORT` (ej. `587` o `465`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (ej. `SAVA <no-reply@tu-dominio.com>`)

### ¿Cómo consigo cada una?

#### Supabase

1. Abre tu proyecto en Supabase.
2. Ve a **Project Settings > API**.
3. Copia:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** -> `SUPABASE_SERVICE_ROLE_KEY`

#### SMTP (correo saliente)

Necesitas un proveedor SMTP (Gmail Workspace, Outlook 365, Zoho, Brevo/Sendinblue, Mailgun, Resend SMTP, etc.).

Con cualquier proveedor, pide estos datos en su panel:

- servidor SMTP -> `SMTP_HOST`
- puerto SMTP -> `SMTP_PORT`
- usuario SMTP -> `SMTP_USER`
- contraseña/API key SMTP -> `SMTP_PASS`
- remitente autorizado -> `SMTP_FROM`

Ejemplo típico:

- `SMTP_HOST=smtp.office365.com`
- `SMTP_PORT=587`
- `SMTP_USER=no-reply@tudominio.com`
- `SMTP_PASS=<clave>`
- `SMTP_FROM="SAVA <no-reply@tudominio.com>"`

## Importante sobre creación de usuarios

La acción de crear usuarios usa `SUPABASE_SERVICE_ROLE_KEY` desde backend (`lib/supabase/admin.ts`).  
Nunca expongas esta llave en frontend.

## Siguiente paso recomendado

Cuando compartas versiones legibles de los diseños (imagen o PDF con texto), adapto estos módulos al UI exacto (maquetación, campos y validaciones finales) para que quede idéntico al diseño docente.
