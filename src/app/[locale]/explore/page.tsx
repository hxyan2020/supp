import { setRequestLocale } from "next-intl/server";
import { ExploreView } from "@/components/ExploreView";
import { getPublishedIdeas } from "@/lib/ideas-service";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ExplorePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ideas = await getPublishedIdeas();
  return <ExploreView ideas={ideas} />;
}
