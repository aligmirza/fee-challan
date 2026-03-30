import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/layout/LayoutShell";
import { CampusProvider } from "@/components/layout/CampusContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fee Challan Management System",
  description: "Fee challan management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full bg-gray-50 font-sans antialiased" style={{ fontFamily: 'var(--font-inter), sans-serif' }} suppressHydrationWarning>
        <CampusProvider>
          <LayoutShell>{children}</LayoutShell>
        </CampusProvider>
      </body>
    </html>
  );
}
