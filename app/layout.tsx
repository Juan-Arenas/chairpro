import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MartiArenas Labs — Sistema de Gestión Inteligente para Barberías',
  description: 'Plataforma SaaS de última generación para gestión de barberías. Agenda en tiempo real, reservas QR, barberos, clientes, finanzas y branding 100% personalizable.',
  keywords: 'barbería, gestión, SaaS, citas, agenda, QR, automatización, MartiArenas Labs',
  authors: [{ name: 'MartiArenas Labs' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
