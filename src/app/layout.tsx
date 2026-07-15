import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supp",
  description: "Discover experiences worth joining",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.jpg", type: "image/jpeg" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
