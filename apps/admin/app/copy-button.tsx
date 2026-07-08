'use client';

import { useState } from 'react';

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }

    window.setTimeout(() => setStatus('idle'), 1600);
  }

  return (
    <button className="secondary-button" type="button" onClick={copy}>
      {status === 'copied' ? 'Copiado' : status === 'failed' ? 'No copiado' : 'Copiar resumen'}
    </button>
  );
}
