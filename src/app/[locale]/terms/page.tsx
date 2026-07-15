import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function TermsPage() {
  const t = await getTranslations("terms");
  const sections = t.raw("sections") as Array<{ heading: string; body: string }>;

  return (
    <div className="min-h-full bg-[#2a2a2a] px-4 py-8 text-white">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <Link
            href="/explore"
            className="text-sm text-white/50 transition hover:text-white/80"
          >
            ← {t("back")}
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-1 text-xs text-white/45">{t("updated")}</p>
        </div>

        <div className="space-y-6 rounded-2xl bg-black/70 p-5 backdrop-blur-sm">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-semibold text-white">
                {section.heading}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
