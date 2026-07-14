import { setRequestLocale } from "next-intl/server";
import { ExploreSearchView } from "@/components/ExploreSearchView";
import { getPublishedIdeas } from "@/lib/ideas-service";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ExploreSearchPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ideas = await getPublishedIdeas();
  return <ExploreSearchView ideas={ideas} />;
}
