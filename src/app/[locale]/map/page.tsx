import { setRequestLocale } from "next-intl/server";
import { MapView } from "@/components/MapView";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MapPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MapView />;
}
