"use client";

import { useState } from "react";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

type LoginMicrosoftButtonProps = Readonly<{
  loginWithMicrosoft: () => Promise<void>;
}>;

export function LoginMicrosoftButton({ loginWithMicrosoft }: LoginMicrosoftButtonProps) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      await loginWithMicrosoft();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {pending ? <LoadingOverlay label="Conectando con Microsoft 365…" /> : null}
      <button
        type="button"
        className="btn btn--secondary"
        style={{ width: "100%" }}
        disabled={pending}
        aria-busy={pending}
        onClick={onClick}
      >
        {pending ? "Redirigiendo…" : "Ingresar con Microsoft 365"}
      </button>
    </>
  );
}
