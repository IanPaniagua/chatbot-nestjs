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
