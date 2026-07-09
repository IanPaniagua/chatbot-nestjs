import Link from 'next/link';
import { createOnboardingCompany, simulateWhatsAppMessage } from './actions';
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

  const defaultCompany = companies.find((company) => company.slug === 'base-whatsapp') ?? companies[0];
  const selectedCompany = params.companyId ?? defaultCompany?.id;
  const selectedCompanyRecord = companies.find((company) => company.id === selectedCompany);

  if (!selectedCompany || !selectedCompanyRecord) {
    return (
      <main className="shell">
        <p>No hay empresas configuradas. Ejecuta `pnpm db:seed`.</p>
      </main>
    );
  }

  const simulatorPreset = getSimulatorPreset(selectedCompanyRecord.slug);

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
          <p className="muted">Vista interna para revisar conversaciones, FAQs y casos humanos.</p>
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
          <Link
            className="button secondary-button"
            href={`/companies/${selectedCompany}/settings`}
            style={{ marginTop: 8 }}
          >
            Configurar
          </Link>
        </form>
      </header>

      <section className="grid">
        <Metric label="Conversaciones hoy" value={metrics.conversationsToday} />
        <Metric label="Derivadas a humano" value={`${metrics.needsHumanPercentage}%`} />
        <Metric label="Flujos estructurados" value={metrics.structuredOrders} />
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
              <option value="normal_order">Consulta general</option>
              <option value="special_order">Solicitud a medida</option>
              <option value="restaurant_order">Empresa/B2B</option>
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
                <span className={`pill ${conversation.status}`}>{STATUS_LABELS[conversation.status]}</span>
              </div>
              <p className="muted">{INTENT_LABELS[conversation.intent]}</p>
              <p>{conversation.messages[0]?.body ?? conversation.summary ?? 'Sin mensajes'}</p>
            </Link>
          ))}

          {conversations.length === 0 ? (
            <div className="empty-list">
              <strong>Sin conversaciones todavía</strong>
              <span className="muted">Esperando actividad entrante.</span>
            </div>
          ) : null}
        </aside>

        <section className="panel">
          <h2>Simular WhatsApp</h2>
          <form className="simulator" action={simulateWhatsAppMessage}>
            <input type="hidden" name="companySlug" value={selectedCompanyRecord.slug} />
            <label>
              Teléfono
              <input name="phone" defaultValue="+34600000000" />
            </label>
            <label>
              Mensaje
              <textarea
                name="body"
                rows={4}
                defaultValue={simulatorPreset.defaultMessage}
                required
              />
            </label>
            <div className="quick-messages">
              {simulatorPreset.quickMessages.map((message) => (
                <button key={message.label} type="submit" name="body" value={message.value}>
                  {message.label}
                </button>
              ))}
            </div>
            <div className="button-row">
              <button type="submit">Enviar mensaje</button>
              <button className="secondary-button" type="submit" name="mode" value="new">
                Nueva simulación
              </button>
            </div>
          </form>
        </section>
      </section>

      <section className="onboarding-panel">
        <div className="section-header">
          <div>
            <h2>Onboarding interno de cliente</h2>
            <p className="muted">
              Alta semi-automática: empresa, configuración base y FAQs iniciales.
            </p>
          </div>
        </div>
        <form className="onboarding-form" action={createOnboardingCompany}>
          <label>
            Nombre del cliente
            <input name="name" placeholder="Ej. Clínica Norte" required />
          </label>
          <label>
            Slug opcional
            <input name="slug" placeholder="clinica-norte" />
          </label>
          <label>
            Email interno
            <input name="internalEmail" type="email" placeholder="equipo@cliente.com" />
          </label>
          <label>
            Web
            <input name="websiteUrl" placeholder="https://cliente.com" />
          </label>
          <label>
            Tienda/reservas
            <input name="onlineStoreUrl" placeholder="https://cliente.com/reservas" />
          </label>
          <label>
            Instagram
            <input name="instagramUrl" placeholder="https://instagram.com/cliente" />
          </label>
          <label>
            Sede principal
            <input name="locationName" placeholder="Principal" />
          </label>
          <label>
            Dirección
            <input name="locationAddress" placeholder="Calle, ciudad" />
          </label>
          <label className="wide-field">
            FAQs iniciales
            <textarea
              name="faqSeed"
              rows={5}
              placeholder={'¿Cuál es el horario?|Abrimos de lunes a viernes...\n¿Dónde estáis?|Estamos en...'}
            />
          </label>
          <div className="wide-field form-footer">
            <span className="muted">Formato FAQ: una línea por pregunta, separando pregunta y respuesta con |.</span>
            <button type="submit">Crear cliente</button>
          </div>
        </form>
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

const STATUS_LABELS = {
  open: 'abierta',
  waiting_customer: 'esperando cliente',
  needs_human: 'requiere humano',
  closed: 'cerrada',
} as const;

const INTENT_LABELS = {
  normal_order: 'Consulta general',
  special_order: 'Solicitud a medida',
  restaurant_order: 'Empresa/B2B',
  faq: 'FAQ',
  human_support: 'Humano',
  unknown: 'Sin clasificar',
} as const;

function getSimulatorPreset(companySlug: string) {
  if (companySlug === 'postres-beinetti') {
    return {
      defaultMessage: 'Hola, quiero una tarta de comunión para 20 personas',
      quickMessages: [
        { label: 'Pedido normal', value: 'Hola, quiero hacer un pedido' },
        { label: 'Tarta especial', value: 'Hola, quiero una tarta de comunión para 20 personas' },
        { label: 'Restaurante', value: 'Soy un restaurante y quiero hacer un pedido' },
        { label: 'FAQ', value: '¿Cuál es vuestro horario?' },
      ],
    };
  }

  if (companySlug === 'clinica-demo') {
    return {
      defaultMessage: 'Hola, quiero pedir una cita para una revisión',
      quickMessages: [
        { label: 'Pedir cita', value: 'Hola, quiero pedir una cita para una revisión' },
        { label: 'Tratamiento', value: 'Necesito información sobre un tratamiento' },
        { label: 'Seguro médico', value: 'Trabajo con una aseguradora y quiero información' },
        { label: 'FAQ', value: '¿Cuál es vuestro horario?' },
      ],
    };
  }

  return {
    defaultMessage: 'Hola, necesito un presupuesto personalizado',
    quickMessages: [
      { label: 'Consulta general', value: 'Hola, quiero información sobre vuestros servicios' },
      { label: 'Solicitud a medida', value: 'Hola, necesito un presupuesto personalizado' },
      { label: 'Empresa/B2B', value: 'Somos una empresa y queremos colaborar' },
      { label: 'FAQ', value: '¿Cuál es vuestro horario?' },
    ],
  };
}
