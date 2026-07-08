'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { API_BASE_URL, apiFetch } from './api';

export async function updateConversationStatus(formData: FormData) {
  const companyId = String(formData.get('companyId'));
  const conversationId = String(formData.get('conversationId'));
  const status = String(formData.get('status'));

  await apiFetch(`/conversations/${conversationId}/status?companyId=${companyId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

  revalidatePath('/');
  revalidatePath(`/conversations/${conversationId}`);
}

export async function addInternalNote(formData: FormData) {
  const companyId = String(formData.get('companyId'));
  const conversationId = String(formData.get('conversationId'));
  const body = String(formData.get('body'));

  await apiFetch(`/conversations/${conversationId}/internal-notes?companyId=${companyId}`, {
    method: 'POST',
    body: JSON.stringify({ body, author: 'admin' }),
  });

  revalidatePath(`/conversations/${conversationId}`);
}

export async function simulateWhatsAppMessage(formData: FormData) {
  const companySlug = String(formData.get('companySlug'));
  const phone = String(formData.get('phone') || '+34600000000');
  const bodyValues = formData.getAll('body');
  const body = String(bodyValues.at(-1) || '').trim();

  if (!body) {
    return;
  }

  const payload = new URLSearchParams({
    From: `whatsapp:${phone}`,
    To: 'whatsapp:+14155238886',
    Body: body,
    MessageSid: `SIM-${randomUUID()}`,
    ProfileName: 'Cliente demo',
  });

  const response = await fetch(
    `${API_BASE_URL}/webhooks/twilio/whatsapp?companySlug=${companySlug}`,
    {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  if (!response.ok) {
    throw new Error(`Simulator request failed: ${response.status} ${response.statusText}`);
  }

  revalidatePath('/');
}
