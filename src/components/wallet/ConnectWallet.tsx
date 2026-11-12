"use client";

import React, { useEffect } from "react";
import { useAccount, useDisconnect, useWalletModal } from "@/lib/near/hooks";
import { shortenAccountId } from "@/lib/near/format";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useWalletModal();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isConnected && address) {
      localStorage.setItem("nearena_user", shortenAccountId(address));
      localStorage.setItem("nearena_wallet_id", address.toLowerCase());
    } else {
      localStorage.removeItem("nearena_user");
      localStorage.removeItem("nearena_wallet_id");
    }
  }, [address, isConnected]);

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all rounded-lg"
      >
        {shortenAccountId(address)}
      </button>
    );
  }

  return (
    <button
      onClick={() => openConnectModal?.()}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all rounded-lg"
    >
      Connect NEAR Wallet
    </button>
  );
}

export default ConnectWallet;
