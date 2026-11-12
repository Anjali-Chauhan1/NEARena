"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Coins, Crown, History, Lock, Trophy, User } from "lucide-react";
import { getWalletUser } from "@/lib/user";
import { Badge } from "@/components/ui/Badge";
import { DashboardStat, HistoryRow, TacticalSkill, ReputationMeter } from "@/components/profile/ProfileComponents";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useGameStore } from "@/store/useGameStore";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import WalletPanel from "@/components/wallet/WalletPanel";

const display = "font-[family-name:var(--font-cinzel)]";
const panel = "bg-[linear-gradient(160deg,#2a1d10_0%,#14100b_55%,#0c0a08_100%)] border border-[#8a6a2f]/50";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.05 + i * 0.07, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Profile() {
  const walletUser = getWalletUser();
  const { solo } = useGameStore();

  const wins = solo.history.filter((h) => h.result === "SUCCESS").length;
  const winRatio = solo.history.length > 0 ? (wins / solo.history.length) * 100 : 0;
  const reputation = Math.min(Math.floor(solo.score * 0.1) + solo.unlockedLevel * 100, 1000);
  const isElite = solo.unlockedLevel > 3;
  const levelsCleared = Math.max(0, Math.min(solo.unlockedLevel - 1, 3));

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[radial-gradient(ellipse_at_70%_0%,#3a2614_0%,#120c08_45%,#06070a_100%)] text-[#efe6d2]">
        <header className="flex items-center justify-between gap-4 px-5 md:px-12 py-6">
          <Link href="/lobby" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#efe6d2]/60 hover:text-[#e2b04a] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Lobby
          </Link>
          <Link href="/" className={`${display} text-xl md:text-2xl font-bold tracking-[0.18em]`}>
            NEARENA
          </Link>
          <ConnectWallet />
        </header>

        <div className="max-w-7xl mx-auto px-5 md:px-12 pb-20 grid gap-6">
          <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={0} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
            <div className="flex items-center gap-5">
              <div className="w-20 h-24 md:w-24 md:h-28 shrink-0 flex items-center justify-center text-[#f3d28a] bg-[linear-gradient(160deg,#5a3d17_0%,#2a1b0c_55%,#140d06_100%)] border border-[#8a6a2f] shadow-[inset_0_0_24px_rgba(226,176,74,0.25)]">
                <User className="w-10 h-10" strokeWidth={1.4} />
              </div>
              <div className="min-w-0">
                <p className={`${display} text-xs tracking-[0.45em] text-[#c9a46a]`}>PLAYER PROFILE</p>
                <h1 className={`${display} mt-2 text-3xl sm:text-4xl md:text-5xl font-bold text-[#f6efe1] break-all`}>{walletUser}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge label={isElite ? "Elite vault" : "Practice"} icon={isElite ? <Crown className="w-3 h-3" /> : undefined} />
                  <Badge label={solo.withdrawalUnlocked ? "Withdrawals open" : "Withdrawals locked"} tone="muted" />
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={1} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardStat icon={Coins} label="Balance" value={`${solo.score} BTQ`} />
            <DashboardStat icon={Crown} label="Rank" value={isElite ? "Elite" : "Practice"} />
            <DashboardStat icon={Trophy} label="Win rate" value={`${winRatio.toFixed(0)}%`} />
            <DashboardStat icon={Lock} label="Withdraw" value={solo.withdrawalUnlocked ? "Open" : "Locked"} />
          </motion.section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={2} className={`lg:col-span-5 ${panel} p-6 md:p-7 grid gap-7 content-start`}>
              <ReputationMeter value={reputation} />
              <div className="grid gap-5">
                <TacticalSkill label="Win rate" level={Math.round(winRatio / 10)} />
                <TacticalSkill label="Practice vaults cleared" level={Math.round((levelsCleared / 3) * 10)} color="#3fae5a" />
                <TacticalSkill label="Risk appetite" level={solo.stake > 100 ? 8 : 4} color="#c0392b" />
              </div>
            </motion.section>

            <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={3} className={`lg:col-span-7 ${panel} flex flex-col min-h-[320px]`}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#efe6d2]/10">
                <h2 className={`${display} flex items-center gap-3 text-xl font-bold text-[#f6efe1]`}>
                  <History className="w-5 h-5 text-[#e2b04a]" /> Game history
                </h2>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#efe6d2]/40">{solo.history.length} rounds</span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[420px]">
                {solo.history.length > 0 ? (
                  solo.history.map((round, i) => (
                    <HistoryRow
                      key={i}
                      won={round.result === "SUCCESS"}
                      reward={`${round.reward} BTQ`}
                      title={round.level > 3 ? "Elite vault" : `Practice vault ${round.level}`}
                      date={round.date}
                    />
                  ))
                ) : (
                  <div className="h-full min-h-[240px] flex flex-col items-center justify-center gap-2 text-center px-6">
                    <p className={`${display} text-lg text-[#efe6d2]/70`}>No rounds yet</p>
                    <p className="text-sm text-[#efe6d2]/45">Your solo vault results will show up here.</p>
                  </div>
                )}
              </div>
            </motion.section>
          </div>

          <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={4} className="grid gap-3 max-w-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em]">
              <span className="text-[#e2b04a] mr-3">/</span>
              <span className="text-[#efe6d2]/45">Your purse</span>
            </p>
            <WalletPanel />
          </motion.section>
        </div>
      </main>
    </AuthGuard>
  );
}
