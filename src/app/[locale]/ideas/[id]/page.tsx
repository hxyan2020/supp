import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { IdeaDetailView } from "@/components/IdeaDetailView";
import { getPublishedIdeas, getIdeaById } from "@/lib/ideas-service";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateStaticParams() {
  const ideas = await getPublishedIdeas();
  return ideas.map((idea) => ({ id: idea.id }));
}

export default async function IdeaDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const idea = await getIdeaById(id);
  if (!idea) notFound();

  return <IdeaDetailView idea={idea} />;
}
