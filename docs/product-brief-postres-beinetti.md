# Product Brief: Automatización WhatsApp para Postres Beinetti

## 1. Contexto

Postres Beinetti recibe gran parte de sus pedidos y consultas por WhatsApp Business. El canal funciona bien porque los clientes ya lo usan de forma natural, pero actualmente depende demasiado de gestión manual.

El negocio está creciendo: ya tiene varias tiendas, abrirá otra, trabaja con clientes particulares y restaurantes, y próximamente tendrá tienda online con Agora POS. Esto hace necesario ordenar el canal WhatsApp antes de que el volumen aumente más.

La propuesta no es reemplazar WhatsApp, sino convertirlo en un canal más estructurado, automatizado y conectado con el proceso interno.

## 2. Problemas actuales

### Problema 1: demasiado tiempo en conversaciones repetitivas

El equipo dedica muchas horas a responder preguntas similares: horarios, recogidas, ubicación, pedidos, alérgenos, disponibilidad, cómo encargar tartas, etc.

### Problema 2: pedidos poco estructurados

Los datos importantes llegan repartidos en varios mensajes:

- Fecha.
- Hora.
- Tienda de recogida.
- Tipo de producto.
- Número de personas.
- Sabor.
- Cantidad.
- Detalles especiales.
- Cliente/restaurante.

Esto aumenta el riesgo de errores.

### Problema 3: particulares, restaurantes y tartas especiales entran mezclados

No todos los mensajes tienen el mismo proceso. Un pedido normal debería ir a tienda online; una tarta especial necesita datos y revisión humana; un restaurante necesita pedido estructurado.

### Problema 4: errores humanos al copiar información

Cuando una persona tiene que interpretar y pasar pedidos manualmente, hay riesgo de olvidar datos, copiar mal cantidades o perder contexto.

### Problema 5: difícil escalar con más tiendas

Si el volumen crece y el proceso sigue igual, el equipo necesitará más tiempo humano para gestionar WhatsApp.

## 3. Solución propuesta

Crear una capa de automatización sobre WhatsApp Business usando Twilio.

Para el cliente final, todo seguirá ocurriendo en WhatsApp. Por detrás, el sistema clasificará conversaciones, responderá preguntas frecuentes, recogerá datos y derivará al equipo solo los casos que requieren intervención humana.

Flujo general:

**Cliente escribe por WhatsApp -> Twilio recibe el mensaje -> sistema clasifica -> bot responde o recoge datos -> equipo recibe resumen claro**

## 4. MVP propuesto

El MVP busca ahorrar tiempo rápido, reducir errores y ordenar pedidos sin esperar a la integración completa con Agora POS.

### Incluye

- Conexión de WhatsApp Business mediante Twilio.
- Bot inicial para clasificar conversaciones.
- Flujo para pedidos particulares normales.
- Flujo para tartas especiales.
- Flujo para restaurantes.
- Respuestas frecuentes.
- Derivación a humano.
- Registro básico de pedidos/conversaciones.
- Envío de pedidos estructurados por email o panel básico.
- Base técnica preparada para integrar Agora POS después.

### No incluye inicialmente

- Integración completa con Agora POS.
- Agente de voz.
- Presupuestos automáticos complejos.
- CRM completo.
- Campañas de marketing por WhatsApp.
- Automatización total sin revisión humana.

## 5. R1: Release 1 / MVP operativo

Objetivo: reducir carga manual y ordenar conversaciones.

### Funcionalidades R1

- Clasificación inicial: pedido normal, tarta especial, restaurante, atención al cliente o hablar con una persona.
- Pedido normal: enviar enlace a tienda online/Agora.
- Tarta especial: recoger fecha, tienda, número de personas, sabor, temática, imagen de referencia y observaciones.
- Restaurante: recoger pedido de forma estructurada y enviarlo por email o panel interno básico.
- FAQ: horarios, ubicaciones, recogidas, alérgenos y preguntas frecuentes.
- Panel o bandeja básica: pedidos entrantes, estado y datos principales.

### Resultado esperado de R1

WhatsApp deja de ser una bandeja desordenada y empieza a funcionar como un canal filtrado y estructurado.

## 6. R2: Release 2 / Optimización e integración

Objetivo: conectar mejor el sistema con operaciones internas y Agora POS.

### Funcionalidades R2

- Mejor panel interno.
- Catálogo editable.
- Estados más completos: nuevo, pendiente de datos, confirmado, enviado a producción y completado.
- Exportación diaria para obrador.
- Métricas de conversaciones y pedidos.
- Preparación/integración con Agora POS si la API está disponible.
- Mejoras de IA para extracción de datos y resumen.
- Posible soporte multiidioma.
- Preparación futura para voz.

### Resultado esperado de R2

El sistema empieza a conectarse con producción y gestión interna, reduciendo aún más la doble entrada manual.

## 7. Stack recomendado

- WhatsApp: Twilio WhatsApp API.
- Backend: NestJS sobre Node.js + TypeScript.
- Base de datos: PostgreSQL.
- ORM: Prisma.
- Panel interno: Next.js.
- IA opcional: OpenAI API.
- Hosting: Railway, Render o Fly.io para backend.
- Frontend/panel: Vercel.
- Errores/logs: Sentry o alternativa simple.

Motivo: stack profesional, escalable y mantenible. Permite empezar con MVP sin bloquear la evolución hacia Agora POS, voz o más tiendas.

## 8. OKR del MVP

### Objetivo principal

Reducir el tiempo manual dedicado a WhatsApp y mejorar la calidad de los pedidos recibidos.

### Key Results propuestos

- Reducir en un 30-50% las conversaciones repetitivas atendidas manualmente.
- Conseguir que al menos 70% de los pedidos especiales lleguen con datos mínimos completos.
- Derivar correctamente al menos 80% de conversaciones entre pedido normal, tarta especial, restaurante y atención al cliente.
- Reducir errores de datos básicos en pedidos: fecha, tienda, cantidad y contacto.
- Tener trazabilidad de pedidos entrantes desde WhatsApp.

## 9. KPIs del MVP

- Número de conversaciones gestionadas por el bot.
- Porcentaje de conversaciones derivadas a humano.
- Porcentaje de pedidos con datos completos.
- Tiempo medio hasta primera respuesta.
- Número de pedidos normales enviados a tienda online.
- Número de solicitudes de tartas especiales estructuradas.
- Número de pedidos de restaurantes recogidos correctamente.
- Errores o pedidos incompletos detectados.
- Ahorro estimado de tiempo del equipo por semana.

## 10. Presupuesto

### Desarrollo R1 / MVP

**3.500 EUR**

Incluye:

- Configuración inicial.
- Desarrollo del bot.
- Flujos principales.
- Base de datos.
- Panel o bandeja básica.
- Despliegue.
- Pruebas.
- Documentación.
- 2 semanas de ajustes tras lanzamiento.

### Mantenimiento

**250 EUR/mes + costes externos**

Incluye:

- Supervisión básica.
- Corrección de errores.
- Ajustes menores de textos/flujos.
- Revisión de funcionamiento.
- Soporte ligero.

### Costes externos estimados

**75-200 EUR/mes aproximadamente**

Incluye:

- Twilio/WhatsApp.
- Hosting.
- Base de datos.
- IA opcional.
- Monitorización.

Nota fiscal: si aplica Kleinunternehmerregelung en Alemania, se emitiría sin IVA, pendiente de confirmación fiscal.

## 11. Mensaje comercial central

Postres Beinetti no necesita cambiar su canal principal. Necesita ordenar WhatsApp para ahorrar tiempo, reducir errores y preparar el negocio para crecer.

La propuesta es empezar con un MVP controlado que resuelva el problema operativo más urgente y deje lista la base para integrar Agora POS y futuras automatizaciones.
