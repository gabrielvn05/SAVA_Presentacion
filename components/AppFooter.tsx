export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <section className="app-footer__about">
          <h2 className="app-footer__title">Acerca de</h2>
          <p className="app-footer__text">
            SAVA (Sistema de Asistencia y Validaciones Académicas) permite gestionar permisos y
            justificaciones institucionales: crear solicitudes, adjuntar certificados, revisar trámites,
            aprobar o rechazar en el flujo Secretaría → Decanato, administrar usuarios y consultar
            indicadores desde el panel principal.
          </p>
        </section>

        <section className="app-footer__credits">
          <p className="app-footer__label">Desarrollado por</p>
          <ul className="app-footer__developers">
            <li>Anchundia Anchundia Lililiana</li>
            <li>Baque Rodriguez Victor</li>
            <li>Velez Nuñez Gabriel</li>
            <li>Zamora Piguave Miguel</li>
          </ul>
        </section>
      </div>
    </footer>
  );
}
