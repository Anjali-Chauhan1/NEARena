"use client";

import Link from "next/link";
import { useAccount } from "@/lib/near/hooks";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5 bg-[radial-gradient(ellipse_at_50%_20%,#3a2614_0%,#120c08_55%,#06070a_100%)] text-[#efe6d2]">
        <div className="w-full max-w-md border border-[#8a6a2f]/60 bg-[#0c0a08]/90 p-8 md:p-10 text-center">
          <p className="font-[family-name:var(--font-cinzel)] text-xs tracking-[0.45em] text-[#c9a46a]">THE TABLE IS LOCKED</p>
          <h2 className="font-[family-name:var(--font-cinzel)] mt-3 text-3xl md:text-4xl font-bold text-[#f6efe1]">Connect to Play</h2>
          <p className="mt-4 text-sm leading-relaxed text-[#efe6d2]/60">
            NEARena uses your NEAR wallet as your seat at the table. Connect it to continue.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <ConnectWallet />
            <Link href="/" className="text-[10px] uppercase tracking-[0.3em] text-[#efe6d2]/40 hover:text-[#efe6d2]/80">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
