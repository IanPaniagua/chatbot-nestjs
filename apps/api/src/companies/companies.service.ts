import { Injectable, NotFoundException } from '@nestjs/common';
import type { CompanyBotConfig } from '@chatbot/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyOnboardingDto, UpdateCompanySettingsDto } from './dto';

const DEFAULT_ROUTING_KEYWORDS = {
  normal_order: ['comprar', 'pedido', 'precio', 'catalogo', 'catálogo', 'servicio', 'informacion', 'información'],
  special_order: ['presupuesto', 'personalizado', 'a medida', 'especial', 'proyecto', 'cita'],
  restaurant_order: ['empresa', 'b2b', 'mayorista', 'proveedor', 'colaboracion', 'colaboración'],
  faq: ['horario', 'ubicacion', 'ubicación', 'contacto', 'envio', 'envío', 'pago', 'direccion', 'dirección'],
  human_support: ['persona', 'humano', 'agente', 'hablar con alguien', 'ayuda'],
};

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: { config: true },
    });
  }

  async getBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      include: { config: true, knowledge: { where: { isActive: true } } },
    });

    if (!company || !company.isActive) {
      throw new NotFoundException(`Company not found: ${slug}`);
    }

    return company;
  }

  async getById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { config: true, knowledge: { where: { isActive: true }, orderBy: { question: 'asc' } } },
    });

    if (!company) {
      throw new NotFoundException(`Company not found: ${id}`);
    }

    return company;
  }

  async getConfig(companyId: string): Promise<CompanyBotConfig> {
    const config = await this.prisma.companyConfig.findUnique({ where: { companyId } });

    if (!config) {
      throw new NotFoundException(`Company config not found: ${companyId}`);
    }

    return config.settings as unknown as CompanyBotConfig;
  }

  async createFromOnboarding(input: CreateCompanyOnboardingDto) {
    const slug = await this.resolveAvailableSlug(input.slug || input.name);
    const faqs = parseFaqSeed(input.faqSeed);
    const config = buildOnboardingConfig(input, faqs);

    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          slug,
          name: input.name.trim(),
          isActive: true,
        },
      });

      await tx.companyConfig.create({
        data: {
          companyId: company.id,
          language: config.language,
          timezone: config.timezone,
          internalEmail: config.internalEmail,
          settings: config as any,
        },
      });

      await tx.knowledgeBaseEntry.createMany({
        data: faqs.map((faq) => ({
          companyId: company.id,
          question: faq.question,
          answer: faq.answer,
          keywords: faq.keywords,
        })),
      });

      return tx.company.findUniqueOrThrow({
        where: { id: company.id },
        include: { config: true, knowledge: { where: { isActive: true } } },
      });
    });
  }

  async updateSettings(companyId: string, input: UpdateCompanySettingsDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { config: true },
    });

    if (!company?.config) {
      throw new NotFoundException(`Company config not found: ${companyId}`);
    }

    const currentConfig = company.config.settings as unknown as CompanyBotConfig;
    const faqs = parseFaqSeed(input.faqSeed);
    const settings: CompanyBotConfig = {
      ...currentConfig,
      internalEmail: cleanOptional(input.internalEmail),
      websiteUrl: cleanOptional(input.websiteUrl),
      onlineStoreUrl: cleanOptional(input.onlineStoreUrl) || cleanOptional(input.websiteUrl),
      instagramUrl: cleanOptional(input.instagramUrl),
      locations: [
        {
          ...(currentConfig.locations[0] ?? {}),
          name: cleanOptional(input.locationName) || 'Principal',
          address: cleanOptional(input.locationAddress),
        },
      ],
      messages: {
        greeting: input.greeting.trim(),
        fallback: input.fallback.trim(),
        humanHandoff: input.humanHandoff.trim(),
        normalOrderRedirect: input.normalOrderRedirect.trim(),
        clarificationPrompt: cleanOptional(input.clarificationPrompt),
        capabilities: cleanOptional(input.capabilities),
        courtesyThanks: cleanOptional(input.courtesyThanks),
        courtesyGoodbye: cleanOptional(input.courtesyGoodbye),
        flowResumePrompt: cleanOptional(input.flowResumePrompt),
        flowContinuePrefix: cleanOptional(input.flowContinuePrefix),
        flowLowInformation: cleanOptional(input.flowLowInformation),
      },
      routingKeywords: {
        normal_order: parseKeywordList(input.normalOrderKeywords),
        special_order: parseKeywordList(input.specialOrderKeywords),
        restaurant_order: parseKeywordList(input.restaurantOrderKeywords),
        faq: parseKeywordList(input.faqKeywords),
        human_support: parseKeywordList(input.humanSupportKeywords),
      },
      flows: {
        ...currentConfig.flows,
        special_order: buildEditableFlow(currentConfig.flows.special_order, {
          welcome: input.specialFlowWelcome,
          fields: input.specialFlowFields,
          completionMessage: input.specialFlowCompletion,
        }),
        restaurant_order: buildEditableFlow(currentConfig.flows.restaurant_order, {
          welcome: input.restaurantFlowWelcome,
          fields: input.restaurantFlowFields,
          completionMessage: input.restaurantFlowCompletion,
        }),
      },
      faqs,
    };

    return this.prisma.$transaction(async (tx) => {
      await tx.company.update({
        where: { id: companyId },
        data: { name: input.name.trim() },
      });

      await tx.companyConfig.update({
        where: { companyId },
        data: {
          internalEmail: settings.internalEmail,
          language: settings.language,
          timezone: settings.timezone,
          settings: settings as any,
        },
      });

      await tx.knowledgeBaseEntry.deleteMany({ where: { companyId } });
      if (faqs.length > 0) {
        await tx.knowledgeBaseEntry.createMany({
          data: faqs.map((faq) => ({
            companyId,
            question: faq.question,
            answer: faq.answer,
            keywords: faq.keywords,
            isActive: true,
          })),
        });
      }

      return tx.company.findUniqueOrThrow({
        where: { id: companyId },
        include: { config: true, knowledge: { where: { isActive: true }, orderBy: { question: 'asc' } } },
      });
    });
  }

  private async resolveAvailableSlug(rawValue: string) {
    const baseSlug = slugify(rawValue) || 'cliente';
    let slug = baseSlug;
    let suffix = 2;

    while (await this.prisma.company.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }
}

function buildOnboardingConfig(
  input: CreateCompanyOnboardingDto,
  faqs: CompanyBotConfig['faqs'],
): CompanyBotConfig {
  const websiteUrl = cleanOptional(input.websiteUrl);
  const onlineStoreUrl = cleanOptional(input.onlineStoreUrl) || websiteUrl;
  const companyName = input.name.trim();

  return {
    language: 'es',
    timezone: 'Europe/Madrid',
    onlineStoreUrl,
    websiteUrl,
    instagramUrl: cleanOptional(input.instagramUrl),
    internalEmail: cleanOptional(input.internalEmail),
    locations: [
      {
        name: cleanOptional(input.locationName) || 'Principal',
        address: cleanOptional(input.locationAddress),
        pickupNotes: 'Pendiente de completar durante onboarding interno.',
      },
    ],
    routingKeywords: DEFAULT_ROUTING_KEYWORDS,
    messages: {
      greeting: `Hola, gracias por escribir a ${companyName}.`,
      fallback:
        'Gracias. No estoy seguro de haber entendido la solicitud. La dejo marcada para que el equipo pueda revisarla.',
      humanHandoff:
        'Perfecto, dejo esta conversación marcada para que una persona del equipo pueda responderte.',
      normalOrderRedirect: onlineStoreUrl
        ? 'Puedes ver la información principal aquí: {{onlineStoreUrl}}\n\nSi necesitas algo concreto, responde a este mensaje y te ayudamos.'
        : 'Gracias. Cuéntanos qué necesitas y el equipo lo revisará.',
      clarificationPrompt:
        'Para ayudarte bien, necesito un poco más de contexto. ¿Buscas información general, una propuesta/presupuesto o prefieres que lo revise una persona del equipo?',
      capabilities:
        'Puedo ayudarte con dudas frecuentes, información sobre servicios, solicitudes a medida y recogida de datos para que el equipo pueda responder mejor.{{websiteHint}}\n\nCuéntame qué necesitas y lo vemos paso a paso.',
      courtesyThanks: 'Gracias a ti. Si necesitas algo más, puedes escribirme por aquí.',
      courtesyGoodbye: 'Perfecto, quedo por aquí si necesitas algo más.',
      flowResumePrompt:
        'Veo que teníamos una solicitud abierta. ¿Quieres continuar con esa solicitud o empezar una consulta nueva?',
      flowContinuePrefix: 'Perfecto, seguimos.',
      flowLowInformation:
        'No pasa nada. Si no tienes todos los datos, dime lo que sepas y lo dejamos preparado para que el equipo lo revise.',
    },
    faqs,
    flows: {
      special_order: {
        welcome: 'Perfecto. Para preparar una solicitud a medida necesito algunos datos.',
        requiredFields: [
          { key: 'need', label: 'Necesidad', prompt: '¿Qué necesitas exactamente?' },
          { key: 'date', label: 'Fecha', prompt: '¿Para qué fecha lo necesitas?' },
          { key: 'budget', label: 'Presupuesto', prompt: '¿Tienes un presupuesto aproximado?' },
          { key: 'contactName', label: 'Contacto', prompt: '¿A nombre de quién dejamos la solicitud?' },
          {
            key: 'notes',
            label: 'Observaciones',
            prompt: '¿Quieres añadir algún detalle importante?',
            optional: true,
          },
        ],
        completionMessage:
          'Gracias. He recogido los datos principales y el equipo revisará la solicitud.',
      },
      restaurant_order: {
        welcome: 'Perfecto. Para una consulta de empresa necesito algunos datos.',
        requiredFields: [
          { key: 'businessName', label: 'Empresa', prompt: '¿Cuál es el nombre de la empresa?' },
          { key: 'contactName', label: 'Contacto', prompt: '¿Quién es la persona de contacto?' },
          { key: 'request', label: 'Solicitud', prompt: 'Cuéntame qué necesitáis, por favor.' },
          {
            key: 'volume',
            label: 'Volumen',
            prompt: '¿Qué volumen o frecuencia aproximada tenéis en mente?',
          },
          {
            key: 'notes',
            label: 'Observaciones',
            prompt: '¿Hay alguna observación adicional?',
            optional: true,
          },
        ],
        completionMessage:
          'Gracias. He estructurado la consulta para que el equipo pueda revisarla.',
      },
      faq: {
        welcome: 'Te ayudo con tu consulta.',
        requiredFields: [],
        completionMessage: 'Consulta respondida.',
      },
    },
  };
}

function parseFaqSeed(seed?: string): CompanyBotConfig['faqs'] {
  const parsedFaqs =
    seed
      ?.split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [question, answer, keywords] = line.split('|');

        if (!question?.trim() || !answer?.trim()) {
          return null;
        }

        return {
          question: question.trim(),
          answer: answer.trim(),
          keywords: parseKeywordList(keywords) || keywordCandidates(question),
        };
      })
      .filter((faq): faq is CompanyBotConfig['faqs'][number] => Boolean(faq)) ?? [];

  if (parsedFaqs.length > 0) {
    return parsedFaqs;
  }

  return [
    {
      question: '¿Cuál es el horario?',
      answer: 'Horario pendiente de confirmar durante el onboarding interno.',
      keywords: ['horario', 'hora', 'abierto', 'cerrado'],
    },
    {
      question: '¿Dónde estáis?',
      answer: 'Ubicación pendiente de confirmar durante el onboarding interno.',
      keywords: ['ubicacion', 'ubicación', 'direccion', 'dirección', 'donde', 'dónde'],
    },
    {
      question: '¿Cómo puedo contactar?',
      answer: 'El equipo revisará tu consulta y responderá por este canal.',
      keywords: ['contacto', 'contactar', 'telefono', 'teléfono', 'email'],
    },
  ];
}

function buildEditableFlow(
  currentFlow: CompanyBotConfig['flows'][string],
  input: { welcome?: string; fields?: string; completionMessage?: string },
): CompanyBotConfig['flows'][string] {
  return {
    welcome: cleanOptional(input.welcome) || currentFlow.welcome,
    requiredFields: parseFlowFields(input.fields, currentFlow.requiredFields),
    completionMessage: cleanOptional(input.completionMessage) || currentFlow.completionMessage,
  };
}

function parseFlowFields(
  value: string | undefined,
  fallback: CompanyBotConfig['flows'][string]['requiredFields'],
): CompanyBotConfig['flows'][string]['requiredFields'] {
  const fields: CompanyBotConfig['flows'][string]['requiredFields'] = [];

  for (const line of value?.split('\n') ?? []) {
    const [key, label, prompt, optional] = line.split('|').map((part) => part?.trim());

    if (!key || !label || !prompt) {
      continue;
    }

    const field: CompanyBotConfig['flows'][string]['requiredFields'][number] = {
      key,
      label,
      prompt,
    };

    if (optional === 'optional' || optional === 'true' || optional === '1') {
      field.optional = true;
    }

    fields.push(field);
  }

  return fields.length > 0 ? fields : fallback;
}

function parseKeywordList(value?: string) {
  const keywords =
    value
      ?.split(/[\n,]/)
      .map((keyword) => keyword.trim())
      .filter(Boolean) ?? [];

  return Array.from(new Set(keywords));
}

function keywordCandidates(text: string) {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]/g, ' ');

  const words = normalized
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .filter((word) => !['cual', 'como', 'donde', 'para', 'puedo', 'teneis', 'tienes'].includes(word));

  return Array.from(new Set(words)).slice(0, 8);
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function cleanOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
