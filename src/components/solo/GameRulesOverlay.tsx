'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, Shield, Play } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';

export const GameRulesOverlay = () => {
    const { solo, setSoloStatus } = useGameStore();

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-hidden"
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="max-w-md w-full relative p-8 bg-background border-2 border-primary shadow-[0_0_80px_rgba(0,242,255,0.2)]"
                style={{ clipPath: 'polygon(0 0, 95% 0, 100% 5%, 100% 100%, 5% 100%, 0 95%)' }}
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <span className="text-[10px] text-primary font-black uppercase tracking-[0.5em] mb-2 block">
                        Briefing_Level_{solo.level}
                    </span>
                    <h3 className="text-4xl font-extrabold text-white uppercase tracking-tighter neon-text">
                        INITIALIZING_HUNT
                    </h3>
                </div>

                {/* Rules Content */}
                <div className="space-y-6 mb-10">
                    <div className="flex items-start gap-4 p-4 bg-primary/5 border-l-2 border-primary">
                        <Target className="w-6 h-6 text-primary mt-1" />
                        <div>
                            <span className="text-xs font-black uppercase tracking-widest text-primary block mb-1">Objective</span>
                            <p className="text-sm text-gray-400">
                                Find the <span className="text-white font-bold">Energy_Treasure</span> hidden beneath one of these cyber-tiles.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-secondary/5 border-l-2 border-secondary/50">
                            <Zap className="w-5 h-5 text-secondary mb-2" />
                            <span className="text-[10px] uppercase font-black tracking-widest text-secondary block">Energy</span>
                            <span className="text-2xl font-black text-white">{solo.totalMoves} Charge</span>
                        </div>
                        <div className="p-4 bg-white/5 border-x border-white/10">
                            <Shield className="w-5 h-5 text-white/50 mb-2" />
                            <span className="text-[10px] uppercase font-black tracking-widest text-white/50 block">Grid</span>
                            <span className="text-2xl font-black text-white">{solo.gridSize} x {solo.gridSize}</span>
                        </div>
                    </div>

                    <p className="text-[11px] text-gray-500 font-mono leading-relaxed uppercase text-center border-t border-white/5 pt-4">
                        Revealing false tiles or depleting energy results in mission failure. Ready?
                    </p>
                </div>

                {/* Button */}
                <button
                    onClick={() => setSoloStatus('playing')}
                    className="w-full relative group py-5 bg-primary text-black font-black uppercase text-base tracking-[0.5em] overflow-hidden transition-all hover:bg-white active:scale-95"
                    style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        ENGAGE_PROTOCOL <Play className="w-5 h-5 group-hover:scale-125 transition-transform" />
                    </span>
                </button>

                {/* Decorative Elements */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />
            </motion.div>
        </motion.div>
    );
};
