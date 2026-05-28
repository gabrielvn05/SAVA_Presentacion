"use client";

import { useState, type FormEvent } from "react";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { PasswordInput } from "@/components/ui/PasswordInput";

type LoginFormProps = Readonly<{
  loginAction: (formData: FormData) => Promise<void>;
}>;

export function LoginForm({ loginAction }: LoginFormProps) {
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      await loginAction(new FormData(e.currentTarget));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack" aria-label="Inicio de sesión con correo y contraseña">
      {pending ? <LoadingOverlay label="Iniciando sesión…" /> : null}
      <div>
        <label htmlFor="email">Correo institucional</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="usuario@institucion.edu"
          required
          autoComplete="email"
          disabled={pending}
        />
      </div>
      <div>
        <label htmlFor="password">Contraseña</label>
        <PasswordInput id="password" name="password" placeholder="••••••••" required disabled={pending} />
      </div>
      <button className="btn btn--primary" type="submit" style={{ width: "100%" }} disabled={pending} aria-busy={pending}>
        {pending ? "Entrando…" : "Entrar al sistema"}
      </button>
    </form>
  );
}
