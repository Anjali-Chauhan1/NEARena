'use client';

import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Play, ChevronRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { hasCompletedPracticeRound } from '@/lib/user';

export const LevelSelectionScreen = () => {
    const { solo, startLevel } = useGameStore();
    const router = useRouter();

    const tryStart = (lvl: number) => {
        const practiceStakes = [5, 10, 15];
        const required = lvl > 3 ? solo.stake : (practiceStakes[lvl - 1] || lvl * 5);
        if ((solo.score || 0) < required) {
            alert(`Insufficient BTQ. You need ${required} BTQ to start this mission. Please buy BTQ.`);
            return;
        }
        startLevel(lvl);
    };

    const practiceLevels = [1, 2, 3];
    const practiceCleared = practiceLevels.every((lvl) => hasCompletedPracticeRound(lvl));
    const isEliteUnlocked = solo.unlockedLevel > 3 || practiceCleared;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 select-none">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl bg-[#15120e]/95 border-2 border-[#8a6a2f]"
            >
                <div className="h-1.5 bg-[#8a6a2f]" />
                <div className="p-6 md:p-8 grid gap-8">
                    <header className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black tracking-[0.35em] text-[#e2b04a] uppercase">Solo · treasure hunt</p>
                            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mt-1 text-[#e8d9b5]">
                                Choose your vault
                            </h1>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black tracking-[0.3em] text-white/45 uppercase">Balance</p>
                            <p className="text-2xl font-black italic text-[#e2b04a]">{solo.score} BTQ</p>
                        </div>
                    </header>

                    <section className="grid gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">Practice · one-time training</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {practiceLevels.map((lvl) => {
                                const isCompleted = hasCompletedPracticeRound(lvl);
                                const isLocked = lvl > solo.unlockedLevel || isCompleted;
                                const isCurrent = lvl === solo.unlockedLevel && !isCompleted;
                                const stake = [5, 10, 15][lvl - 1];

                                return (
                                    <motion.button
                                        key={lvl}
                                        whileHover={!isLocked ? { y: -4 } : {}}
                                        whileTap={!isLocked ? { scale: 0.98 } : {}}
                                        onClick={() => !isLocked && tryStart(lvl)}
                                        disabled={isLocked}
                                        className={`relative h-36 border-2 flex flex-col items-center justify-center transition-colors ${
                                            isCurrent
                                                ? 'border-[#c9973a] bg-[#2a2216] cursor-pointer hover:bg-[#33291a]'
                                                : isCompleted
                                                    ? 'border-[#3fae5a]/50 bg-[#141a12]'
                                                    : 'border-[#3a3225] bg-[#1a1612] opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="absolute top-3 right-3">
                                            {isCompleted && <CheckCircle2 className="w-5 h-5 text-[#3fae5a]" />}
                                            {isCurrent && <Play className="w-5 h-5 text-[#e2b04a]" />}
                                            {isLocked && !isCompleted && <Lock className="w-5 h-5 text-white/30" />}
                                        </div>
                                        <span className={`text-5xl font-black italic tracking-tighter ${isCurrent ? 'text-[#e2b04a]' : 'text-[#e8d9b5]'}`}>
                                            0{lvl}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] mt-2 text-white/55">
                                            {isCompleted ? 'Cleared' : isLocked ? 'Locked' : `Stake ${stake} BTQ`}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="grid gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/45">Elite arena · repeatable</p>
                        <motion.button
                            whileHover={isEliteUnlocked ? { y: -3 } : {}}
                            whileTap={isEliteUnlocked ? { scale: 0.99 } : {}}
                            onClick={() => isEliteUnlocked && tryStart(4)}
                            disabled={!isEliteUnlocked}
                            className={`w-full p-6 md:p-8 border-2 flex flex-col md:flex-row items-center justify-between gap-4 text-left transition-colors ${
                                isEliteUnlocked
                                    ? 'border-[#c9973a] bg-[#2a2216] hover:bg-[#33291a] cursor-pointer'
                                    : 'border-[#3a3225] bg-[#1a1612] opacity-50 cursor-not-allowed'
                            }`}
                        >
                            <div>
                                <h3 className={`text-3xl md:text-4xl font-black italic uppercase tracking-tighter ${isEliteUnlocked ? 'text-[#e2b04a]' : 'text-white/50'}`}>
                                    Elite vault
                                </h3>
                                <p className="text-[11px] font-black text-white/55 tracking-widest uppercase mt-1">
                                    {isEliteUnlocked
                                        ? '6x6 grid · 5 chances · set your own stake'
                                        : 'Clear practice levels 1–3 to unlock'}
                                </p>
                            </div>
                            {isEliteUnlocked ? (
                                <span className="flex items-center gap-2 px-5 py-3 bg-[#c9973a] text-black text-xs font-black uppercase tracking-[0.22em] [clip-path:polygon(14px_0,100%_0,calc(100%-14px)_100%,0_100%)]">
                                    Enter <ChevronRight className="w-4 h-4" />
                                </span>
                            ) : (
                                <Lock className="w-10 h-10 text-white/30" />
                            )}
                        </motion.button>
                    </section>

                    <button
                        onClick={() => router.push('/lobby')}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white/80 justify-self-start"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Exit to lobby
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
