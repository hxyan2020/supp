import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { IdeaCard } from "@/components/IdeaCard";
import { mockIdeas } from "@/data/mock-ideas";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("me");
  const savedIdeas = mockIdeas.slice(0, 2);
  const joinedIdeas = mockIdeas.slice(2, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-stone-600">{t("subtitle")}</p>
      </div>

      <Section title={t("saved")} ideas={savedIdeas} empty={t("empty")} />
      <Section title={t("joined")} ideas={joinedIdeas} empty={t("empty")} />

      <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
        {t("created")} — coming soon
      </section>
    </div>
  );
}

function Section({
  title,
  ideas,
  empty,
}: {
  title: string;
  ideas: typeof mockIdeas;
  empty: string;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
      {ideas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center text-stone-500">
          {empty}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </section>
  );
}
