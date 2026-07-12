# Vision de producto multiempresa

Este documento recoge la direccion del producto para no perder el criterio cuando sigamos iterando. La idea no es crear un bot unico para Tech Presence Matters, sino una plataforma reutilizable para vender bots de WhatsApp configurables por empresa.

## Norte del producto

El producto debe permitir que cada empresa tenga su propio bot, configurado con su realidad comercial:

- Servicios concretos.
- Objetivo principal de la conversacion.
- Funnel por servicio.
- Preguntas de cualificacion.
- Conocimiento autorizado.
- Reglas de derivacion a humano.
- Dashboard propio para revisar conversaciones, leads y estado.

El core debe ser comun. Lo personalizado debe vivir en configuracion, base de conocimiento y reglas editables desde admin.

## Principio conversacional

El bot debe ser AI-first, pero no abierto como ChatGPT general.

La IA se encarga de conversar de forma natural, entender intencion, orientar al usuario y redactar respuestas profesionales. El backend conserva el control de negocio: estados, Twilio, persistencia, handoff humano, limites de seguridad y datos que se guardan.

El bot debe guiar al cliente, no dejarle todo el trabajo. Cuando el usuario no sabe exactamente que necesita, el bot debe ofrecer 2-3 opciones concretas y meterlo en el funnel cuanto antes.

Ejemplo deseado:

```txt
Para hacerlo facil, elige lo mas parecido:
1. Responder preguntas frecuentes y enviar enlaces utiles
2. Clasificar la necesidad y derivar a una URL o formulario
3. Filtrar leads y pasar los casos adecuados a una persona
```

El usuario puede responder con numero o texto libre.

## Patron de conversacion guiada

Una buena experiencia de WhatsApp no debe parecer un formulario largo ni un chat abierto sin direccion. Debe sentirse como un asistente que lleva al usuario paso a paso:

- Explicar al inicio que se recogeran algunos datos y que podra revisarlos antes de enviarlos.
- Pedir un solo dato por turno cuando se este cualificando una solicitud.
- Usar opciones rapidas numeradas cuando la decision sea cerrada o frecuente.
- Aceptar numero o texto libre para no bloquear al usuario.
- Confirmar uploads, adjuntos o datos recibidos cuando aplique.
- Mostrar un resumen antes de enviar la solicitud al equipo.
- Permitir corregir un dato concreto antes de confirmar.
- Cerrar con una confirmacion clara de que la solicitud ha sido recibida.

En Twilio/TwiML basico estas opciones se representan como listas numeradas. Para botones realmente clicables en WhatsApp habra que anadir una capa especifica de mensajes interactivos del proveedor.

## Modelo por empresa

Cada empresa debe tener:

- `companySlug` propio.
- Configuracion de mensajes, idioma, timezone, web, email interno y canales.
- Catalogo de servicios.
- Opciones guiadas por servicio.
- Opciones de alcance/precio por servicio, sin inventar importes si no estan autorizados.
- FAQs y conocimiento activo.
- Flujos estructurados cuando haga falta recoger datos paso a paso.
- Conversaciones, mensajes, notas internas y resumen de lead.
- Dashboard filtrable por estado, intencion y prioridad.

En el futuro, cada empresa deberia poder tener usuarios internos y permisos propios.

## Produccion para vender

Antes de venderlo de forma seria, hay que cerrar una base estable:

1. Desplegar API con URL HTTPS estable.
2. Quitar dependencia de quick tunnels temporales de Cloudflare/ngrok.
3. Configurar Twilio WhatsApp con numero real o canal aprobado.
4. Asegurar variables de entorno en produccion.
5. Proteger el admin con autenticacion suficiente.
6. Confirmar que cada empresa puede entrar por `companySlug` o numero/canal propio.
7. Revisar logs, errores y fallback si la IA falla.
8. Mantener respuesta TwiML fiable para que Twilio no quede sin respuesta.
9. Documentar runbook de soporte: que mirar si WhatsApp no responde.

Los quick tunnels solo son para desarrollo y demos. No son aceptables como infraestructura de produccion.

## Onboarding de nuevos clientes

El objetivo del onboarding es recopilar suficiente informacion para configurar el bot sin tocar la base de datos a mano.

MVP de onboarding:

- Formulario de empresa: nombre, web, email, sector, idioma, tono.
- Servicios: nombre, descripcion, para quien es, para quien no es.
- Funnel por servicio: objetivo, opciones guiadas, preguntas clave, datos obligatorios.
- Handoff: cuando derivar, a quien, por que canal y con que resumen.
- FAQs: preguntas frecuentes y respuestas aprobadas.
- Mensajes base: saludo, fallback, gracias, cierre y humano.

La configuracion generada por el onboarding debe poder revisarse antes de activar el bot.

## Evolucion futura

Capacidades deseables despues del MVP vendible:

- Importacion de PDFs, documentos o textos largos para crear conocimiento revisable.
- Scraping de web o webshop para proponer FAQs, servicios y enlaces utiles.
- Extraccion de catalogo desde ecommerce.
- Embeddings/RAG avanzado cuando haya mas volumen de conocimiento.
- Generacion automatica de una propuesta de bot para que el admin la revise.
- Formularios publicos para que el cliente complete requisitos.
- Emails o notificaciones internas con resumen estructurado del lead.
- Envio de audio o adjuntos y transcripcion/resumen cuando sea necesario.
- Integraciones con CRM, email, calendario, hojas de calculo o herramientas internas.

Estas capacidades deben entrar como modulos reutilizables, no como parches especificos de una empresa.

## Criterios de calidad

El bot debe:

- Responder rapido y siempre que Twilio llame al webhook.
- Sonar profesional, cercano y humano.
- No inventar precios, plazos, garantias ni servicios.
- Usar solo conocimiento autorizado para afirmaciones concretas.
- Guiar con opciones cuando el usuario este indeciso.
- Pedir un dato por turno, salvo que el contexto haga natural agrupar.
- Reconocer cuando el usuario quiere hablar con una persona y derivar sin insistir.
- Guardar el contexto necesario para que el equipo pueda actuar.
- Evitar contaminar una nueva solicitud con datos de una conversacion vieja.

## Prioridad actual

La prioridad inmediata no es anadir mas fuentes de conocimiento, sino dejar la base lista para vender:

1. Produccion estable.
2. Twilio WhatsApp bien configurado.
3. Admin seguro y usable.
4. Multiempresa fiable.
5. Onboarding minimo editable desde admin.
6. Demo de Tech Presence Matters como caso de referencia.

Despues de eso, tiene sentido invertir en PDFs, scraping, formularios avanzados y RAG mas completo.
