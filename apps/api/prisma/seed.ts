import { PrismaClient } from '@prisma/client';
import type { CompanyBotConfig } from '@chatbot/shared';

const prisma = new PrismaClient();

const baseWhatsAppConfig: CompanyBotConfig = {
  language: 'es',
  timezone: 'Europe/Madrid',
  onlineStoreUrl: 'https://example.com',
  websiteUrl: 'https://example.com',
  internalEmail: 'equipo@example.com',
  locations: [{ name: 'Principal', pickupNotes: 'Sustituir por sedes, tiendas o zonas reales.' }],
  routingKeywords: {
    normal_order: ['comprar', 'pedido', 'precio', 'catalogo', 'catálogo', 'servicio'],
    special_order: ['presupuesto', 'personalizado', 'a medida', 'especial', 'proyecto'],
    restaurant_order: ['empresa', 'b2b', 'mayorista', 'proveedor', 'colaboracion', 'colaboración'],
    faq: ['horario', 'ubicacion', 'ubicación', 'contacto', 'envio', 'envío', 'pago'],
    human_support: ['persona', 'humano', 'agente', 'hablar con alguien', 'ayuda'],
  },
  messages: {
    greeting: 'Hola, gracias por escribirnos.',
    fallback:
      'Gracias. No estoy seguro de haber entendido la solicitud. La dejo marcada para que el equipo pueda revisarla.',
    humanHandoff:
      'Perfecto, dejo esta conversación marcada para que una persona del equipo pueda responderte.',
    normalOrderRedirect:
      'Puedes ver la información principal aquí: {{onlineStoreUrl}}\n\nSi necesitas algo concreto, responde a este mensaje y te ayudamos.',
  },
  faqs: [
    {
      question: '¿Cuál es el horario?',
      answer:
        'Nuestro horario puede variar según el día. Sustituye esta respuesta por el horario real de la empresa.',
      keywords: ['horario', 'hora', 'abierto', 'cerrado'],
    },
    {
      question: '¿Dónde estáis?',
      answer:
        'Estamos disponibles en la ubicación indicada por la empresa. Sustituye esta respuesta por dirección, zonas de servicio o enlace de mapa.',
      keywords: ['ubicacion', 'ubicación', 'direccion', 'dirección', 'donde', 'dónde'],
    },
    {
      question: '¿Cómo puedo pagar?',
      answer:
        'El equipo confirmará las opciones de pago disponibles según el pedido o servicio solicitado.',
      keywords: ['pago', 'pagar', 'tarjeta', 'bizum', 'transferencia'],
    },
  ],
  flows: {
    special_order: {
      welcome:
        'Perfecto. Para preparar una solicitud a medida necesito algunos datos.',
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
      welcome:
        'Perfecto. Para una consulta de empresa necesito algunos datos.',
      requiredFields: [
        { key: 'businessName', label: 'Empresa', prompt: '¿Cuál es el nombre de la empresa?' },
        { key: 'contactName', label: 'Contacto', prompt: '¿Quién es la persona de contacto?' },
        { key: 'request', label: 'Solicitud', prompt: 'Cuéntame qué necesitáis, por favor.' },
        { key: 'volume', label: 'Volumen', prompt: '¿Qué volumen o frecuencia aproximada tenéis en mente?' },
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

const clinicConfig: CompanyBotConfig = {
  language: 'es',
  timezone: 'Europe/Madrid',
  onlineStoreUrl: 'https://clinica-demo.example.com/citas',
  websiteUrl: 'https://clinica-demo.example.com',
  internalEmail: 'recepcion@clinica-demo.example.com',
  locations: [
    {
      name: 'Clínica Centro',
      address: 'Dirección demo pendiente',
      pickupNotes: 'Sustituir por dirección real y referencias de acceso.',
    },
  ],
  routingKeywords: {
    normal_order: ['informacion', 'información', 'servicio', 'tratamiento', 'precio', 'tarifa'],
    special_order: ['cita', 'consulta', 'revision', 'revisión', 'doctor', 'doctora', 'urgente'],
    restaurant_order: ['empresa', 'aseguradora', 'seguro', 'mutua', 'convenio', 'colaboracion'],
    faq: ['horario', 'ubicacion', 'ubicación', 'direccion', 'dirección', 'aparcar', 'parking'],
    human_support: ['persona', 'recepcion', 'recepción', 'humano', 'hablar con alguien', 'ayuda'],
  },
  messages: {
    greeting: 'Hola, gracias por escribir a Clínica Demo.',
    fallback:
      'Gracias. No estoy seguro de haber entendido la consulta. La dejo marcada para que recepción pueda revisarla.',
    humanHandoff:
      'Perfecto, dejo esta conversación marcada para que recepción pueda responderte.',
    normalOrderRedirect:
      'Puedes consultar la información principal de nuestros servicios aquí: {{onlineStoreUrl}}\n\nSi quieres pedir cita o tienes una duda concreta, responde a este mensaje.',
  },
  faqs: [
    {
      question: '¿Cuál es el horario?',
      answer:
        'Nuestro horario demo es de lunes a viernes. Sustituye esta respuesta por el horario real de la clínica.',
      keywords: ['horario', 'hora', 'abierto', 'cerrado'],
    },
    {
      question: '¿Dónde está la clínica?',
      answer:
        'La clínica demo está pendiente de dirección real. Sustituye esta respuesta por dirección, mapa y datos de acceso.',
      keywords: ['ubicacion', 'ubicación', 'direccion', 'dirección', 'donde', 'dónde'],
    },
    {
      question: '¿Trabajáis con seguros?',
      answer:
        'Depende del tratamiento y la aseguradora. Indícanos tu seguro y recepción lo revisará.',
      keywords: ['seguro', 'aseguradora', 'mutua', 'poliza', 'póliza'],
    },
  ],
  flows: {
    special_order: {
      welcome: 'Perfecto. Para preparar la cita necesito algunos datos.',
      requiredFields: [
        { key: 'patientName', label: 'Paciente', prompt: '¿A nombre de quién sería la cita?' },
        { key: 'service', label: 'Servicio', prompt: '¿Qué servicio o especialidad necesitas?' },
        { key: 'preferredDate', label: 'Fecha preferida', prompt: '¿Qué día u horario te vendría bien?' },
        {
          key: 'urgency',
          label: 'Urgencia',
          prompt: '¿Es urgente o puede ser una cita normal?',
        },
        {
          key: 'notes',
          label: 'Observaciones',
          prompt: '¿Quieres añadir algún síntoma, detalle o preferencia?',
          optional: true,
        },
      ],
      completionMessage:
        'Gracias. He recogido los datos principales y recepción revisará disponibilidad.',
    },
    restaurant_order: {
      welcome: 'Perfecto. Para consultas de empresa, seguro o convenio necesito algunos datos.',
      requiredFields: [
        { key: 'businessName', label: 'Empresa/seguro', prompt: '¿Cuál es el nombre de la empresa, seguro o mutua?' },
        { key: 'contactName', label: 'Contacto', prompt: '¿Quién es la persona de contacto?' },
        { key: 'request', label: 'Solicitud', prompt: 'Cuéntame qué necesitáis, por favor.' },
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
  await upsertCompany('base-whatsapp', 'Base WhatsApp Chatbot', baseWhatsAppConfig);
  await upsertCompany('clinica-demo', 'Clínica Demo', clinicConfig);
  await upsertCompany('postres-beinetti', 'Postres Beinetti (demo)', beinettiConfig);
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
