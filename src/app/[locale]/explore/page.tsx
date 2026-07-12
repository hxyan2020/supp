import { setRequestLocale } from "next-intl/server";
import { ExploreView } from "@/components/ExploreView";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ExplorePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ExploreView />;
}
