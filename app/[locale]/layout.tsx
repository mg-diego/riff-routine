import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "RiffRoutine — Domina tu práctica",
  description: "La app de práctica para guitarristas serios. Tabs interactivos, rutinas, seguimiento de BPM y estadísticas.",
};

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }];
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${bebasNeue.variable} ${dmSans.variable}`}>
        <NextIntlClientProvider locale={locale} messages={messages} key={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}