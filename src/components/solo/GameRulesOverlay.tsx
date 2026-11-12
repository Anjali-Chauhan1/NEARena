'use client';

import { motion } from 'framer-motion';
import { Gem, Box, Skull } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';

export const GameRulesOverlay = () => {
    const { solo, setSoloStatus } = useGameStore();
    const isElite = solo.level > 3;

    const rules = [
        { icon: <Gem className="w-5 h-5 text-[#e2b04a]" />, title: 'One real treasure', text: 'Exactly one chest holds the treasure. Find it to win.' },
        { icon: <Box className="w-5 h-5 text-[#a8a29e]" />, title: 'Decoys', text: 'The other chests and tiles are empty. Each pick costs 1 chance.' },
        { icon: <Skull className="w-5 h-5 text-[#e74c3c]" />, title: 'Hidden traps', text: 'Some spots are trapped and cost 2 chances.' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-black/55 flex items-center justify-center p-4 overflow-y-auto"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#15120e] border-2 border-[#8a6a2f]"
            >
                <div className="h-1.5 bg-[#8a6a2f]" />
                <div className="p-6 md:p-8 grid gap-5">
                    <header>
                        <p className="text-[10px] font-black tracking-[0.35em] text-[#e2b04a] uppercase">
                            {isElite ? 'Elite vault' : `Practice level ${solo.level}`}
                        </p>
                        <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none mt-1 text-[#e8d9b5]">
                            How the vault works
                        </h3>
                    </header>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#0e0c09] border border-[#5c4a26] p-4">
                            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/45">Chances</p>
                            <p className="text-3xl font-black italic text-[#e2b04a]">{solo.totalMoves}</p>
                        </div>
                        <div className="bg-[#0e0c09] border border-[#5c4a26] p-4">
                            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/45">Grid</p>
                            <p className="text-3xl font-black italic text-[#e8d9b5]">{solo.gridSize}x{solo.gridSize}</p>
                        </div>
                    </div>

                    <ul className="grid gap-2">
                        {rules.map((r) => (
                            <li key={r.title} className="flex items-start gap-3 bg-[#1c1813] border-l-4 border-[#5c4a26] p-3">
                                <span className="mt-0.5">{r.icon}</span>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-[#e8d9b5]">{r.title}</p>
                                    <p className="text-[12px] text-white/55 leading-snug">{r.text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => setSoloStatus('playing')}
                        className="w-full py-4 text-sm font-black uppercase tracking-[0.3em] bg-[#c9973a] text-black hover:bg-[#ddb04f] active:translate-y-px transition-all [clip-path:polygon(14px_0,100%_0,calc(100%-14px)_100%,0_100%)]"
                    >
                        Start hunting
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
