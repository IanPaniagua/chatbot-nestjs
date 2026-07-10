'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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

export async function sendManualMessage(formData: FormData) {
  const companyId = String(formData.get('companyId'));
  const conversationId = String(formData.get('conversationId'));
  const body = String(formData.get('body') || '').trim();

  if (!body) {
    return;
  }

  await apiFetch(`/conversations/${conversationId}/manual-messages?companyId=${companyId}`, {
    method: 'POST',
    body: JSON.stringify({ body, author: 'admin' }),
  });

  revalidatePath('/');
  revalidatePath(`/conversations/${conversationId}`);
}

export async function resetConversationFlow(formData: FormData) {
  const companyId = String(formData.get('companyId'));
  const conversationId = String(formData.get('conversationId'));

  await apiFetch(`/conversations/${conversationId}/reset-flow?companyId=${companyId}`, {
    method: 'POST',
  });

  revalidatePath('/');
  revalidatePath(`/conversations/${conversationId}`);
}

export async function simulateWhatsAppMessage(formData: FormData) {
  const companySlug = String(formData.get('companySlug'));
  const mode = String(formData.get('mode') || 'continue');
  const phone =
    mode === 'new'
      ? `+34${Math.floor(600000000 + Math.random() * 100000000)}`
      : String(formData.get('phone') || '+34600000000');
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

export async function createOnboardingCompany(formData: FormData) {
  const name = String(formData.get('name') || '').trim();

  if (!name) {
    return;
  }

  const company = await apiFetch<{ id: string }>('/companies/onboarding', {
    method: 'POST',
    body: JSON.stringify({
      name,
      slug: String(formData.get('slug') || '').trim() || undefined,
      internalEmail: String(formData.get('internalEmail') || '').trim() || undefined,
      websiteUrl: String(formData.get('websiteUrl') || '').trim() || undefined,
      onlineStoreUrl: String(formData.get('onlineStoreUrl') || '').trim() || undefined,
      instagramUrl: String(formData.get('instagramUrl') || '').trim() || undefined,
      locationName: String(formData.get('locationName') || '').trim() || undefined,
      locationAddress: String(formData.get('locationAddress') || '').trim() || undefined,
      faqSeed: String(formData.get('faqSeed') || '').trim() || undefined,
    }),
  });

  revalidatePath('/');
  redirect(`/?companyId=${company.id}`);
}

export async function updateCompanySettings(formData: FormData) {
  const companyId = String(formData.get('companyId'));

  await apiFetch(`/companies/${companyId}/settings`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: String(formData.get('name') || '').trim(),
      internalEmail: String(formData.get('internalEmail') || '').trim() || undefined,
      websiteUrl: String(formData.get('websiteUrl') || '').trim() || undefined,
      onlineStoreUrl: String(formData.get('onlineStoreUrl') || '').trim() || undefined,
      instagramUrl: String(formData.get('instagramUrl') || '').trim() || undefined,
      locationName: String(formData.get('locationName') || '').trim() || undefined,
      locationAddress: String(formData.get('locationAddress') || '').trim() || undefined,
      greeting: String(formData.get('greeting') || '').trim(),
      fallback: String(formData.get('fallback') || '').trim(),
      humanHandoff: String(formData.get('humanHandoff') || '').trim(),
      normalOrderRedirect: String(formData.get('normalOrderRedirect') || '').trim(),
      clarificationPrompt: String(formData.get('clarificationPrompt') || '').trim(),
      capabilities: String(formData.get('capabilities') || '').trim(),
      courtesyThanks: String(formData.get('courtesyThanks') || '').trim(),
      courtesyGoodbye: String(formData.get('courtesyGoodbye') || '').trim(),
      flowResumePrompt: String(formData.get('flowResumePrompt') || '').trim(),
      flowContinuePrefix: String(formData.get('flowContinuePrefix') || '').trim(),
      flowLowInformation: String(formData.get('flowLowInformation') || '').trim(),
      specialFlowWelcome: String(formData.get('specialFlowWelcome') || '').trim(),
      specialFlowFields: String(formData.get('specialFlowFields') || '').trim(),
      specialFlowCompletion: String(formData.get('specialFlowCompletion') || '').trim(),
      restaurantFlowWelcome: String(formData.get('restaurantFlowWelcome') || '').trim(),
      restaurantFlowFields: String(formData.get('restaurantFlowFields') || '').trim(),
      restaurantFlowCompletion: String(formData.get('restaurantFlowCompletion') || '').trim(),
      normalOrderKeywords: String(formData.get('normalOrderKeywords') || '').trim(),
      specialOrderKeywords: String(formData.get('specialOrderKeywords') || '').trim(),
      restaurantOrderKeywords: String(formData.get('restaurantOrderKeywords') || '').trim(),
      faqKeywords: String(formData.get('faqKeywords') || '').trim(),
      humanSupportKeywords: String(formData.get('humanSupportKeywords') || '').trim(),
      faqSeed: String(formData.get('faqSeed') || '').trim(),
    }),
  });

  revalidatePath('/');
  revalidatePath(`/companies/${companyId}/settings`);
  redirect(`/companies/${companyId}/settings?saved=1`);
}
