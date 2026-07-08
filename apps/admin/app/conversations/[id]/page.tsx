import Link from 'next/link';
import { addInternalNote, updateConversationStatus } from '../../actions';
import { apiFetch } from '../../api';
import { ConnectionState } from '../../connection-state';
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

        {conversation.summary ? <div className="summary">{conversation.summary}</div> : null}

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
