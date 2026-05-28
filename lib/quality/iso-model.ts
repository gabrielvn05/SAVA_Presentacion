/**
 * Modelo de calidad alineado con ISO/IEC 25023 (calidad del producto)
 * e ISO/IEC 25022 (calidad en uso), derivado de la familia SQuaRE (25010).
 *
 * Cada característica se traduce en requisitos verificables en SAVA.
 */

/** ISO/IEC 25023 — características de calidad del producto de software */
export const ISO_25023_PRODUCT = {
  functional_suitability: {
    id: "functional_suitability",
    label: "Idoneidad funcional",
    measures: [
      "Completitud de flujos (solicitud, aprobación, certificado PDF)",
      "Corrección de reglas de negocio (fechas, roles, workflow)",
      "Pertinencia de campos según tipo de trámite"
    ]
  },
  performance_efficiency: {
    id: "performance_efficiency",
    label: "Eficiencia del desempeño",
    measures: ["Tiempos de respuesta en acciones críticas", "Indicadores de carga en operaciones largas"]
  },
  compatibility: {
    id: "compatibility",
    label: "Compatibilidad",
    measures: ["Navegadores modernos", "Diseño adaptable (móvil/escritorio)"]
  },
  usability: {
    id: "usability",
    label: "Capacidad de uso",
    measures: [
      "Etiquetas y mensajes en español claro",
      "Foco visible y navegación por teclado",
      "Áreas táctiles mínimas (44px)",
      "Retroalimentación de carga y errores"
    ]
  },
  reliability: {
    id: "reliability",
    label: "Fiabilidad",
    measures: ["Manejo de errores de autenticación y API", "Estados vacíos y recuperación"]
  },
  security: {
    id: "security",
    label: "Seguridad",
    measures: ["Autenticación Supabase", "Autorización por rol", "No exponer datos sensibles en cliente"]
  },
  maintainability: {
    id: "maintainability",
    label: "Mantenibilidad",
    measures: ["Módulos por dominio (lib/, components/)", "Tipado TypeScript"]
  },
  portability: {
    id: "portability",
    label: "Portabilidad",
    measures: ["Despliegue Next.js", "Variables de entorno documentadas"]
  }
} as const;

/** ISO/IEC 25022 — características de calidad en uso */
export const ISO_25022_IN_USE = {
  effectiveness: {
    id: "effectiveness",
    label: "Efectividad",
    measures: ["El usuario completa el trámite sin pasos redundantes", "Tareas críticas registradas en métricas"]
  },
  efficiency: {
    id: "efficiency",
    label: "Eficiencia",
    measures: ["Formularios compactos", "Menos clics en fechas y contraseña"]
  },
  satisfaction: {
    id: "satisfaction",
    label: "Satisfacción",
    measures: ["Interfaz institucional coherente", "Mensajes comprensibles"]
  },
  freedom_from_risk: {
    id: "freedom_from_risk",
    label: "Libertad de riesgo",
    measures: ["Validación de fechas y permisos", "Confirmaciones en rechazos"]
  },
  context_coverage: {
    id: "context_coverage",
    label: "Cobertura de contexto",
    measures: ["Roles diferenciados", "Acceso público vs. autenticado"]
  }
} as const;

export type Iso25023Id = keyof typeof ISO_25023_PRODUCT;
export type Iso25022Id = keyof typeof ISO_25022_IN_USE;

/** Requisitos transversales implementados en la UI (referencia para auditoría). */
export const SAVA_QUALITY_REQUIREMENTS = [
  { standard: "25023", characteristic: "usability", requirement: "Skip link y foco visible en controles interactivos" },
  { standard: "25023", characteristic: "usability", requirement: "Campos de fecha con área clicable completa" },
  { standard: "25023", characteristic: "usability", requirement: "Contraseña con alternativa mostrar/ocultar" },
  { standard: "25022", characteristic: "efficiency", requirement: "Indicador de carga al iniciar sesión" },
  { standard: "25022", characteristic: "effectiveness", requirement: "Métricas de tareas (inicio/fin/éxito) en flujos clave" },
  { standard: "25023", characteristic: "usability", requirement: "Respeto de prefers-reduced-motion" }
] as const;
