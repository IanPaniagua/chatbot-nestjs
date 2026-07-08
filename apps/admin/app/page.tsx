import Link from 'next/link';
import { apiFetch } from './api';
import { ConnectionState } from './connection-state';
import { Company, ConversationListItem, MetricsOverview } from './types';

interface PageProps {
  searchParams?: Promise<{ companyId?: string; status?: string; intent?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  let companies: Company[];

  try {
    companies = await apiFetch<Company[]>('/companies');
  } catch {
    return <ConnectionState />;
  }

  const selectedCompany = params.companyId ?? companies[0]?.id;

  if (!selectedCompany) {
    return (
      <main className="shell">
        <p>No hay empresas configuradas. Ejecuta `pnpm db:seed`.</p>
      </main>
    );
  }

  const query = new URLSearchParams({ companyId: selectedCompany });
  if (params.status) query.set('status', params.status);
  if (params.intent) query.set('intent', params.intent);

  let conversations: ConversationListItem[];
  let metrics: MetricsOverview;

  try {
    [conversations, metrics] = await Promise.all([
      apiFetch<ConversationListItem[]>(`/conversations?${query.toString()}`),
      apiFetch<MetricsOverview>(`/metrics/overview?companyId=${selectedCompany}`),
    ]);
  } catch {
    return <ConnectionState />;
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">Chatbot Admin</div>
          <h1>Bandeja de conversaciones</h1>
          <p className="muted">Vista interna para revisar pedidos, FAQs y casos humanos.</p>
        </div>
        <form>
          <select name="companyId" defaultValue={selectedCompany}>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <button type="submit" style={{ marginTop: 8 }}>
            Cambiar
          </button>
        </form>
      </header>

      <section className="grid">
        <Metric label="Conversaciones hoy" value={metrics.conversationsToday} />
        <Metric label="Derivadas a humano" value={`${metrics.needsHumanPercentage}%`} />
        <Metric label="Pedidos estructurados" value={metrics.structuredOrders} />
        <Metric label="FAQs respondidas" value={metrics.faqAnswered} />
      </section>

      <section className="layout">
        <aside className="panel">
          <h2>Filtros</h2>
          <form className="filters">
            <input type="hidden" name="companyId" value={selectedCompany} />
            <select name="status" defaultValue={params.status ?? ''}>
              <option value="">Estado</option>
              <option value="open">Open</option>
              <option value="waiting_customer">Waiting customer</option>
              <option value="needs_human">Needs human</option>
              <option value="closed">Closed</option>
            </select>
            <select name="intent" defaultValue={params.intent ?? ''}>
              <option value="">Intención</option>
              <option value="normal_order">Pedido normal</option>
              <option value="special_order">Tarta especial</option>
              <option value="restaurant_order">Restaurante</option>
              <option value="faq">FAQ</option>
              <option value="human_support">Humano</option>
              <option value="unknown">Desconocido</option>
            </select>
            <button type="submit">Filtrar</button>
          </form>

          {conversations.map((conversation) => (
            <Link
              className="row"
              key={conversation.id}
              href={`/conversations/${conversation.id}?companyId=${selectedCompany}`}
            >
              <div className="row-title">
                <span>{conversation.contact.displayName ?? conversation.contact.phone ?? 'Contacto'}</span>
                <span className={`pill ${conversation.status}`}>{conversation.status}</span>
              </div>
              <p className="muted">{conversation.intent}</p>
              <p>{conversation.messages[0]?.body ?? conversation.summary ?? 'Sin mensajes'}</p>
            </Link>
          ))}
        </aside>

        <section className="panel">
          <h2>Operación</h2>
          <p className="muted">
            Selecciona una conversación para revisar mensajes, datos recogidos y cambiar estado.
          </p>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span className="muted">{label}</span>
    </div>
  );
}
