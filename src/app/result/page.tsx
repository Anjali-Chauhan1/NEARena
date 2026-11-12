"use client";

import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { Award, Trophy, TrendingUp, RefreshCw, Rocket, Wallet, Share2, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { useGameStore, Player } from "@/store/useGameStore";
import { AuthGuard } from "@/components/shared/AuthGuard";

export default function Result() {
  const router = useRouter();
  const { players } = useGameStore();
  const [ranking, setRanking] = useState<Player[]>([]);

  useEffect(() => {
    // Basic sorting by score for mock leaderboard
    const sorted = Object.values(players).sort((a, b) => (b.score || 0) - (a.score || 0));
    setRanking(sorted);
  }, [players]);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#020203] relative overflow-hidden flex flex-col items-center justify-center p-8 font-mono cyber-grid">
        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] bg-[length:100%_2px,3px_100%]" />
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

        <motion.div
           variants={containerVariants}
           initial="hidden"
           animate="visible"
           className="max-w-7xl w-full px-8 py-10 relative z-10"
        >
            {/* Header Trophy Section */}
            <header className="flex flex-col items-center text-center gap-6 mb-20">
                <motion.div 
                    variants={itemVariants}
                    animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-32 h-32 relative flex items-center justify-center bg-background border-2 border-primary shadow-[0_0_40px_rgba(0,242,255,0.3)]"
                    style={{ clipPath: 'polygon(20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%, 0 20%)' }}
                >
                    <Trophy className="w-16 h-16 text-primary neon-text" />
                </motion.div>
                
                <div className="space-y-4">
                    <motion.h2 
                        variants={itemVariants}
                        className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none text-white neon-text"
                    >
                        MISSION <span className="text-primary">COMPLETE</span>
                    </motion.h2>
                    <motion.div 
                        variants={itemVariants}
                        className="flex items-center justify-center gap-6 text-gray-500 text-[10px] font-black uppercase tracking-[0.5em]"
                    >
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" /> SECTOR_CLEAR</span>
                        <div className="h-4 w-[1px] bg-white/20" />
                        <span className="text-white">REWARDS_BUFFERED: 100 BTQ</span>
                    </motion.div>
                </div>
            </header>

            {/* Content Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
                
                {/* Tactical Performance Card */}
                <motion.div variants={itemVariants} 
                    className="bg-background/80 p-10 border-2 border-primary/20 hover:border-primary/50 transition-colors relative group"
                    style={{ clipPath: 'polygon(0 0, 95% 0, 100% 5%, 100% 100%, 5% 100%, 0 95%)' }}
                >
                    <div className="absolute top-0 left-0 w-2 h-2 bg-primary" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-primary" />
                    
                    <div className="relative z-10">
                        <h3 className="text-xl font-black italic uppercase tracking-widest text-primary mb-10 flex items-center gap-4">
                            <Activity className="w-6 h-6" /> SYSTEM_LOGS
                        </h3>
                        
                        <div className="space-y-8">
                            <div className="flex justify-between items-end border-b border-white/10 pb-3">
                                <span className="text-gray-500 text-[11px] font-black uppercase tracking-widest">TACTICAL_GAIN</span>
                                <span className="text-2xl font-black italic tracking-tighter text-white">+34.8 XP</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Alliances Formed</span>
                                <span className="text-xl font-black italic tracking-tighter">02 Units</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Trust Index Delta</span>
                                <span className="text-xl font-black italic tracking-tighter text-secondary">+15.2</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-12 flex justify-between items-center p-6 bg-secondary/10 border border-secondary/20 rounded-2xl shadow-[inset_0_0_20px_rgba(189,0,255,0.1)]">
                         <div className="flex flex-col">
                             <span className="text-[10px] text-secondary font-black uppercase tracking-widest">Net Harvest</span>
                             <span className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">+12.5 BTQ</span>
                         </div>
                         <Wallet className="w-10 h-10 text-secondary opacity-50" />
                    </div>
                </motion.div>

                {/* Global Dominance Card */}
                <motion.div variants={itemVariants} className="glass-panel p-10 border-white/5 bg-white/[0.02] flex flex-col overflow-hidden relative group">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <h3 className="text-xl font-black italic uppercase tracking-widest text-primary flex items-center gap-3">
                                <TrendingUp className="w-5 h-5" /> Global Standing
                            </h3>
                            <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:neon-border-blue transition-all">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {ranking.slice(0, 4).map((p, i) => (
                                <div key={p.id} className={`flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-xl group/item hover:bg-white/[0.08] transition-all`}>
                                    <div className="flex items-center gap-6">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic text-sm ${i === 0 ? 'bg-primary text-black scale-110 shadow-[0_0_20px_rgba(0,242,255,0.4)]' : 'bg-white/5 text-gray-500'}`}>
                                            {i + 1}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black italic uppercase tracking-tight text-white/90">{p.name || `Unit_${p.id.slice(0, 4)}`}</span>
                                            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Active Operative</span>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-black italic tracking-tighter ${i === 0 ? 'text-primary' : 'text-gray-500'}`}>{p.score || 0} PTS</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-center gap-2 opacity-30 text-[9px] font-black uppercase tracking-[0.3em]">
                         Leaderboard updated 3ms ago
                    </div>
                </motion.div>
            </div>

            {/* Strategic Footer Actions */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-6 justify-center w-full">
                <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/lobby")}
                    className="flex-1 max-w-xs group relative px-12 py-5 bg-primary text-black font-black uppercase italic text-sm tracking-[0.25em] transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                        Next Mission
                    </span>
                </motion.button>

                <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 max-w-xs group relative px-12 py-5 bg-white/5 text-white border border-secondary px-8 py-4 font-black uppercase italic text-sm tracking-[0.25em] transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 bg-secondary/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                    <span className="relative z-10 flex items-center justify-center gap-3 group-hover:neon-text-purple transition-all">
                        <Rocket className="w-5 h-5 text-secondary" />
                        Upgrade Specs
                    </span>
                </motion.button>
            </motion.div>
        </motion.div>
      </main>
    </AuthGuard>
  );
}

