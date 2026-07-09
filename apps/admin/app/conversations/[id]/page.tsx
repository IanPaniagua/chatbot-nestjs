import Link from 'next/link';
import {
  addInternalNote,
  resetConversationFlow,
  sendManualMessage,
  updateConversationStatus,
} from '../../actions';
import { apiFetch } from '../../api';
import { ConnectionState } from '../../connection-state';
import { CopyButton } from '../../copy-button';
import { ConversationDetail } from '../../types';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ companyId?: string }>;
}

export default async function ConversationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const companyId = query.companyId;

  if (!companyId) {
    return (
      <main className="shell">
        <p>Falta `companyId`.</p>
      </main>
    );
  }

  let conversation: ConversationDetail;

  try {
    conversation = await apiFetch<ConversationDetail>(
      `/conversations/${id}?companyId=${companyId}`,
    );
  } catch {
    return <ConnectionState />;
  }

  const collectedEntries = getCollectedDataEntries(conversation.collectedData);
  const summaryText = buildCopySummary(conversation, collectedEntries);

  return (
    <main className="shell">
      <Link className="button" href={`/?companyId=${companyId}`}>
        Volver
      </Link>

      <section className="panel" style={{ marginTop: 18 }}>
        <header className="conversation-header">
          <div>
            <div className="eyebrow">{conversation.intent}</div>
            <h1>{conversation.contact.displayName ?? conversation.contact.phone ?? 'Contacto'}</h1>
            <p className="muted">{conversation.contact.externalId}</p>
          </div>
          <form action={updateConversationStatus}>
            <input type="hidden" name="companyId" value={companyId} />
            <input type="hidden" name="conversationId" value={conversation.id} />
            <select name="status" defaultValue={conversation.status}>
              <option value="open">Open</option>
              <option value="waiting_customer">Waiting customer</option>
              <option value="needs_human">Needs human</option>
              <option value="closed">Closed</option>
            </select>
            <button type="submit" style={{ marginTop: 8 }}>
              Guardar estado
            </button>
          </form>
        </header>

        <form className="inline-action-form" action={resetConversationFlow}>
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="conversationId" value={conversation.id} />
          <button className="secondary-button" type="submit">
            Resetear flujo
          </button>
          <span className="muted">Útil cuando una prueba queda enganchada en preguntas anteriores.</span>
        </form>

        <section className="detail-grid">
          <article className="info-box">
            <span className="muted">Estado</span>
            <strong>{conversation.status}</strong>
          </article>
          <article className="info-box">
            <span className="muted">Intención</span>
            <strong>{conversation.intent}</strong>
          </article>
          <article className="info-box">
            <span className="muted">Última actualización</span>
            <strong>{new Date(conversation.updatedAt).toLocaleString('es-ES')}</strong>
          </article>
        </section>

        <section className="summary-card">
          <div className="section-header">
            <div>
              <h2>Resumen para el equipo</h2>
              <p className="muted">Información preparada para revisión interna.</p>
            </div>
            <CopyButton text={summaryText} />
          </div>
          <div className="summary">{conversation.summary ?? summaryText}</div>
        </section>

        <section className="data-card">
          <div className="section-header">
            <div>
              <h2>Datos recogidos</h2>
              <p className="muted">Campos capturados durante el flujo conversacional.</p>
            </div>
          </div>

          {collectedEntries.length > 0 ? (
            <dl className="data-list">
              {collectedEntries.map((entry) => (
                <div className="data-row" key={entry.key}>
                  <dt>{entry.label}</dt>
                  <dd>{entry.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="empty-list">
              <strong>Sin datos estructurados todavía</strong>
              <span className="muted">El bot los irá completando cuando avance el flujo.</span>
            </div>
          )}
        </section>

        <section className="section-stack">
          <h2>Mensajes</h2>
          <div className="messages">
            {conversation.messages.map((message) => (
              <article key={message.id} className={`message ${message.direction}`}>
                <div className="message-meta">
                  <strong>{message.direction === 'inbound' ? 'Cliente' : 'Bot'}</strong>
                  <span>{new Date(message.createdAt).toLocaleString('es-ES')}</span>
                </div>
                <div>{message.body}</div>
              </article>
            ))}
          </div>
        </section>

        <form className="note-form" action={sendManualMessage}>
          <h2>Responder al cliente</h2>
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="conversationId" value={conversation.id} />
          <textarea
            name="body"
            rows={4}
            placeholder="Escribe una respuesta manual para enviar por WhatsApp"
            required
          />
          <button type="submit" style={{ marginTop: 10 }}>
            Enviar respuesta
          </button>
        </form>

        <form className="note-form" action={addInternalNote}>
          <h2>Nota interna</h2>
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="conversationId" value={conversation.id} />
          <textarea name="body" rows={4} placeholder="Añadir nota para el equipo" required />
          <button type="submit" style={{ marginTop: 10 }}>
            Añadir nota
          </button>
        </form>

        {conversation.notes.length > 0 ? (
          <section style={{ marginTop: 18 }}>
            <h2>Notas</h2>
            {conversation.notes.map((note) => (
              <div className="row" key={note.id}>
                <p>{note.body}</p>
                <p className="muted">
                  {note.author ?? 'admin'} · {new Date(note.createdAt).toLocaleString('es-ES')}
                </p>
              </div>
            ))}
          </section>
        ) : null}
      </section>
    </main>
  );
}

const DATA_LABELS: Record<string, string> = {
  appointmentReason: 'Motivo de la cita',
  budget: 'Presupuesto',
  businessName: 'Empresa',
  contactName: 'Contacto',
  date: 'Fecha',
  deliveryDate: 'Fecha/hora',
  flavor: 'Sabor',
  items: 'Productos y cantidades',
  need: 'Necesidad',
  notes: 'Observaciones',
  patientName: 'Paciente',
  pickupDate: 'Fecha de recogida',
  pickupLocation: 'Tienda de recogida',
  preferredDate: 'Fecha preferida',
  request: 'Solicitud',
  service: 'Servicio',
  servings: 'Personas',
  theme: 'Temática',
  urgency: 'Urgencia',
  volume: 'Volumen/frecuencia',
};

function getCollectedDataEntries(data?: Record<string, unknown> | null) {
  if (!data) {
    return [];
  }

  return Object.entries(data)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .map(([key, value]) => ({
      key,
      label: DATA_LABELS[key] ?? humanizeKey(key),
      value: formatValue(value),
    }));
}

function humanizeKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(formatValue).join(', ');
  }

  return JSON.stringify(value, null, 2);
}

function buildCopySummary(
  conversation: ConversationDetail,
  collectedEntries: Array<{ label: string; value: string }>,
) {
  const contact =
    conversation.contact.displayName ?? conversation.contact.phone ?? conversation.contact.externalId;
  const lines = [
    `Contacto: ${contact}`,
    `Estado: ${conversation.status}`,
    `Intención: ${conversation.intent}`,
  ];

  if (conversation.summary) {
    lines.push('', conversation.summary);
  }

  if (collectedEntries.length > 0) {
    lines.push('', 'Datos recogidos:');
    for (const entry of collectedEntries) {
      lines.push(`- ${entry.label}: ${entry.value}`);
    }
  }

  return lines.join('\n');
}
