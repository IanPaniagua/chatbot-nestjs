'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from './api';

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
