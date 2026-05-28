"use client";

import { useCallback, useId, useRef, type ComponentProps } from "react";

type DateInputProps = Omit<ComponentProps<"input">, "type"> & {
  id?: string;
};

export function DateInput({ id, className, onClick, ...props }: DateInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const ref = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
      } catch {
        // Algunos navegadores bloquean showPicker fuera de gesto directo del usuario.
      }
    }
  }, []);

  return (
    <div className="date-input-wrap">
      <input
        {...props}
        ref={ref}
        id={inputId}
        type="date"
        className={["date-input-wrap__input", className].filter(Boolean).join(" ")}
        onClick={(e) => {
          onClick?.(e);
          openPicker();
        }}
      />
    </div>
  );
}
