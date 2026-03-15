import type { Metadata } from "next";
import { cookies } from "next/headers";
import "@/styles/globals.css";
import { LanguageProvider, LOCALE_KEY } from "@/i18n/context";

export const metadata: Metadata = {
  title: "Courier Company Dashboard | YATAPP",
  description: "Manage your courier company, pricing, and couriers",
};

function getInitialLocale(cookieValue: string | undefined): "en" | "ru" | "tg" {
  if (cookieValue === "ru" || cookieValue === "tg" || cookieValue === "en") {
    return cookieValue;
  }
  return "en";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_KEY)?.value;
  const initialLocale = getInitialLocale(localeCookie);

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body className="antialiased">
        <LanguageProvider initialLocale={initialLocale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
