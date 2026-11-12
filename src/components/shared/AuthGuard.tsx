"use client";

import { ShieldAlert } from "lucide-react";
import { useAccount } from "@/lib/near/hooks";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#020203] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md border border-primary/30 bg-black/40 backdrop-blur-md p-8 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-black uppercase tracking-wide">Wallet Authentication Required</h2>
          </div>
          <p className="text-sm text-gray-300 mb-6">
            NEARena uses wallet auth only. Connect your wallet to continue.
          </p>
          <ConnectWallet />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
