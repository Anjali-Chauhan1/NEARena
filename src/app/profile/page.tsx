"use client";

import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  User, Shield, TrendingUp, History, Star, ArrowLeft, 
  Coins, Rocket, Target, Activity, Cpu, Zap, 
  Terminal, BarChart3, Fingerprint, Lock, Wallet as WalletIcon
} from "lucide-react";
import { getWalletUser } from "@/lib/user";
import { Badge } from "@/components/ui/Badge";
import { DashboardStat, HistoryRow, TacticalSkill, ReputationMeter } from "@/components/profile/ProfileComponents";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useGameStore } from "@/store/useGameStore";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";

import WalletPanel from "@/components/wallet/WalletPanel";

export default function Profile() {
  const router = useRouter();
    const walletUser = getWalletUser();
  const { solo } = useGameStore();

  const winRatio = solo.history.length > 0 
    ? ((solo.history.filter(h => h.result === 'SUCCESS').length / solo.history.length) * 100).toFixed(1)
    : "0.0";

  const reputation = Math.min(Math.floor(solo.score * 0.1) + (solo.unlockedLevel * 100), 1000);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen max-h-screen bg-[#020203] relative overflow-hidden flex flex-col items-center font-sans">
        <div className="absolute inset-0 bg-mesh-gradient opacity-10 pointer-events-none" />
        <div className="scanline" />

        <div className="relative z-10 w-full max-w-7xl px-4 py-6 flex flex-col gap-4 h-full overflow-hidden">
            
            {/* Compact Header */}
            <header className="flex justify-between items-center glass-panel p-4 border-white/5 bg-white/[0.01] rounded-2xl">
                <motion.button 
                    whileHover={{ x: -2 }}
                    onClick={() => router.push("/lobby")}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-all uppercase font-black text-[9px] tracking-[0.2em] group"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> 
                    LOBBY
                </motion.button>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <h2 className="text-lg font-black italic tracking-tighter uppercase leading-none">OPERATIVE <span className="neon-text-blue">PROFILE</span></h2>
                        <span className="text-[7px] text-gray-600 font-black tracking-[0.3em] uppercase">SEC_LVL_0{solo.level}</span>
                    </div>
                    <Terminal className="w-3.5 h-3.5 text-primary opacity-50" />
                </div>
            </header>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden"
            >
                {/* Left Side: Identity & Intelligence */}
                <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
                    <motion.div variants={itemVariants} className="glass-panel p-6 border-white/10 relative overflow-hidden group shrink-0">
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <div className="relative w-28 h-28">
                                <div className="absolute inset-0 rounded-full border border-primary/10 animate-[spin_15s_linear_infinite]" style={{ borderStyle: 'dashed' }} />
                                <div className="w-full h-full glass-panel neon-border-blue rounded-full flex items-center justify-center bg-primary/5 p-1.5 relative z-10">
                                    <div className="w-full h-full rounded-full border border-primary/10 flex items-center justify-center p-4 bg-[#0a0a0f] overflow-hidden">
                                        <User className="w-full h-full text-white/80" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-center space-y-0.5">
                                <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white leading-none">{walletUser}</h3>
                                <p className="text-[8px] text-primary font-black uppercase tracking-[0.3em]">Unit Active</p>
                            </div>
                            
                            <div className="flex gap-2 w-full">
                                <Badge label={solo.unlockedLevel > 5 ? "Elite" : "Vet"} color="blue" />
                                <Badge label="Loyal" color="purple" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-panel p-6 border-white/5 bg-white/[0.01] flex-1 overflow-hidden flex flex-col">
                        <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-primary" /> Intelligence
                        </h4>
                        
                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <ReputationMeter value={reputation} />
                            <div className="space-y-4 pt-2">
                                <TacticalSkill label="Win Ratio" level={Math.floor(Number(winRatio) / 10)} color="primary" />
                                <TacticalSkill label="Sector Clearance" level={Math.min(solo.unlockedLevel, 10)} color="secondary" />
                                <TacticalSkill label="Risk Level" level={solo.stake > 100 ? 8 : 4} color="accent" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side: Command Dashboard */}
                <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
                    <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
                        <DashboardStat icon={Coins} label="BTQ" value={`${solo.score} BTQ`} />
                        <DashboardStat icon={Target} label="Tier" value={solo.unlockedLevel > 3 ? "Elite" : "Scout"} />
                        <DashboardStat icon={Lock} label="Access" value={solo.withdrawalUnlocked ? "FULL" : "REST"} />
                        <DashboardStat icon={Zap} label="System" value="SYNC" />
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-panel p-6 border-white/5 bg-white/[0.01] relative overflow-hidden shrink-0">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span className="text-5xl font-black italic uppercase tracking-tighter text-white">LVL <span className="neon-text-purple">{solo.unlockedLevel - 1}</span></span>
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.3em]">Current Rank</span>
                                    <span className="text-sm font-black italic text-secondary uppercase italic">
                                        {solo.unlockedLevel > 5 ? 'Elite Guard' : 'Sector Scout'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-black text-white italic font-mono">
                                    {solo.score} <span className="text-primary">/</span> { (solo.unlockedLevel) * 200 }
                                </span>
                                <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden mt-1.5 p-0.5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((solo.score / ((solo.unlockedLevel) * 200)) * 100, 100)}%` }}
                                        className="h-full bg-primary rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-panel p-6 border-white/5 flex-1 overflow-hidden flex flex-col">
                        <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2"><History className="w-3.5 h-3.5 text-primary" /> Mission Log</div>
                          <span className="text-[7px] opacity-40">AUTO_SYNC_ENABLED</span>
                        </h4>
                        
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                          {solo.history.length > 0 ? (
                            solo.history.map((op, i) => (
                                <HistoryRow 
                                    key={i}
                              result={op.result === 'SUCCESS' ? 'VIC' : 'LOSS'}
                              reward={`${op.reward} BTQ`}
                                    mode={`Sector ${op.level} Scan`}
                                    date={op.date}
                                    color={op.result === 'SUCCESS' ? 'green' : 'red'}
                                />
                            ))
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 py-8">
                                <BarChart3 className="w-8 h-8 mb-2" />
                                <span className="text-[8px] font-black uppercase tracking-widest">No Logs</span>
                            </div>
                          )}
                        </div>
                    </motion.div>

                    {/* Wallet & BTQ Purchase Section */}
                    <motion.div variants={itemVariants} className="glass-panel p-6 border-primary/30 bg-primary/5 col-span-full">
                        <WalletPanel />
                    </motion.div>
                </div>
            </motion.div>
        </div>
      </main>
    </AuthGuard>
  );
}
