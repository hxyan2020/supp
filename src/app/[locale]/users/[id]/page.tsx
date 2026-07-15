import { UserProfileView } from "@/components/UserProfileView";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;
  return <UserProfileView userId={id} />;
}
