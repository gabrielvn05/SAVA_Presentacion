"use client";

import { useId, useState, type ComponentProps } from "react";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

export function PasswordInput({ id, className, ...props }: PasswordInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrap">
      <input
        {...props}
        id={inputId}
        type={visible ? "text" : "password"}
        className={["password-input-wrap__input", className].filter(Boolean).join(" ")}
        autoComplete={props.autoComplete ?? "current-password"}
      />
      <button
        type="button"
        className="password-input-wrap__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        aria-controls={inputId}
        tabIndex={0}
      >
        {visible ? "Ocultar" : "Ver"}
      </button>
    </div>
  );
}
