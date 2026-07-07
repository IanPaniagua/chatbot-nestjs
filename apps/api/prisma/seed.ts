import { PrismaClient } from '@prisma/client';
import type { CompanyBotConfig } from '@chatbot/shared';

const prisma = new PrismaClient();

const beinettiConfig: CompanyBotConfig = {
  language: 'es',
  timezone: 'Europe/Madrid',
  onlineStoreUrl: 'https://postresbeinetti.com/',
  websiteUrl: 'https://postresbeinetti.com/',
  instagramUrl: 'https://www.instagram.com/postresbeinetti/',
  internalEmail: 'pedidos@postresbeinetti.com',
  locations: [
    { name: 'Tienda 1', pickupNotes: 'Confirmar tienda exacta durante piloto.' },
    { name: 'Tienda 2', pickupNotes: 'Confirmar tienda exacta durante piloto.' },
    { name: 'Nueva tienda', pickupNotes: 'Activar cuando abra oficialmente.' },
  ],
  routingKeywords: {
    normal_order: ['pedido', 'comprar', 'encargar', 'quiero pedir', 'hacer pedido'],
    special_order: ['tarta', 'comunion', 'comunión', 'boda', 'cumpleaños', 'especial', 'personalizada'],
    restaurant_order: ['restaurante', 'mayorista', 'por mayor', 'cafeteria', 'cafetería', 'hosteleria'],
    faq: ['horario', 'ubicacion', 'ubicación', 'alergeno', 'alérgeno', 'recoger', 'tienda'],
    human_support: ['persona', 'hablar con alguien', 'atencion', 'atención', 'ayuda'],
  },
  messages: {
    greeting: 'Hola, gracias por escribir a Postres Beinetti.',
    fallback:
      'Gracias. No estoy seguro de haber entendido la solicitud. Te derivo al equipo para revisarlo.',
    humanHandoff:
      'Perfecto, dejo esta conversación marcada para que una persona del equipo pueda revisarla.',
    normalOrderRedirect:
      'Para pedidos normales, por favor realiza el pedido desde nuestra tienda online: {{onlineStoreUrl}}\n\nSi necesitas una tarta especial o tienes alguna duda, puedes responder aquí.',
  },
  faqs: [
    {
      question: '¿Dónde están las tiendas?',
      answer:
        'Tenemos varias tiendas. Para confirmar la recogida, indícanos qué zona o tienda te viene mejor.',
      keywords: ['tienda', 'direccion', 'dirección', 'ubicacion', 'ubicación'],
    },
    {
      question: '¿Cuál es el horario?',
      answer:
        'Los horarios pueden variar según tienda. Te recomendamos confirmar la tienda de recogida y el día.',
      keywords: ['horario', 'hora', 'abierto', 'cerrado'],
    },
    {
      question: '¿Tenéis información de alérgenos?',
      answer:
        'Sí. Para alérgenos o intolerancias, indícanos el producto concreto y el equipo lo revisará.',
      keywords: ['alergeno', 'alérgeno', 'gluten', 'lactosa', 'intolerancia'],
    },
  ],
  flows: {
    special_order: {
      welcome:
        'Perfecto. Para preparar la solicitud de una tarta especial necesito algunos datos.',
      requiredFields: [
        { key: 'pickupDate', label: 'Fecha de recogida', prompt: '¿Para qué fecha la necesitas?' },
        { key: 'pickupLocation', label: 'Tienda', prompt: '¿En qué tienda quieres recogerla?' },
        { key: 'servings', label: 'Personas', prompt: '¿Para cuántas personas sería?' },
        { key: 'flavor', label: 'Sabor', prompt: '¿Tienes algún sabor preferido?' },
        { key: 'theme', label: 'Temática', prompt: '¿Qué temática o estilo te gustaría?' },
        {
          key: 'notes',
          label: 'Observaciones',
          prompt: '¿Quieres añadir algún detalle o referencia adicional?',
          optional: true,
        },
      ],
      completionMessage:
        'Gracias. He recogido los datos principales y el equipo revisará la solicitud para presupuesto.',
    },
    restaurant_order: {
      welcome:
        'Perfecto. Para preparar el pedido de restaurante necesito algunos datos.',
      requiredFields: [
        { key: 'businessName', label: 'Restaurante', prompt: '¿Cuál es el nombre del restaurante?' },
        { key: 'contactName', label: 'Contacto', prompt: '¿Quién es la persona de contacto?' },
        { key: 'items', label: 'Pedido', prompt: 'Indica productos y cantidades, por favor.' },
        { key: 'deliveryDate', label: 'Fecha', prompt: '¿Para qué fecha/hora lo necesitas?' },
        {
          key: 'notes',
          label: 'Observaciones',
          prompt: '¿Hay alguna observación para el obrador o reparto?',
          optional: true,
        },
      ],
      completionMessage:
        'Gracias. He estructurado el pedido para que el equipo pueda revisarlo.',
    },
    faq: {
      welcome: 'Te ayudo con tu consulta.',
      requiredFields: [],
      completionMessage: 'Consulta respondida.',
    },
  },
};

const demoConfig: CompanyBotConfig = {
  ...beinettiConfig,
  onlineStoreUrl: 'https://example.com',
  websiteUrl: 'https://example.com',
  instagramUrl: undefined,
  internalEmail: 'hello@example.com',
  locations: [{ name: 'Online' }],
  messages: {
    greeting: 'Hola, gracias por escribir.',
    fallback: 'Gracias. Te derivo para que podamos revisarlo.',
    humanHandoff: 'Dejo esta conversación marcada para revisión humana.',
    normalOrderRedirect:
      'Puedes ver la información principal aquí: {{onlineStoreUrl}}. Si necesitas ayuda, responde a este mensaje.',
  },
};

async function upsertCompany(slug: string, name: string, config: CompanyBotConfig) {
  const company = await prisma.company.upsert({
    where: { slug },
    update: { name, isActive: true },
    create: { slug, name },
  });

  await prisma.companyConfig.upsert({
    where: { companyId: company.id },
    update: {
      language: config.language,
      timezone: config.timezone,
      internalEmail: config.internalEmail,
      settings: config as any,
    },
    create: {
      companyId: company.id,
      language: config.language,
      timezone: config.timezone,
      internalEmail: config.internalEmail,
      settings: config as any,
    },
  });

  for (const faq of config.faqs) {
    await prisma.knowledgeBaseEntry.upsert({
      where: {
        id: `${company.id}:${faq.question}`,
      },
      update: {
        answer: faq.answer,
        keywords: faq.keywords,
        isActive: true,
      },
      create: {
        id: `${company.id}:${faq.question}`,
        companyId: company.id,
        question: faq.question,
        answer: faq.answer,
        keywords: faq.keywords,
      },
    });
  }
}

async function main() {
  await upsertCompany('postres-beinetti', 'Postres Beinetti', beinettiConfig);
  await upsertCompany('demo-website', 'Demo Website', demoConfig);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
