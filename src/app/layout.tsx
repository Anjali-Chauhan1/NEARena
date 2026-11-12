import type { Metadata } from "next";
import { Cinzel, Inter, Outfit } from "next/font/google";
import "./globals.css";
import NearWalletProvider from "@/components/providers/NearWalletProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cinzel",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "NEARena | Real-time Arena Game",
  description: "Stake BTQ, crack the vault and beat the dealer. A treasure duel on NEAR.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} ${cinzel.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans min-h-screen">
        <NearWalletProvider>
          {children}
        </NearWalletProvider>
      </body>
    </html>
  );
}
