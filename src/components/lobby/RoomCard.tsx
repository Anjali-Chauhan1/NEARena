"use client";

import { motion } from "framer-motion";
import { TrendingUp, ArrowRight, Zap, Target, Users } from "lucide-react";

interface RoomCardProps {
  title: string;
  icon: React.ReactNode;
  entryFee: number;
  avgReward: number;
  stats: string;
  variant: 'blue' | 'purple' | 'pink';
  onClick: () => void;
}

export function RoomCard({ title, icon, entryFee, avgReward, stats, variant, onClick }: RoomCardProps) {
  const colorStyles = {
    blue: {
      border: 'border-primary/30',
      hoverBorder: 'hover:border-primary',
      glow: 'shadow-[0_0_20px_rgba(0,242,255,0.15)]',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(0,242,255,0.3)]',
      text: 'text-primary',
      bgGlow: 'from-primary/10 to-transparent',
      accent: 'bg-primary'
    },
    purple: {
      border: 'border-secondary/30',
      hoverBorder: 'hover:border-secondary',
      glow: 'shadow-[0_0_20px_rgba(188,19,254,0.15)]',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(188,19,254,0.3)]',
      text: 'text-secondary',
      bgGlow: 'from-secondary/10 to-transparent',
      accent: 'bg-secondary'
    },
    pink: {
      border: 'border-accent/30',
      hoverBorder: 'hover:border-accent',
      glow: 'shadow-[0_0_20px_rgba(255,0,60,0.15)]',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(255,0,60,0.3)]',
      text: 'text-accent',
      bgGlow: 'from-accent/10 to-transparent',
      accent: 'bg-accent'
    }
  }[variant];

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative p-8 cursor-pointer transition-all duration-500 overflow-hidden
        bg-background/80 border-2 ${colorStyles.border} ${colorStyles.hoverBorder}
        ${colorStyles.glow} ${colorStyles.hoverGlow}
        group
      `}
      style={{
        clipPath: 'polygon(0 0, 90% 0, 100% 10%, 100% 100%, 10% 100%, 0 90%)'
      }}
    >
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
      
      {/* Background Gradient */}
      <div className={`absolute -inset-1 bg-gradient-to-br ${colorStyles.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative z-20">
        <div className="flex justify-between items-start mb-8">
          <div className={`
            p-4 bg-background/60 border border-white/10 
            group-hover:${colorStyles.border} transition-colors duration-500
            shadow-inner scale-110
          `}
          style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 20%)' }}
          >
            <div className={`transition-transform duration-500 group-hover:scale-110 ${colorStyles.text}`}>
              {icon}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1 justify-end">
              <div className={`w-1 h-1 rounded-full ${colorStyles.accent} animate-ping`} />
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] font-mono">STAKE_REQUIRED</span>
            </div>
            <span className="text-4xl font-black italic tracking-tighter text-white font-mono leading-none">
              {entryFee} <span className="text-[12px] font-normal opacity-50 not-italic uppercase tracking-widest ml-1">BTQ</span>
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <h4 className={`text-3xl font-black italic uppercase tracking-tighter ${colorStyles.text} group-hover:cyber-glitch`}>
              {title}
            </h4>
            <div className={`absolute -bottom-1 left-0 w-12 h-0.5 ${colorStyles.accent} opacity-50`} />
          </div>

          <div className="flex items-center gap-3 py-1.5 px-4 bg-white/5 border-l-2 border-white/20 w-fit backdrop-blur-sm">
            <TrendingUp className={`w-4 h-4 ${colorStyles.text}`} />
            <span className="text-[11px] text-gray-300 font-bold uppercase tracking-widest font-mono">
              EST_YIELD: <span className="text-white">+{avgReward} Pts</span>
            </span>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] font-mono">SYSTEM_LOG</span>
              <ArrowRight className={`w-4 h-4 ${colorStyles.text} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300`} />
            </div>
            <p className="text-gray-400 text-[11px] font-medium leading-relaxed font-mono italic pr-2">
              &gt; {stats}
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Corner */}
      <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl ${colorStyles.bgGlow} pointer-events-none opacity-20`} />
    </motion.div>
  );
}
