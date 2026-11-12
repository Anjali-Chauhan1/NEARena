import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import NearWalletProvider from "@/components/providers/NearWalletProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "NEARena | Real-time Arena Game",
  description: "A behavior-driven, high-retention real-time strategy arena.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans min-h-screen">
        <NearWalletProvider>
          {children}
        </NearWalletProvider>
      </body>
    </html>
  );
}
