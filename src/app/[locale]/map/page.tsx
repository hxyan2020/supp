import { setRequestLocale } from "next-intl/server";
import { MapView } from "@/components/MapView";
import { getPublishedIdeas } from "@/lib/ideas-service";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MapPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ideas = await getPublishedIdeas();
  return <MapView ideas={ideas} />;
}
