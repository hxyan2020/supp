import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getIdeaById } from "@/data/mock-ideas";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function IdeaDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const idea = getIdeaById(id);
  if (!idea) notFound();

  const t = await getTranslations("idea");

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        <span aria-hidden>←</span>
        {t("back")}
      </Link>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="h-48 bg-gradient-to-br from-emerald-200 via-teal-100 to-amber-50" />

        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            {idea.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600"
              >
                {tag}
              </span>
            ))}
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {idea.title}
            </h1>
            <p className="mt-2 text-stone-600">{idea.summary}</p>
          </div>

          <dl className="grid gap-4 rounded-xl bg-stone-50 p-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                {t("location")}
              </dt>
              <dd className="mt-1 text-sm text-stone-900">{idea.location}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                {t("date")}
              </dt>
              <dd className="mt-1 text-sm text-stone-900">{idea.date}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                {t("participants")}
              </dt>
              <dd className="mt-1 text-sm text-stone-900">
                {idea.participantCount} / {idea.maxParticipants}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                {t("organizer")}
              </dt>
              <dd className="mt-1 text-sm text-stone-900">{idea.organizer}</dd>
            </div>
          </dl>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">{t("about")}</h2>
            <p className="mt-2 leading-relaxed text-stone-600">{idea.description}</p>
          </section>

          <button
            type="button"
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto sm:px-8"
          >
            {t("participate")}
          </button>
        </div>
      </div>
    </article>
  );
}
