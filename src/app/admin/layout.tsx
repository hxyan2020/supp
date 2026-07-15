import { Noto_Sans_SC, Syne } from "next/font/google";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import "../globals.css";

const notoSans = Noto_Sans_SC({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${notoSans.variable} ${syne.variable} min-h-screen font-sans antialiased`}>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </div>
  );
}
