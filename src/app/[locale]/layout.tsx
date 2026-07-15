import { Caveat, Ma_Shan_Zheng, Noto_Sans_SC, Syne } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/AppShell";
import { routing, type Locale } from "@/i18n/routing";
import "../globals.css";

const notoSans = Noto_Sans_SC({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const maShanZheng = Ma_Shan_Zheng({
  variable: "--font-ma-shan",
  subsets: ["latin"],
  weight: "400",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "brand" });

  return {
    title: t("name"),
    description: t("tagline"),
    icons: {
      icon: [
        { url: "/favicon.png", sizes: "32x32", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/logo.jpg", type: "image/jpeg" },
      ],
      apple: [{ url: "/icon-192.png", sizes: "180x180", type: "image/png" }],
      shortcut: ["/favicon.png"],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${notoSans.variable} ${syne.variable} ${caveat.variable} ${maShanZheng.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black font-sans text-white">
        <NextIntlClientProvider messages={messages}>
          <AppShell>{children}</AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
