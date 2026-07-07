import './styles.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Chatbot Admin',
  description: 'Internal inbox for commercial chatbot conversations',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
