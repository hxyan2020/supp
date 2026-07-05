import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supp",
  description: "Discover experiences worth joining",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
