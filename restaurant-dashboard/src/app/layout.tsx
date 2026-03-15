import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Restaurant Dashboard | Food Delivery Partner",
  description: "Manage your restaurant, menu, and orders for food delivery",
};

const LOCALE_KEY = "restaurant-dashboard-locale";

function resolveInitialLocale(
  value: string | undefined
): "en" | "ru" {
  return value === "ru" ? "ru" : "en";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = resolveInitialLocale(
    cookieStore.get(LOCALE_KEY)?.value
  );

  return (
    <html lang={initialLocale} suppressHydrationWarning translate="no">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased notranslate`}
      >
        <Providers initialLocale={initialLocale}>{children}</Providers>
      </body>
    </html>
  );
}
