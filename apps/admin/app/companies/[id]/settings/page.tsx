import Link from 'next/link';
import { updateCompanySettings } from '../../../actions';
import { apiFetch } from '../../../api';
import { ConnectionState } from '../../../connection-state';
import { CompanyDetail } from '../../../types';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string }>;
}

export default async function CompanySettingsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  let company: CompanyDetail;

  try {
    company = await apiFetch<CompanyDetail>(`/companies/${id}`);
  } catch {
    return <ConnectionState />;
  }

  const settings = company.config.settings;
  const location = settings.locations[0];
  const specialFlow = settings.flows.special_order;
  const restaurantFlow = settings.flows.restaurant_order;

  return (
    <main className="shell">
      <Link className="button" href={`/?companyId=${company.id}`}>
        Volver
      </Link>

      <section className="panel" style={{ marginTop: 18 }}>
        <header className="section-header">
          <div>
            <div className="eyebrow">Configuración</div>
            <h1>{company.name}</h1>
            <p className="muted">{company.slug}</p>
          </div>
        </header>

        <form className="settings-form" action={updateCompanySettings}>
          <input type="hidden" name="companyId" value={company.id} />

          {query.saved === '1' ? (
            <div className="success-banner" role="status">
              Configuración guardada correctamente.
            </div>
          ) : null}

          <section className="settings-section">
            <h2>Datos básicos</h2>
            <label>
              Nombre
              <input name="name" defaultValue={company.name} required />
            </label>
            <label>
              Email interno
              <input
                name="internalEmail"
                type="email"
                defaultValue={settings.internalEmail ?? ''}
                placeholder="equipo@empresa.com"
              />
            </label>
            <label>
              Web
              <input name="websiteUrl" defaultValue={settings.websiteUrl ?? ''} />
            </label>
            <label>
              Tienda/reservas
              <input name="onlineStoreUrl" defaultValue={settings.onlineStoreUrl ?? ''} />
            </label>
            <label>
              Instagram
              <input name="instagramUrl" defaultValue={settings.instagramUrl ?? ''} />
            </label>
            <label>
              Sede principal
              <input name="locationName" defaultValue={location?.name ?? ''} />
            </label>
            <label className="wide-field">
              Dirección
              <input name="locationAddress" defaultValue={location?.address ?? ''} />
            </label>
          </section>

          <section className="settings-section">
            <h2>Mensajes</h2>
            <label className="wide-field">
              Saludo
              <textarea name="greeting" rows={3} defaultValue={settings.messages.greeting} required />
            </label>
            <label className="wide-field">
              Fallback
              <textarea name="fallback" rows={3} defaultValue={settings.messages.fallback} required />
            </label>
            <label className="wide-field">
              Derivación humana
              <textarea
                name="humanHandoff"
                rows={3}
                defaultValue={settings.messages.humanHandoff}
                required
              />
            </label>
            <label className="wide-field">
              Redirección general
              <textarea
                name="normalOrderRedirect"
                rows={4}
                defaultValue={settings.messages.normalOrderRedirect}
                required
              />
            </label>
            <label className="wide-field">
              Aclaración
              <textarea
                name="clarificationPrompt"
                rows={3}
                defaultValue={settings.messages.clarificationPrompt ?? ''}
              />
            </label>
            <label className="wide-field">
              Capacidades
              <textarea
                name="capabilities"
                rows={4}
                defaultValue={settings.messages.capabilities ?? ''}
              />
            </label>
            <label>
              Gracias
              <textarea
                name="courtesyThanks"
                rows={3}
                defaultValue={settings.messages.courtesyThanks ?? ''}
              />
            </label>
            <label>
              Despedida
              <textarea
                name="courtesyGoodbye"
                rows={3}
                defaultValue={settings.messages.courtesyGoodbye ?? ''}
              />
            </label>
            <label className="wide-field">
              Reanudar flujo
              <textarea
                name="flowResumePrompt"
                rows={3}
                defaultValue={settings.messages.flowResumePrompt ?? ''}
              />
            </label>
            <label>
              Continuar flujo
              <textarea
                name="flowContinuePrefix"
                rows={2}
                defaultValue={settings.messages.flowContinuePrefix ?? ''}
              />
            </label>
            <label>
              Dato incompleto
              <textarea
                name="flowLowInformation"
                rows={3}
                defaultValue={settings.messages.flowLowInformation ?? ''}
              />
            </label>
          </section>

          <section className="settings-section">
            <h2>Keywords</h2>
            <label>
              Consulta general
              <textarea
                name="normalOrderKeywords"
                rows={4}
                defaultValue={formatKeywords(settings.routingKeywords.normal_order)}
              />
            </label>
            <label>
              Solicitud a medida
              <textarea
                name="specialOrderKeywords"
                rows={4}
                defaultValue={formatKeywords(settings.routingKeywords.special_order)}
              />
            </label>
            <label>
              Empresa/B2B
              <textarea
                name="restaurantOrderKeywords"
                rows={4}
                defaultValue={formatKeywords(settings.routingKeywords.restaurant_order)}
              />
            </label>
            <label>
              FAQ
              <textarea
                name="faqKeywords"
                rows={4}
                defaultValue={formatKeywords(settings.routingKeywords.faq)}
              />
            </label>
            <label className="wide-field">
              Humano
              <textarea
                name="humanSupportKeywords"
                rows={4}
                defaultValue={formatKeywords(settings.routingKeywords.human_support)}
              />
            </label>
          </section>

          <section className="settings-section">
            <h2>Flujos</h2>
            <label className="wide-field">
              Solicitud a medida · bienvenida
              <textarea
                name="specialFlowWelcome"
                rows={3}
                defaultValue={specialFlow?.welcome ?? ''}
              />
            </label>
            <label className="wide-field">
              Solicitud a medida · campos
              <textarea
                name="specialFlowFields"
                rows={8}
                defaultValue={formatFlowFields(specialFlow?.requiredFields)}
              />
            </label>
            <label className="wide-field">
              Solicitud a medida · cierre
              <textarea
                name="specialFlowCompletion"
                rows={3}
                defaultValue={specialFlow?.completionMessage ?? ''}
              />
            </label>
            <label className="wide-field">
              Empresa/B2B · bienvenida
              <textarea
                name="restaurantFlowWelcome"
                rows={3}
                defaultValue={restaurantFlow?.welcome ?? ''}
              />
            </label>
            <label className="wide-field">
              Empresa/B2B · campos
              <textarea
                name="restaurantFlowFields"
                rows={7}
                defaultValue={formatFlowFields(restaurantFlow?.requiredFields)}
              />
            </label>
            <label className="wide-field">
              Empresa/B2B · cierre
              <textarea
                name="restaurantFlowCompletion"
                rows={3}
                defaultValue={restaurantFlow?.completionMessage ?? ''}
              />
            </label>
            <p className="muted wide-field">
              Formato de campos: key|label|pregunta|optional. Una línea por campo.
            </p>
          </section>

          <section className="settings-section">
            <h2>FAQs</h2>
            <label className="wide-field">
              Base de conocimiento
              <textarea name="faqSeed" rows={12} defaultValue={formatFaqs(settings.faqs)} />
            </label>
            <p className="muted">
              Formato: pregunta|respuesta|keywords separadas por coma. Una FAQ por línea.
            </p>
          </section>

          <div className="form-footer">
            <span className="muted">Los cambios se aplican al bot y a la base de conocimiento.</span>
            <button type="submit">Guardar configuración</button>
          </div>
        </form>
      </section>
    </main>
  );
}

function formatKeywords(keywords?: string[]) {
  return (keywords ?? []).join(', ');
}

function formatFaqs(faqs: CompanyDetail['config']['settings']['faqs']) {
  return faqs
    .map((faq) => `${faq.question}|${faq.answer}|${faq.keywords.join(', ')}`)
    .join('\n');
}

function formatFlowFields(fields?: CompanyDetail['config']['settings']['flows'][string]['requiredFields']) {
  return (fields ?? [])
    .map((field) =>
      [field.key, field.label, field.prompt, field.optional ? 'optional' : '']
        .filter((part, index) => index < 3 || Boolean(part))
        .join('|'),
    )
    .join('\n');
}
