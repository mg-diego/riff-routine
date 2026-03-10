import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${bebasNeue.variable} ${dmSans.variable}`}>
        {children}
      </body>
    </html>
  );
}