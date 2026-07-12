import { setRequestLocale } from "next-intl/server";
import { MeView } from "@/components/MeView";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MeView />;
}
