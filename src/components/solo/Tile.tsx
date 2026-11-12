'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Target, X, Zap, Gift } from 'lucide-react';
import React from 'react';

interface TileProps {
    x: number;
    y: number;
    isRevealed: boolean;
    isTreasure: boolean;
    isFake?: boolean;
    isTrap?: boolean;
    onClick: () => void;
}

const TreasureIcon = ({ className }: { className?: string }) => (
    <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        className={className}
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* Dark Metal Base/Bottom Frame */}
        <path d="M10 75L15 85H85L90 75H10Z" fill="#1f2937" />
        <rect x="15" y="80" width="70" height="8" fill="#111827" />

        {/* Main Cuboidal Body (Orange/Wood Panels) */}
        <path d="M15 45H85V80H15V45Z" fill="#f59e0b" />
        {/* Wood Panel Dividers */}
        <path d="M15 55H85M15 65H85M15 75H85" stroke="#92400e" strokeWidth="1" opacity="0.4" />

        {/* Curved Lid Body */}
        <path d="M15 45C15 20 85 20 85 45H15Z" fill="#fbbf24" />
        {/* Lid Wood Detail */}
        <path d="M22 45C22 25 78 25 78 45H22Z" fill="#f59e0b" opacity="0.8" />

        {/* Black Metal Strapping - Vertical */}
        <rect x="20" y="27" width="8" height="53" fill="#1f2937" />
        <rect x="46" y="23" width="8" height="57" fill="#1f2937" />
        <rect x="72" y="27" width="8" height="53" fill="#1f2937" />

        {/* Black Metal Strapping - Horizontal Mid */}
        <rect x="15" y="42" width="70" height="6" fill="#1f2937" />
        <rect x="15" y="48" width="70" height="3" fill="#111827" opacity="0.5" />

        {/* Silver Rivets (Metal Studs) */}
        <circle cx="24" cy="35" r="2" fill="#94a3b8" />
        <circle cx="24" cy="45" r="2" fill="#94a3b8" />
        <circle cx="24" cy="55" r="2" fill="#94a3b8" />
        <circle cx="24" cy="70" r="2" fill="#94a3b8" />

        <circle cx="76" cy="35" r="2" fill="#94a3b8" />
        <circle cx="76" cy="45" r="2" fill="#94a3b8" />
        <circle cx="76" cy="55" r="2" fill="#94a3b8" />
        <circle cx="76" cy="70" r="2" fill="#94a3b8" />

        <circle cx="50" cy="32" r="2" fill="#94a3b8" />
        {/* Keyhole Latch (Yellow Plate) */}
        <path d="M45 40H55L58 55L50 60L42 55L45 40Z" fill="#facc15" stroke="#854d0e" strokeWidth="1" />
        <circle cx="50" cy="48" r="2.5" fill="#1a1108" />
        <path d="M50 48L48 54H52L50 48Z" fill="#1a1108" />
    </svg>
);

export const Tile: React.FC<TileProps> = ({ x, y, isRevealed, isTreasure, isFake, isTrap, onClick }) => {
    return (
        <motion.div
            whileHover={!isRevealed ? { scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.05)' } : {}}
            whileTap={!isRevealed ? { scale: 0.9 } : {}}
            onClick={onClick}
            className={`
                relative aspect-square border-2 transition-all duration-500 cursor-pointer overflow-hidden
                ${isRevealed 
                    ? (isTreasure 
                        ? 'border-[#FFD700] bg-[#FFD700]/10 shadow-[0_0_35px_rgba(255,215,0,0.5)]' 
                        : (isTrap ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(255,0,0,0.3)]' : 'border-white/10 bg-white/5 grayscale')) 
                    : (isTreasure || isFake ? 'border-[#FFD700]/30 bg-[#0a0a0c] shadow-[inset_0_0_15px_rgba(255,215,0,0.05)]' : 'bg-[#0a0a0c] border-white/5 hover:border-white/20')}
            `}
            style={{ 
                perspective: '1000px',
                clipPath: (isTreasure || isFake) && !isRevealed 
                    ? 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)'
                    : 'polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)'
            }}
        >
            <AnimatePresence mode="wait">
                {!isRevealed ? (
                    <motion.div
                        key="hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ rotateY: 90, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        {(isTreasure || isFake) ? (
                            <div className="relative flex flex-col items-center group w-full h-full justify-center">
                                <TreasureIcon className="w-20 h-20 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-[#FFD700]/5 blur-2xl rounded-full scale-110 animate-pulse pointer-events-none" />
                            </div>
                        ) : (
                            <div className="w-1 h-1 bg-white/10 rounded-full" />
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="revealed"
                        initial={{ rotateY: -90, opacity: 0, scale: 0.5 }}
                        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        {isTreasure ? (
                            <motion.div
                                animate={{ 
                                    scale: [1, 1.2, 1],
                                    filter: ['drop-shadow(0 0 5px #FFD700)', 'drop-shadow(0 0 20px #FFD700)', 'drop-shadow(0 0 5px #FFD700)']
                                }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                <Target className="w-10 h-10 text-[#FFD700] fill-[#FFD700]/20" />
                            </motion.div>
                        ) : (
                            isTrap ? (
                                <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}>
                                    <Zap className="w-8 h-8 text-red-500 fill-red-500/20" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    animate={{ scale: [1, 0.8, 1], opacity: [0.5, 0.2, 0.5] }}
                                >
                                    <X className="w-8 h-8 text-white/10" />
                                </motion.div>
                            )
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Glowing pattern for potential treasures */}
            {(isTreasure || isFake) && !isRevealed && (
                <div className="absolute inset-0 pointer-events-none border border-[#FFD700]/30 animate-pulse" />
            )}
        </motion.div>
    );
};
