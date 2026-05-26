const path = require("node:path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultPassword = process.env.SEED_TEST_PASSWORD;

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
if (!defaultPassword) {
  console.error("Falta SEED_TEST_PASSWORD en .env.local (o en .env).");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const users = [
  { email: "superusuario@sava.test", nombres: "Usuario", apellidos: "Supervisor", rol: "superusuario" },
  { email: "decano@sava.test", nombres: "Carlos", apellidos: "Decano", rol: "decano" },
  { email: "secretaria@sava.test", nombres: "Maria", apellidos: "Secretaria", rol: "secretaria" },
  { email: "administrativo@sava.test", nombres: "Ana", apellidos: "Administrativa", rol: "administrativo" }
];

async function findAuthUserIdByEmail(email) {
  const perPage = 200;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) return found.id;
    if (data.users.length < perPage) break;
  }
  return null;
}

async function ensureProfileRow({ id, email, nombres, apellidos, rol }) {
  const { error } = await admin.from("profiles").upsert(
    {
      id,
      email,
      nombres,
      apellidos,
      rol,
      activo: true
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

async function ensureUser(user) {
  const { data: existingProfile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (profileError) throw profileError;
  if (existingProfile) {
    // Si el perfil existe, lo actualizamos para dejar los roles correctos.
    await ensureProfileRow({ id: existingProfile.id, email: user.email, nombres: user.nombres, apellidos: user.apellidos, rol: user.rol });
    console.log("Perfil actualizado (ya existia):", user.email);
    return;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: user.email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      rol: user.rol,
      nombres: user.nombres,
      apellidos: user.apellidos
    }
  });

  if (!createError && created?.user) {
    await ensureProfileRow({ id: created.user.id, ...user });
    console.log("Creado:", user.email);
    return;
  }

  const existingId = await findAuthUserIdByEmail(user.email);
  if (existingId) {
    await ensureProfileRow({ id: existingId, ...user });
    console.log("Perfil agregado (auth ya existia):", user.email);
    return;
  }

  throw new Error(`No se pudo crear ${user.email}: ${createError?.message || "error desconocido"}`);
}

async function main() {
  console.log("Contrasena de prueba:", defaultPassword);
  for (const user of users) {
    try {
      await ensureUser(user);
    } catch (error) {
      console.error(user.email, error.message || error);
    }
  }
  console.log("Listo. Puedes iniciar sesion con los correos @sava.test");
}

main();
