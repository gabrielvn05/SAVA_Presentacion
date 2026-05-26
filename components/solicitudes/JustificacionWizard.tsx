"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { crearSolicitudDesdeWizard } from "@/app/actions";
import { addDaysISO, isoDateUTC, threeMonthsAgoUTC, validateFechaInicioMaxTresMeses } from "@/lib/fechas";

type Tipo = "enfermedad" | "viaje" | "calamidad_domestica" | "falta_marcado";

type Meta = Readonly<{
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  detalle: Record<string, unknown>;
}>;

const TIPOS: ReadonlyArray<Readonly<{ id: Tipo; title: string; description: string }>> = [
  {
    id: "enfermedad",
    title: "Certificado médico",
    description: "Para justificar inasistencias por enfermedad. Debes completar los datos clínicos y adjuntar el certificado PDF generado."
  },
  {
    id: "viaje",
    title: "Permiso por viaje",
    description: "Para seminarios, congresos u otras actividades académicas fuera de la ciudad o país."
  },
  {
    id: "calamidad_domestica",
    title: "Calamidad doméstica",
    description: "Para emergencias o situaciones familiares graves que impidan asistir."
  },
  {
    id: "falta_marcado",
    title: "Justificación de marcado",
    description: "Para justificar el olvido del registro biométrico (entrada o salida)."
  }
];

function Progress({ step }: Readonly<{ step: 0 | 1 | 2 }>) {
  return (
    <div className="row" style={{ gap: 8, marginBottom: "1rem" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 8,
            borderRadius: 999,
            background: i <= step ? "var(--color-success)" : "var(--color-border)"
          }}
        />
      ))}
    </div>
  );
}

function Field({
  label,
  hint,
  children
}: Readonly<{ label: string; hint?: string; children: ReactNode }>) {
  return (
    <div>
      <label>{label}</label>
      {children}
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function JustificacionWizard() {
  const router = useRouter();
  const minFecha = useMemo(() => isoDateUTC(threeMonthsAgoUTC()), []);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [f, setF] = useState<Record<string, string>>({});

  const [meta, setMeta] = useState<Meta | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [firmado, setFirmado] = useState(false);

  const [p12, setP12] = useState<File | null>(null);
  const [p12pass, setP12pass] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  function patchField(key: string, value: string) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  function requireText(key: string, label: string) {
    const v = (f[key] ?? "").trim();
    if (!v) throw new Error(`Completa el campo: ${label}.`);
    return v;
  }

  function buildMeta(): Meta {
    if (!tipo) throw new Error("Selecciona un tipo de solicitud.");

    if (tipo === "enfermedad") {
      const fecha_inasistencia = requireText("fecha_inasistencia", "Fecha de inasistencia");
      const err = validateFechaInicioMaxTresMeses(fecha_inasistencia);
      if (err) throw new Error(err);

      const institucion_medica = requireText("institucion_medica", "Institución médica");
      const medico_tratante = requireText("medico_tratante", "Médico tratante");
      const fecha_emision_certificado = requireText("fecha_emision_certificado", "Fecha de emisión del certificado");
      const diagnostico = requireText("diagnostico", "Diagnóstico");

      const diasReposoRaw = (f.dias_reposo ?? "").trim();
      const dias = diasReposoRaw ? Math.max(0, Math.floor(Number(diasReposoRaw))) : 0;
      if (diasReposoRaw && Number.isNaN(dias)) throw new Error("Días de reposo inválidos.");

      const fecha_fin = dias > 0 ? addDaysISO(fecha_inasistencia, dias) : fecha_inasistencia;

      const detalle: Record<string, unknown> = {
        fecha_inasistencia,
        institucion_medica,
        medico_tratante,
        fecha_emision_certificado,
        dias_reposo: diasReposoRaw ? String(dias) : "",
        diagnostico,
        observaciones: (f.observaciones ?? "").trim()
      };

      return {
        fecha_inicio: fecha_inasistencia,
        fecha_fin,
        motivo: `Certificado médico: ${diagnostico}`,
        detalle
      };
    }

    if (tipo === "viaje") {
      const fecha_inasistencia = requireText("fecha_inasistencia", "Fecha de inasistencia");
      const err = validateFechaInicioMaxTresMeses(fecha_inasistencia);
      if (err) throw new Error(err);

      const destino = requireText("destino", "Destino");
      const fecha_inicio_viaje = requireText("fecha_inicio_viaje", "Fecha de inicio (viaje)");
      const fecha_fin_viaje = requireText("fecha_fin_viaje", "Fecha de fin (viaje)");
      const motivo_viaje = requireText("motivo_viaje", "Motivo del viaje");

      if (fecha_fin_viaje < fecha_inicio_viaje) throw new Error("Las fechas del viaje no son válidas.");

      const detalle: Record<string, unknown> = {
        fecha_inasistencia,
        destino,
        institucion_organizadora: (f.institucion_organizadora ?? "").trim(),
        fecha_inicio_viaje,
        fecha_fin_viaje,
        motivo_viaje,
        observaciones: (f.observaciones ?? "").trim()
      };

      return {
        fecha_inicio: fecha_inicio_viaje,
        fecha_fin: fecha_fin_viaje,
        motivo: `Permiso por viaje: ${destino}`,
        detalle
      };
    }

    if (tipo === "calamidad_domestica") {
      const fecha_inasistencia = requireText("fecha_inasistencia", "Fecha de inasistencia");
      const err = validateFechaInicioMaxTresMeses(fecha_inasistencia);
      if (err) throw new Error(err);

      const tipo_calamidad = requireText("tipo_calamidad", "Tipo de calamidad");
      const descripcion = requireText("descripcion", "Descripción");

      const detalle: Record<string, unknown> = {
        fecha_inasistencia,
        tipo_calamidad,
        descripcion,
        observaciones: (f.observaciones ?? "").trim()
      };

      return {
        fecha_inicio: fecha_inasistencia,
        fecha_fin: fecha_inasistencia,
        motivo: `Calamidad doméstica: ${tipo_calamidad}`,
        detalle
      };
    }

    const fecha_inasistencia = requireText("fecha_inasistencia", "Fecha de inasistencia");
    const err = validateFechaInicioMaxTresMeses(fecha_inasistencia);
    if (err) throw new Error(err);

    const fecha_marcado = requireText("fecha_marcado", "Fecha del marcado");
    const tipo_marcado = requireText("tipo_marcado", "Tipo de marcado");
    const motivo_olvido = requireText("motivo_olvido", "Motivo del olvido");

    const detalle: Record<string, unknown> = {
      fecha_inasistencia,
      fecha_marcado,
      hora_aproximada: (f.hora_aproximada ?? "").trim(),
      tipo_marcado,
      motivo_olvido,
      observaciones: (f.observaciones ?? "").trim()
    };

    return {
      fecha_inicio: fecha_inasistencia,
      fecha_fin: fecha_inasistencia,
      motivo: `Justificación de marcado (${tipo_marcado})`,
      detalle
    };
  }

  async function generarPdf(nextMeta: Meta) {
    if (!tipo) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/certificado/generar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          fecha_inicio: nextMeta.fecha_inicio,
          fecha_fin: nextMeta.fecha_fin,
          motivo: nextMeta.motivo,
          detalle: nextMeta.detalle
        })
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || "No se pudo generar el certificado PDF.");
      }

      const blob = await res.blob();
      setPdfBlob(blob);
      setFirmado(false);
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } finally {
      setBusy(false);
    }
  }

  async function firmarPdf() {
    if (!pdfBlob) {
      setError("Primero genera el certificado.");
      return;
    }
    if (!p12) {
      setError("Selecciona tu archivo .p12.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("pdf", new File([pdfBlob], "certificado.pdf", { type: "application/pdf" }));
      fd.append("p12", p12);
      fd.append("password", p12pass);

      const res = await fetch("/api/certificado/firmar", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || "No se pudo firmar el PDF.");
      }

      const blob = await res.blob();
      setPdfBlob(blob);
      setFirmado(true);
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } finally {
      setBusy(false);
    }
  }

  async function enviar() {
    if (!tipo || !meta || !pdfBlob) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("tipo", tipo);
      fd.append("fecha_inicio", meta.fecha_inicio);
      fd.append("fecha_fin", meta.fecha_fin);
      fd.append("motivo", meta.motivo);
      fd.append("detalle_json", JSON.stringify(meta.detalle));
      fd.append(
        "certificado_pdf",
        new File([pdfBlob], firmado ? "certificado-firmado.pdf" : "certificado.pdf", { type: "application/pdf" })
      );
      const res = await crearSolicitudDesdeWizard(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/solicitudes");
    } finally {
      setBusy(false);
    }
  }

  const tipoSeleccionado = tipo ? TIPOS.find((t) => t.id === tipo) : null;

  return (
    <section className="stack">
      <PageHeader
        title="Nueva solicitud"
        subtitle="Flujo guiado: elige el tipo de trámite, completa el formulario, genera el certificado PDF, y envíalo a revisión (opcionalmente con firma electrónica .p12)."
        actions={
          <div className="row" style={{ gap: 8 }}>
            <Link href="/solicitudes" className="btn btn--secondary btn--sm">
              Volver
            </Link>
            <Link href="/solicitudes/nueva/simple" className="btn btn--secondary btn--sm">
              Formulario simple
            </Link>
          </div>
        }
      />

      <Progress step={step} />

      {error ? (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      ) : null}

      {step === 0 ? (
        <article className="card stack">
          <h2 style={{ margin: 0 }}>Paso 1: Tipo de solicitud</h2>
          <p className="field-hint" style={{ marginTop: 0 }}>
            Selecciona la opción que mejor describa tu caso. Esto define los campos del formulario y el texto del certificado PDF.
          </p>

          <div className="wizard-tipo-grid">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`wizard-tipo-card ${tipo === t.id ? "wizard-tipo-card--active" : ""}`}
                onClick={() => {
                  setTipo(t.id);
                  setF({});
                  setError(null);
                }}
              >
                <strong className="wizard-tipo-card__title">{t.title}</strong>
                <span className="field-hint wizard-tipo-card__desc">{t.description}</span>
              </button>
            ))}
          </div>

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button
              className="btn btn--primary"
              type="button"
              disabled={!tipo}
              onClick={() => {
                setError(null);
                setStep(1);
              }}
            >
              Continuar
            </button>
          </div>
        </article>
      ) : null}

      {step === 1 && tipo ? (
        <article className="card stack" style={{ maxWidth: 900 }}>
          <h2 style={{ margin: 0 }}>Paso 2: Datos del trámite</h2>
          <p className="field-hint" style={{ marginTop: 0 }}>
            {tipoSeleccionado?.description} La fecha de inasistencia no puede ser anterior a {minFecha} (ventana de 3 meses).
          </p>

          <div className="stack">
            <Field label="Fecha de inasistencia *" hint="Se valida contra la fecha actual (máximo 3 meses hacia atrás).">
              <input type="date" value={f.fecha_inasistencia ?? ""} min={minFecha} onChange={(e) => patchField("fecha_inasistencia", e.target.value)} required />
            </Field>

            {tipo === "enfermedad" ? (
              <>
                <hr style={{ border: 0, borderTop: "1px solid var(--color-border)" }} />
                <h3 style={{ margin: 0 }}>Datos del certificado médico</h3>
                <div className="form-grid form-grid--2">
                  <Field label="Institución médica *">
                    <select value={f.institucion_medica ?? ""} onChange={(e) => patchField("institucion_medica", e.target.value)} required>
                      <option value="">Seleccionar</option>
                      <option value="IESS">IESS</option>
                      <option value="Ministerio de Salud Pública">Ministerio de Salud Pública</option>
                      <option value="Hospital privado">Hospital privado</option>
                      <option value="Centro de salud">Centro de salud</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </Field>
                  <Field label="Médico tratante *">
                    <input value={f.medico_tratante ?? ""} onChange={(e) => patchField("medico_tratante", e.target.value)} placeholder="Dr. Juan Pérez" required />
                  </Field>
                  <Field label="Fecha de emisión del certificado *">
                    <input type="date" value={f.fecha_emision_certificado ?? ""} onChange={(e) => patchField("fecha_emision_certificado", e.target.value)} required />
                  </Field>
                  <Field label="Días de reposo" hint="Si no aplica, déjalo vacío (se usará el mismo día de la inasistencia).">
                    <input value={f.dias_reposo ?? ""} onChange={(e) => patchField("dias_reposo", e.target.value)} placeholder="Ej: 3" inputMode="numeric" />
                  </Field>
                </div>
                <Field label="Diagnóstico *">
                  <textarea rows={4} value={f.diagnostico ?? ""} onChange={(e) => patchField("diagnostico", e.target.value)} required />
                </Field>
                <Field label="Observaciones adicionales">
                  <textarea rows={3} value={f.observaciones ?? ""} onChange={(e) => patchField("observaciones", e.target.value)} />
                </Field>
              </>
            ) : null}

            {tipo === "viaje" ? (
              <>
                <hr style={{ border: 0, borderTop: "1px solid var(--color-border)" }} />
                <h3 style={{ margin: 0 }}>Datos del permiso por viaje</h3>
                <div className="form-grid form-grid--2">
                  <Field label="Destino *">
                    <input value={f.destino ?? ""} onChange={(e) => patchField("destino", e.target.value)} placeholder="Ej: Quito, Ecuador" required />
                  </Field>
                  <Field label="Institución organizadora">
                    <input
                      value={f.institucion_organizadora ?? ""}
                      onChange={(e) => patchField("institucion_organizadora", e.target.value)}
                      placeholder="Ej: Universidad Central"
                    />
                  </Field>
                  <Field label="Fecha de inicio *">
                    <input type="date" value={f.fecha_inicio_viaje ?? ""} onChange={(e) => patchField("fecha_inicio_viaje", e.target.value)} required />
                  </Field>
                  <Field label="Fecha de fin *">
                    <input type="date" value={f.fecha_fin_viaje ?? ""} onChange={(e) => patchField("fecha_fin_viaje", e.target.value)} required />
                  </Field>
                </div>
                <Field label="Motivo del viaje *">
                  <textarea rows={4} value={f.motivo_viaje ?? ""} onChange={(e) => patchField("motivo_viaje", e.target.value)} required />
                </Field>
                <Field label="Observaciones adicionales">
                  <textarea rows={3} value={f.observaciones ?? ""} onChange={(e) => patchField("observaciones", e.target.value)} />
                </Field>
              </>
            ) : null}

            {tipo === "calamidad_domestica" ? (
              <>
                <hr style={{ border: 0, borderTop: "1px solid var(--color-border)" }} />
                <h3 style={{ margin: 0 }}>Datos de calamidad doméstica</h3>
                <Field label="Tipo de calamidad *">
                  <select value={f.tipo_calamidad ?? ""} onChange={(e) => patchField("tipo_calamidad", e.target.value)} required>
                    <option value="">Seleccionar</option>
                    <option value="Fallecimiento de familiar">Fallecimiento de familiar</option>
                    <option value="Accidente de familiar">Accidente de familiar</option>
                    <option value="Enfermedad grave de familiar">Enfermedad grave de familiar</option>
                    <option value="Desastre natural">Desastre natural</option>
                    <option value="Otro">Otro</option>
                  </select>
                </Field>
                <Field label="Descripción *">
                  <textarea rows={5} value={f.descripcion ?? ""} onChange={(e) => patchField("descripcion", e.target.value)} required />
                </Field>
                <Field label="Observaciones adicionales">
                  <textarea rows={3} value={f.observaciones ?? ""} onChange={(e) => patchField("observaciones", e.target.value)} />
                </Field>
              </>
            ) : null}

            {tipo === "falta_marcado" ? (
              <>
                <hr style={{ border: 0, borderTop: "1px solid var(--color-border)" }} />
                <h3 style={{ margin: 0 }}>Datos de justificación de marcado</h3>
                <div className="form-grid form-grid--2">
                  <Field label="Fecha del marcado *">
                    <input type="date" value={f.fecha_marcado ?? ""} onChange={(e) => patchField("fecha_marcado", e.target.value)} required />
                  </Field>
                  <Field label="Hora aproximada">
                    <input type="time" value={f.hora_aproximada ?? ""} onChange={(e) => patchField("hora_aproximada", e.target.value)} />
                  </Field>
                  <Field label="Tipo de marcado *">
                    <select value={f.tipo_marcado ?? ""} onChange={(e) => patchField("tipo_marcado", e.target.value)} required>
                      <option value="">Seleccionar</option>
                      <option value="Entrada">Entrada</option>
                      <option value="Salida">Salida</option>
                    </select>
                  </Field>
                </div>
                <Field label="Motivo del olvido *">
                  <textarea rows={4} value={f.motivo_olvido ?? ""} onChange={(e) => patchField("motivo_olvido", e.target.value)} required />
                </Field>
                <Field label="Observaciones adicionales">
                  <textarea rows={3} value={f.observaciones ?? ""} onChange={(e) => patchField("observaciones", e.target.value)} />
                </Field>
              </>
            ) : null}
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="btn btn--secondary" type="button" onClick={() => setStep(0)}>
              Atrás
            </button>
            <button
              className="btn btn--primary"
              type="button"
              disabled={busy}
              onClick={async () => {
                try {
                  const m = buildMeta();
                  setMeta(m);
                  setStep(2);
                  setError(null);
                  await generarPdf(m);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Revisa el formulario.");
                }
              }}
            >
              Generar certificado y continuar
            </button>
          </div>
        </article>
      ) : null}

      {step === 2 && tipo && meta ? (
        <article className="stack">
          <div className="card stack">
            <h2 style={{ margin: 0 }}>Paso 3: Certificado PDF</h2>
            <p className="field-hint" style={{ marginTop: 0 }}>
              Aquí puedes revisar el PDF generado con tus datos. Puedes descargarlo para archivo personal, firmarlo electrónicamente con tu{" "}
              <strong>.p12</strong> (no guardamos el certificado ni la contraseña en base de datos), y finalmente enviarlo al flujo de Secretaría/Decanato.
            </p>

            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn--secondary btn--sm" type="button" disabled={!pdfUrl || busy} onClick={() => generarPdf(meta)}>
                Regenerar PDF
              </button>
              {pdfUrl ? (
                <a className="btn btn--secondary btn--sm" href={pdfUrl} download="certificado-justificacion.pdf">
                  Descargar
                </a>
              ) : null}
            </div>
          </div>

          <div className="card stack">
            <h3 style={{ margin: 0 }}>Previsualización</h3>
            <p className="field-hint" style={{ marginTop: 0 }}>
              Si tu navegador no muestra el visor embebido, usa “Descargar”.
            </p>
            {pdfUrl ? (
              <iframe title="Previsualización PDF" src={pdfUrl} style={{ width: "100%", height: 720, border: "1px solid var(--color-border)" }} />
            ) : (
              <p className="field-hint">{busy ? "Generando PDF..." : "Aún no hay PDF."}</p>
            )}
          </div>

          <div className="card stack" style={{ maxWidth: 720 }}>
            <h3 style={{ margin: 0 }}>Firma electrónica (.p12)</h3>
            <p className="field-hint" style={{ marginTop: 0 }}>
              Selecciona tu archivo de certificado y escribe la contraseña. Esto ocurre en el servidor solo para firmar el PDF en este momento; no almacenamos el{" "}
              <strong>.p12</strong> ni la clave.
            </p>

            <Field label="Archivo .p12">
              <input
                className="file-input"
                type="file"
                accept=".p12,.pfx,application/x-pkcs12"
                onChange={(e) => setP12(e.target.files?.[0] ?? null)}
              />
            </Field>
            <Field label="Contraseña del certificado">
              <input type="password" value={p12pass} onChange={(e) => setP12pass(e.target.value)} autoComplete="one-time-code" />
            </Field>

            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn--secondary" type="button" disabled={busy} onClick={() => firmarPdf()}>
                Firmar PDF
              </button>
              {firmado ? <span className="topbar__pill">Firmado</span> : <span className="field-hint">Opcional</span>}
            </div>
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button
              className="btn btn--secondary"
              type="button"
              disabled={busy}
              onClick={() => {
                setStep(1);
                setError(null);
              }}
            >
              Atrás
            </button>
            <button className="btn btn--primary" type="button" disabled={busy || !pdfBlob} onClick={() => enviar()}>
              Enviar a revisión
            </button>
          </div>
        </article>
      ) : null}
    </section>
  );
}
