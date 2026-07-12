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
        {
          key: 'budget',
          label: 'Presupuesto',
          prompt: '¿Tienes un presupuesto aproximado?',
          options: ['Todavía no lo sé', 'Menos de 500 €', '500-1.500 €', 'Más de 1.500 €'],
        },
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
        {
          key: 'volume',
          label: 'Volumen',
          prompt: '¿Qué volumen o frecuencia aproximada tenéis en mente?',
          options: ['Puntual', 'Semanal', 'Mensual', 'Todavía por definir'],
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
        {
          key: 'pickupLocation',
          label: 'Tienda',
          prompt: '¿En qué tienda quieres recogerla?',
          options: ['Tienda 1', 'Tienda 2', 'Todavía no lo sé'],
        },
        {
          key: 'servings',
          label: 'Personas',
          prompt: '¿Para cuántas personas sería?',
          options: ['10-15 personas', '20-25 personas', '30-40 personas', 'Más de 40 personas'],
        },
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
        {
          key: 'deliveryDate',
          label: 'Fecha',
          prompt: '¿Para qué fecha/hora lo necesitas?',
          options: ['Esta semana', 'La próxima semana', 'Este mes', 'Fecha por definir'],
        },
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

const techPresenceConfig: CompanyBotConfig = {
  language: 'es',
  timezone: 'Europe/Madrid',
  websiteUrl: 'https://techpresencematters.com',
  onlineStoreUrl: 'https://techpresencematters.com',
  internalEmail: 'hello@techpresencematters.com',
  locations: [{ name: 'Online', pickupNotes: 'Atención remota y reuniones bajo cita.' }],
  serviceCatalog: [
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
  ],
  routingKeywords: {
    normal_order: ['servicio', 'servicios', 'web', 'pagina web', 'página web', 'automatizacion', 'automatización', 'seo', 'presencia online'],
    special_order: ['presupuesto', 'propuesta', 'auditoria', 'auditoría', 'proyecto', 'mejorar', 'necesito ayuda', 'quiero empezar'],
    restaurant_order: ['empresa', 'agencia', 'colaboracion', 'colaboración', 'partner', 'b2b', 'equipo'],
    faq: ['precio', 'precios', 'plazo', 'tiempo', 'como funciona', 'cómo funciona', 'reunion', 'reunión', 'contacto'],
    human_support: ['persona', 'humano', 'agente', 'hablar con alguien', 'hablar con una persona'],
  },
  messages: {
    greeting: 'Hola, gracias por escribir a Tech Presence Matters.',
    fallback:
      'Gracias. No estoy seguro de haber entendido del todo la consulta. La dejo marcada para que el equipo pueda revisarla.',
    humanHandoff:
      'Perfecto, dejo esta conversación marcada para que una persona del equipo pueda revisarla.',
    normalOrderRedirect:
      'Puedes ver la información principal aquí: {{onlineStoreUrl}}\n\nSi quieres, cuéntame qué necesitas mejorar y te oriento.',
    clarificationPrompt:
      'Para orientarte bien, necesito un poco más de contexto. ¿Quieres mejorar tu web, captar más clientes, automatizar procesos o preparar una propuesta?',
    capabilities:
      'Puedo ayudarte con dudas sobre presencia online, webs, automatizaciones, auditorías digitales y preparación de una propuesta.{{websiteHint}}\n\nCuéntame qué estás intentando mejorar y te guío paso a paso.',
    courtesyThanks: 'Gracias a ti. Si quieres revisar tu presencia online o preparar una propuesta, puedes escribirme por aquí.',
    courtesyGoodbye: 'Perfecto, quedo por aquí si necesitas revisar algo más adelante.',
    flowResumePrompt:
      'Veo que teníamos una solicitud abierta. ¿Quieres continuar con esa solicitud o empezar una consulta nueva?',
    flowContinuePrefix: 'Perfecto, seguimos.',
    flowLowInformation:
      'No pasa nada. Con una idea aproximada es suficiente para empezar; después el equipo puede afinar los detalles.',
  },
  faqs: [
    {
      question: '¿Qué hace Tech Presence Matters?',
      answer:
        'Ayudamos a mejorar la presencia digital de un negocio con web, automatización, estrategia online y sistemas para captar y gestionar mejor los leads.',
      keywords: ['que haceis', 'qué hacéis', 'servicios', 'presencia online', 'web', 'automatizacion', 'automatización'],
    },
    {
      question: '¿Cómo empieza un proyecto?',
      answer:
        'Normalmente empezamos entendiendo el negocio, la situación actual y el objetivo principal. Después se prepara una propuesta con prioridades y próximos pasos.',
      keywords: ['como funciona', 'cómo funciona', 'empezar', 'proyecto', 'propuesta', 'primer paso'],
    },
    {
      question: '¿Trabajáis con precios cerrados?',
      answer:
        'Depende del alcance. Para poder orientar bien el presupuesto necesitamos saber qué hay que mejorar, qué activos existen ya y qué objetivo tiene el proyecto.',
      keywords: ['precio', 'precios', 'presupuesto', 'coste', 'cuanto cuesta', 'cuánto cuesta'],
    },
    {
      question: '¿Podéis revisar mi web actual?',
      answer:
        'Sí. Podemos revisar la web actual, detectar puntos de mejora y priorizar acciones sobre claridad, captación, confianza, automatización y conversión.',
      keywords: ['revisar web', 'auditoria', 'auditoría', 'mi web', 'pagina web', 'página web'],
    },
  ],
  flows: {
    special_order: {
      welcome: 'Perfecto. Para preparar una primera orientación necesito algunos datos.',
      requiredFields: [
        { key: 'business', label: 'Negocio', prompt: '¿Qué tipo de negocio o proyecto tienes?' },
        {
          key: 'goal',
          label: 'Objetivo',
          prompt: '¿Qué quieres mejorar ahora mismo?',
          options: [
            'Conseguir más contactos desde la web',
            'Automatizar respuestas o leads',
            'Mejorar claridad y confianza online',
            'No lo tengo claro, quiero orientación',
          ],
        },
        {
          key: 'currentPresence',
          label: 'Situación actual',
          prompt: '¿Tienes web, redes o algún sistema funcionando ya?',
          options: ['Tengo web', 'Tengo redes pero poca web', 'Uso WhatsApp/manual', 'Estoy empezando desde cero'],
        },
        {
          key: 'timeline',
          label: 'Plazo',
          prompt: '¿Tienes algún plazo o urgencia?',
          options: ['Lo antes posible', 'Este mes', 'En 1-3 meses', 'Sin urgencia'],
        },
        {
          key: 'notes',
          label: 'Observaciones',
          prompt: '¿Quieres añadir algún detalle importante?',
          optional: true,
        },
      ],
      completionMessage:
        'Gracias. He recogido los datos principales para que el equipo pueda revisar la solicitud.',
    },
    restaurant_order: {
      welcome: 'Perfecto. Para una colaboración o consulta de empresa necesito algunos datos.',
      requiredFields: [
        { key: 'companyName', label: 'Empresa', prompt: '¿Cuál es el nombre de la empresa?' },
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
  await upsertCompany('tech-presence-matters', 'Tech Presence Matters', techPresenceConfig);
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
