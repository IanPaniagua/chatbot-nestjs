const args = process.argv.slice(2);

let companySlug = process.env.COMPANY_SLUG || process.env.DEFAULT_COMPANY_SLUG || 'base-whatsapp';
let from = process.env.WHATSAPP_FROM || 'whatsapp:+34600000000';
let useNewPhone = false;
const messageParts = [];

for (const arg of args) {
  if (arg.startsWith('--company=')) {
    companySlug = arg.slice('--company='.length);
  } else if (arg.startsWith('--from=')) {
    const rawFrom = arg.slice('--from='.length);
    from = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom}`;
  } else if (arg === '--new') {
    useNewPhone = true;
  } else {
    messageParts.push(arg);
  }
}

if (useNewPhone) {
  from = `whatsapp:+34${Math.floor(600000000 + Math.random() * 100000000)}`;
}

const apiBaseUrl =
  process.env.CHATBOT_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const body =
  messageParts.join(' ').trim() ||
  process.env.WHATSAPP_BODY ||
  'Hola, necesito un presupuesto personalizado';
const to = process.env.WHATSAPP_TO || 'whatsapp:+14155238886';

const webhookUrl = new URL('/webhooks/twilio/whatsapp', apiBaseUrl);
webhookUrl.searchParams.set('companySlug', companySlug);

const payload = new URLSearchParams({
  From: from,
  To: to,
  Body: body,
  MessageSid: `SM_DEV_${Date.now()}`,
  ProfileName: process.env.WHATSAPP_PROFILE_NAME || 'Dev User',
});

function decodeXml(value) {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}

try {
  console.log(`POST ${webhookUrl.toString()}`);
  console.log(`From: ${from}`);
  console.log(`Body: ${body}`);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const reply = text.match(/<Message>([\s\S]*?)<\/Message>/)?.[1];
  console.log('\nBot reply:');
  console.log(reply ? decodeXml(reply) : text);
} catch (error) {
  console.error('\nCould not simulate WhatsApp webhook.');
  console.error(error instanceof Error ? error.message : error);
  console.error('\nMake sure the API is running with: pnpm dev:api');
  process.exit(1);
}
