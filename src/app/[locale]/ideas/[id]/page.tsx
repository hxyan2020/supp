import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { IdeaDetailView } from "@/components/IdeaDetailView";
import { getIdeaById, mockIdeas } from "@/data/mock-ideas";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export function generateStaticParams() {
  return mockIdeas.map((idea) => ({ id: idea.id }));
}

export default async function IdeaDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const idea = getIdeaById(id);
  if (!idea) notFound();

  return <IdeaDetailView idea={idea} />;
}
