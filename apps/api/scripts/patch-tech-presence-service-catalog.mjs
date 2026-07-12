import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const serviceCatalog = [
  {
    key: 'whatsapp_chatbot',
    name: 'Chatbot de WhatsApp',
    description:
      'Chatbot para WhatsApp que entiende la necesidad del cliente, responde dudas frecuentes, recoge datos y deriva a URLs, formularios o una persona del equipo cuando corresponde.',
    bestFor: [
      'Negocios que reciben consultas repetidas por WhatsApp',
      'Rutas por intención hacia enlaces, formularios o atención humana',
      'Cualificación inicial de leads antes de intervención manual',
    ],
    notFor: ['Sustituir por completo a un equipo comercial en decisiones complejas'],
    guidedOptions: [
      'Responder preguntas frecuentes y enviar enlaces útiles',
      'Clasificar la necesidad y derivar a una URL o formulario',
      'Filtrar leads y pasar los casos adecuados a una persona',
    ],
    pricingContextOptions: [
      'Bot simple con pocas rutas y respuestas frecuentes',
      'Bot guiado con varias rutas, URLs y recogida de datos',
      'Bot avanzado con IA, handoff humano y resumen de lead',
    ],
    qualificationQuestions: [
      '¿Qué tipos de consultas o necesidades quieres distinguir?',
      '¿A qué URLs, formularios o personas debería derivar cada ruta?',
      '¿Qué datos mínimos necesitas recibir antes de considerar el lead cualificado?',
    ],
    requiredData: ['tipo de negocio', 'objetivo del chatbot', 'rutas deseadas', 'datos a recoger', 'canal de handoff'],
    leadTag: 'service:whatsapp_chatbot',
  },
  {
    key: 'web_chatbot',
    name: 'Chatbot para website',
    description:
      'Asistente conversacional para una web que responde preguntas, orienta al usuario, capta leads y puede preparar un briefing para el equipo.',
    bestFor: [
      'Webs que necesitan convertir más visitas en consultas',
      'Negocios con servicios que requieren orientación antes de pedir presupuesto',
      'Captación de leads con contexto antes del formulario',
    ],
    guidedOptions: [
      'Responder dudas antes de pedir contacto',
      'Captar leads y preparar un briefing',
      'Derivar a reserva, formulario o WhatsApp',
    ],
    pricingContextOptions: [
      'Asistente sencillo en una página clave',
      'Asistente para varias secciones y captación de leads',
      'Asistente con IA, contexto del negocio y handoff',
    ],
    qualificationQuestions: [
      '¿En qué página o sección de la web debería aparecer?',
      '¿Qué objetivo principal debe cumplir: informar, captar leads, reservar o derivar?',
      '¿Qué datos debe recoger antes de avisar al equipo?',
    ],
    requiredData: ['URL de la web', 'objetivo', 'tipo de usuario', 'datos a recoger', 'destino del lead'],
    leadTag: 'service:web_chatbot',
  },
  {
    key: 'website_improvement',
    name: 'Mejora de web y presencia online',
    description:
      'Revisión y mejora de web, claridad del mensaje, captación, confianza y conversión para negocios que quieren generar más oportunidades online.',
    bestFor: [
      'Negocios con web existente que no convierte bien',
      'Proyectos que necesitan ordenar mensaje, oferta y próximos pasos',
      'Mejorar presencia online antes de invertir en automatización',
    ],
    guidedOptions: [
      'Conseguir más contactos desde la web',
      'Clarificar servicios, mensaje y confianza',
      'Preparar la web para chatbot o automatización',
    ],
    pricingContextOptions: [
      'Revisión y mejoras puntuales',
      'Reestructura de páginas clave',
      'Mejora completa de conversión y captación',
    ],
    qualificationQuestions: [
      '¿Cuál es la URL actual?',
      '¿Qué quieres mejorar: claridad, leads, reservas, confianza o automatización?',
      '¿Qué ya está funcionando y qué te preocupa ahora mismo?',
    ],
    requiredData: ['URL actual', 'objetivo', 'situación actual', 'público objetivo', 'prioridad'],
    leadTag: 'service:website_improvement',
  },
  {
    key: 'automation',
    name: 'Automatizaciones y sistemas de captación',
    description:
      'Automatizaciones para conectar formularios, WhatsApp, email, CRM o herramientas internas y reducir tareas manuales en la gestión de leads.',
    bestFor: [
      'Negocios que pierden tiempo moviendo datos entre herramientas',
      'Equipos que quieren recibir leads mejor clasificados',
      'Procesos repetitivos de seguimiento, notificación o derivación',
    ],
    guidedOptions: [
      'Enviar leads a email, CRM o hoja de cálculo',
      'Avisar al equipo cuando llega una consulta importante',
      'Clasificar y resumir leads automáticamente',
    ],
    pricingContextOptions: [
      'Una automatización simple entre dos herramientas',
      'Varias rutas según tipo de lead',
      'Sistema completo con seguimiento y alertas',
    ],
    qualificationQuestions: [
      '¿Qué proceso haces manualmente ahora?',
      '¿Qué herramientas usas ya: web, WhatsApp, email, CRM, hojas de cálculo?',
      '¿Qué debería pasar automáticamente cuando llega un lead?',
    ],
    requiredData: ['proceso actual', 'herramientas usadas', 'evento de entrada', 'resultado deseado', 'responsable interno'],
    leadTag: 'service:automation',
  },
  {
    key: 'digital_audit',
    name: 'Auditoría de presencia digital',
    description:
      'Revisión inicial para detectar prioridades en web, captación, confianza, automatización y experiencia de contacto.',
    bestFor: [
      'Negocios que saben que algo falla pero no tienen claro por dónde empezar',
      'Antes de decidir entre web, chatbot o automatización',
      'Preparar una hoja de ruta de mejoras',
    ],
    guidedOptions: [
      'Revisar web y claridad del mensaje',
      'Revisar captación de leads y formularios',
      'Revisar WhatsApp, seguimiento y automatización',
    ],
    pricingContextOptions: [
      'Diagnóstico rápido de prioridades',
      'Auditoría con recomendaciones accionables',
      'Hoja de ruta para ejecutar mejoras',
    ],
    qualificationQuestions: [
      '¿Qué canal te preocupa más ahora: web, WhatsApp, redes, formularios o seguimiento?',
      '¿Qué objetivo te gustaría mejorar primero?',
      '¿Tienes algún dato o ejemplo de dónde se pierden oportunidades?',
    ],
    requiredData: ['web o canales actuales', 'principal preocupación', 'objetivo', 'herramientas actuales'],
    leadTag: 'service:digital_audit',
  },
];

try {
  const slugs = ['base-whatsapp', 'tech-presence-matters'];
  const updated = [];

  for (const slug of slugs) {
    const company = await prisma.company.findUnique({
      where: { slug },
      include: { config: true },
    });

    if (!company?.config) {
      continue;
    }

    const settings = company.config.settings;
    await prisma.companyConfig.update({
      where: { companyId: company.id },
      data: {
        settings: {
          ...settings,
          serviceCatalog,
        },
      },
    });

    updated.push({ company: company.slug, services: serviceCatalog.length });
  }

  console.log(JSON.stringify({ updated }, null, 2));
} finally {
  await prisma.$disconnect();
}
