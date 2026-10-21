import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "AHV · Campo",
  description: "Inspección preoperacional y registro de extracción de la retroexcavadora.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // suppressHydrationWarning: el SDK de Telegram escribe variables CSS en <html> antes de hidratar
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body className="h-full font-sans">
        {children}
        {/* SDK de Telegram Mini Apps: debe estar antes de hidratar para leer initData */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
