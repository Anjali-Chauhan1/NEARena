"use client";

import React, { useState } from "react";
import { Wallet, LogOut, Send, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useDisconnect, useFtBalance, useNearBalance, useWriteContract } from "@/lib/near/hooks";
import { nearToYocto, shortenAccountId } from "@/lib/near/format";

const NEAR_PER_BTQ = Number(process.env.NEXT_PUBLIC_BTQ_RATE_NEAR_PER_BTQ || 0.001);

export function WalletPanel() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [buyAmount, setBuyAmount] = useState<number>(1);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [buyStatus, setBuyStatus] = useState<string | null>(null);
  const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null);
  const minWithdrawBtq = 150;

  const { balance: nearBalance } = useNearBalance();
  const { balanceRaw: btqBalanceRaw, balance: btqBalance, refetch: refetchBtq } = useFtBalance();
  const { writeContractAsync, isPending } = useWriteContract();

  const gasReserve = 0.05; // leave a buffer for NEAR gas/storage
  const maxBuyable = Math.max(0, Math.floor((nearBalance - gasReserve) / NEAR_PER_BTQ));

  const requiredNear = (buyAmount || 0) * NEAR_PER_BTQ;
  const hasEnoughFunds = nearBalance >= requiredNear + gasReserve;

  const [operation, setOperation] = useState<"buy" | "withdraw" | null>(null);

  const handleBuy = async () => {
    if (!buyAmount || buyAmount <= 0) {
      setBuyStatus("Please enter a valid amount.");
      return;
    }
    if (!hasEnoughFunds) {
      setBuyStatus(`Insufficient funds. You have ${nearBalance.toFixed(4)} NEAR but need ~${(requiredNear + gasReserve).toFixed(4)} (${requiredNear.toFixed(4)} + buffer). Max you can buy: ${maxBuyable} BTQ.`);
      return;
    }

    try {
      setBuyStatus("Sending transaction...");
      setOperation("buy");
      await writeContractAsync({
        functionName: "buy",
        deposit: nearToYocto(requiredNear),
        gas: "30000000000000",
      });
      setBuyStatus("✓ Purchase successful!");
      await refetchBtq();
      setTimeout(() => {
        setShowBuyModal(false);
        setBuyStatus(null);
      }, 1500);
    } catch (err: any) {
      const msg = err?.message || String(err);
      setBuyStatus(`Error: ${msg}`);
    } finally {
      setOperation(null);
    }
  };

  const handleWithdraw = async () => {
    if (btqBalance < minWithdrawBtq || !btqBalanceRaw) {
      setWithdrawStatus(`Minimum withdraw is ${minWithdrawBtq} BTQ.`);
      return;
    }

    try {
      setWithdrawStatus("Selling BTQ for NEAR...");
      setOperation("withdraw");
      await writeContractAsync({
        functionName: "sell",
        args: { amount: btqBalanceRaw },
        gas: "30000000000000",
      });
      setWithdrawStatus("✓ Withdraw successful!");
      await refetchBtq();
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawStatus(null);
      }, 1500);
    } catch (err: any) {
      const msg = err?.message || String(err);
      setWithdrawStatus(`Error: ${msg}`);
    } finally {
      setOperation(null);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-lg">
      {/* Header with Balance */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-primary" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">BTQ Balance</span>
            <span className="text-2xl font-black text-white italic tracking-tighter">{btqBalance.toFixed(2)}</span>
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/30 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-600/30 transition-all rounded-lg"
        >
          <LogOut className="w-4 h-4" />
          LOGOUT
        </button>
      </div>

      {/* Address + Native Balance Display */}
      <div className="flex items-center justify-between bg-black/20 px-3 py-2 rounded border border-white/5">
        <span className="text-[11px] text-white/50 font-mono">{address ? shortenAccountId(address) : ""}</span>
        <span className="text-[10px] text-primary/80 font-black">{nearBalance.toFixed(4)} NEAR</span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowBuyModal(!showBuyModal)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-primary/20 border border-primary/40 text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/30 transition-all rounded-lg"
        >
          <Plus className="w-4 h-4" />
          BUY BTQ
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowWithdrawModal(!showWithdrawModal)}
          disabled={btqBalance < minWithdrawBtq}
          className={`flex items-center justify-center gap-2 px-4 py-3 border font-black uppercase text-[10px] tracking-widest rounded-lg transition-all ${
            btqBalance >= minWithdrawBtq
              ? "bg-secondary/20 border-secondary/40 text-secondary hover:bg-secondary/30"
              : "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          <Send className="w-4 h-4" />
          SELL BTQ
        </motion.button>
      </div>

      <p className="text-[9px] text-white/50 font-black uppercase tracking-widest">
        Minimum withdraw: {minWithdrawBtq} BTQ
      </p>

      {/* Buy Modal */}
      <AnimatePresence>
        {showBuyModal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 border border-primary/20 rounded-lg p-4 space-y-3"
          >
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Buy BTQ</h4>
            <p className="text-[9px] text-white/60">Rate: 1 BTQ = {NEAR_PER_BTQ} NEAR</p>

            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={maxBuyable}
                value={buyAmount}
                onChange={(e) => setBuyAmount(Math.max(0, Number(e.target.value)))}
                className="bg-black/60 border border-white/10 px-3 py-2 text-white rounded flex-1 text-[10px]"
                placeholder="Amount"
              />
              <button
                onClick={() => setBuyAmount(maxBuyable)}
                className="px-3 py-2 bg-white/10 border border-white/20 text-white/80 font-black text-[9px] tracking-widest rounded hover:bg-white/20 transition-all"
              >
                MAX
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBuy}
                disabled={isPending || operation === "buy" || !hasEnoughFunds || buyAmount <= 0}
                className="px-4 py-2 bg-primary text-black font-bold rounded hover:bg-white transition-all disabled:opacity-50"
              >
                {isPending && operation === "buy" ? "..." : "BUY"}
              </motion.button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[9px] text-white/60">Cost: ~{requiredNear.toFixed(4)} NEAR</p>
              <p className={`text-[9px] font-bold ${hasEnoughFunds ? "text-emerald-400" : "text-red-400"}`}>
                {hasEnoughFunds ? `✓ Affordable (max ${maxBuyable})` : `✗ Need more NEAR (max ${maxBuyable})`}
              </p>
            </div>

            {isPending && operation === "buy" && <p className="text-[9px] text-white/80">Waiting for confirmation...</p>}
            {buyStatus && (
              <p className={`text-[9px] ${buyStatus.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>{buyStatus}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 border border-secondary/20 rounded-lg p-4 space-y-3"
          >
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest">Sell BTQ</h4>
            <p className="text-[9px] text-white/60">Withdraw {btqBalance.toFixed(2)} BTQ to NEAR</p>
            <p className="text-[9px] text-white/50">Minimum withdraw: {minWithdrawBtq} BTQ</p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWithdraw}
              disabled={isPending || operation === "withdraw" || btqBalance < minWithdrawBtq}
              className="w-full px-4 py-2 bg-secondary text-white font-bold rounded hover:bg-secondary/90 transition-all disabled:opacity-50"
            >
              {isPending && operation === "withdraw" ? "Processing..." : "WITHDRAW ALL"}
            </motion.button>

            {isPending && operation === "withdraw" && <p className="text-[9px] text-white/80">Waiting for confirmation...</p>}
            {withdrawStatus && (
              <p className={`text-[9px] ${withdrawStatus.startsWith("✓") ? "text-emerald-400" : "text-red-400"}`}>{withdrawStatus}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WalletPanel;
