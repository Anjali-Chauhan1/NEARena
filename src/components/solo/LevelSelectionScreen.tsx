'use client';

import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Play, ChevronRight } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { hasCompletedPracticeRound } from '@/lib/user';

export const LevelSelectionScreen = () => {
    const { solo, startLevel } = useGameStore();

    const tryStart = (lvl: number) => {
        const practiceStakes = [5, 10, 15];
        const required = lvl > 3 ? solo.stake : (practiceStakes[lvl - 1] || lvl * 5);
        if ((solo.score || 0) < required) {
            // quick inline feedback — ask user to buy BTQ
            alert(`Insufficient BTQ. You need ${required} BTQ to start this mission. Please buy BTQ.`);
            return;
        }
        startLevel(lvl);
    };

    const practiceLevels = [1, 2, 3];
    const practiceCleared = practiceLevels.every((lvl) => hasCompletedPracticeRound(lvl));
    const isEliteUnlocked = solo.unlockedLevel > 3 || practiceCleared;

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 select-none">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h2 className="text-4xl font-black text-white tracking-widest uppercase mb-2">
                    Mission_Selection
                </h2>
                <div className="h-1 w-32 bg-primary mx-auto opacity-50" />
            </motion.div>

            <div className="w-full max-w-5xl space-y-12">
                {/* Practice / Beginner Levels */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/30" />
                        <span className="text-[10px] text-primary font-black uppercase tracking-[0.5em]">Practice_Protocols</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/30" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {practiceLevels.map((lvl) => {
                            const isCompleted = hasCompletedPracticeRound(lvl);
                            const isLocked = lvl > solo.unlockedLevel || isCompleted;
                            const isCurrent = lvl === solo.unlockedLevel && !isCompleted;

                            return (
                                <motion.button
                                    key={lvl}
                                    whileHover={!isLocked ? { scale: 1.02, y: -5 } : {}}
                                    whileTap={!isLocked ? { scale: 0.98 } : {}}
                                    onClick={() => !isLocked && tryStart(lvl)}
                                    disabled={isLocked}
                                    className={`
                                        relative h-40 rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-300 overflow-hidden
                                        ${isCurrent ? 'border-primary bg-primary/10 shadow-[0_0_40px_rgba(0,242,255,0.15)]' : ''}
                                        ${isCompleted ? 'border-secondary/40 bg-secondary/5 opacity-60' : ''}
                                        ${isLocked ? 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                    style={{ clipPath: 'polygon(0 0, 92% 0, 100% 12%, 100% 100%, 8% 100%, 0 88%)' }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100" />
                                    
                                    <span className={`text-5xl font-black italic tracking-tighter ${isCurrent ? 'text-primary neon-text' : 'text-white'}`}>
                                        LVL_0{lvl}
                                    </span>

                                    <div className="absolute top-3 right-3">
                                        {isCompleted && <CheckCircle2 className="w-6 h-6 text-secondary shadow-[0_0_10px_rgba(34,197,94,0.5)]" />}
                                        {isCurrent && <Play className="w-6 h-6 text-primary animate-pulse shadow-[0_0_15px_rgba(0,242,255,1)]" />}
                                        {isLocked && !isCompleted && <Lock className="w-6 h-6 text-gray-600" />}
                                    </div>

                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] mt-3 opacity-60">
                                        {isCompleted ? 'COMPLETED' : (isLocked ? 'ENCRYPTED' : 'BEGINNER_PHASE')}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Elite Arena - Goal / Continuous Mode */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-accent/30" />
                        <span className="text-[10px] text-accent font-black uppercase tracking-[0.5em]">The_Elite_Arena</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-accent/30" />
                    </div>

                    <motion.button
                        whileHover={isEliteUnlocked ? { scale: 1.01 } : {}}
                        whileTap={isEliteUnlocked ? { scale: 0.99 } : {}}
                        onClick={() => isEliteUnlocked && tryStart(4)}
                        disabled={!isEliteUnlocked}
                        className={`
                            relative w-full py-12 px-8 border-2 flex flex-col md:flex-row items-center justify-between transition-all duration-500 overflow-hidden
                            ${isEliteUnlocked 
                                ? 'border-accent bg-accent/10 shadow-[0_0_60px_rgba(168,85,247,0.2)] cursor-pointer' 
                                : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'}
                        `}
                        style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}
                    >
                        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2 relative z-10">
                            <h3 className={`text-4xl font-black tracking-tighter uppercase italic ${isEliteUnlocked ? 'text-accent neon-text-accent' : 'text-gray-500'}`}>
                                ENTER_ELITE_ARENA
                            </h3>
                            <p className="text-[11px] font-bold text-white/50 tracking-widest uppercase">
                                {isEliteUnlocked 
                                    ? '6x6 FIXED GRID // PERSISTENT STAKING // UNRESTRICTED YIELD' 
                                    : 'REQUIREMENT: CLEAR PRACTICE PHASES 01-03'}
                            </p>
                        </div>

                        {isEliteUnlocked ? (
                            <div className="flex items-center gap-4 mt-6 md:mt-0 relative z-10">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-accent font-black uppercase tracking-widest">Protocol_Active</span>
                                    <span className="text-xl font-black text-white italic tracking-tighter">UNLIMITED_OPS</span>
                                </div>
                                <div className="p-4 bg-accent/20 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                                    <ChevronRight className="w-10 h-10 text-accent animate-pulse" />
                                </div>
                            </div>
                        ) : (
                            <Lock className="w-12 h-12 text-gray-700 mt-6 md:mt-0 opacity-50" />
                        )}

                        {/* Background Decor */}
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-accent/5 rounded-full blur-[80px]" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
