interface ConnectionStateProps {
  title?: string;
  message?: string;
}

export function ConnectionState({
  title = 'API no disponible',
  message = 'El panel no pudo conectar con el backend.',
}: ConnectionStateProps) {
  return (
    <main className="shell">
      <section className="empty-state">
        <div className="eyebrow">Estado del sistema</div>
        <h1>{title}</h1>
        <p className="muted">{message}</p>
        <div className="checklist">
          <p>Comprueba que el backend esté escuchando en `http://localhost:4000`.</p>
          <p>Arranca todo desde la raíz del proyecto con `pnpm dev`.</p>
          <p>Si acabas de cambiar `.env`, reinicia el proceso de desarrollo.</p>
        </div>
      </section>
    </main>
  );
}
