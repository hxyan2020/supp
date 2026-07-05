import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("account");

  const menuItems = [
    { key: "profile", label: t("profile") },
    { key: "settings", label: t("settings") },
    { key: "notifications", label: t("notifications") },
    { key: "privacy", label: t("privacy") },
  ] as const;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-stone-600">{t("subtitle")}</p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-800">
          ?
        </div>
        <div className="flex-1">
          <p className="font-medium text-stone-900">Guest</p>
          <p className="text-sm text-stone-500">guest@supp.app</p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {t("signIn")}
        </button>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-stone-700">{t("language")}</h2>
        <LanguageSwitcher />
      </section>

      <nav className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {menuItems.map((item, index) => (
          <button
            key={item.key}
            type="button"
            className={`flex w-full items-center justify-between px-5 py-4 text-start text-sm text-stone-800 transition hover:bg-stone-50 ${
              index > 0 ? "border-t border-stone-100" : ""
            }`}
          >
            {item.label}
            <span className="text-stone-400" aria-hidden>
              ›
            </span>
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        {t("signOut")}
      </button>
    </div>
  );
}
