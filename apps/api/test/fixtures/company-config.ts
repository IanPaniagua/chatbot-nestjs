import type { CompanyBotConfig } from '@chatbot/shared';

export const testCompanyConfig: CompanyBotConfig = {
  language: 'es',
  timezone: 'Europe/Madrid',
  onlineStoreUrl: 'https://example.com/order',
  websiteUrl: 'https://example.com',
  internalEmail: 'ops@example.com',
  locations: [{ name: 'Central' }],
  routingKeywords: {
    normal_order: ['pedido normal', 'comprar'],
    special_order: ['tarta', 'comunion', 'boda'],
    restaurant_order: ['restaurante', 'por mayor'],
    faq: ['horario'],
    human_support: ['persona'],
  },
  messages: {
    greeting: 'Hola',
    fallback: 'No entendido',
    humanHandoff: 'Te deriva una persona.',
    normalOrderRedirect: 'Compra aquí: {{onlineStoreUrl}}',
  },
  faqs: [
    {
      question: 'Horario',
      answer: 'Abrimos de lunes a sábado.',
      keywords: ['horario', 'abren'],
    },
  ],
  flows: {
    special_order: {
      welcome: 'Datos para tarta especial.',
      requiredFields: [
        { key: 'date', label: 'Fecha', prompt: '¿Qué fecha?' },
        { key: 'servings', label: 'Personas', prompt: '¿Cuántas personas?' },
      ],
      completionMessage: 'Solicitud recibida.',
    },
    restaurant_order: {
      welcome: 'Datos para restaurante.',
      requiredFields: [
        { key: 'businessName', label: 'Restaurante', prompt: 'Nombre restaurante' },
        { key: 'items', label: 'Pedido', prompt: 'Productos y cantidades' },
      ],
      completionMessage: 'Pedido recibido.',
    },
    faq: {
      welcome: 'FAQ',
      requiredFields: [],
      completionMessage: 'FAQ completada.',
    },
  },
};
