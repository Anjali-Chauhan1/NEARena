"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface RoomCardProps {
  index: string;
  label: string;
  title: string;
  description: string;
  stake: string;
  reward: string;
  icon: ReactNode;
  onClick: () => void;
}

export function RoomCard({ index, label, title, description, stake, reward, icon, onClick }: RoomCardProps) {
  return (
    <motion.button
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group relative h-full w-full text-left p-7 md:p-8 flex flex-col gap-6 bg-[linear-gradient(160deg,#2a1d10_0%,#14100b_55%,#0c0a08_100%)] border border-[#8a6a2f]/50 hover:border-[#e2b04a] transition-colors duration-500 text-[#efe6d2]"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em]">
          <span className="text-[#e2b04a] mr-3">{index}</span>
          <span className="text-[#efe6d2]/45">{label}</span>
        </p>
        <div className="w-16 h-20 shrink-0 flex items-center justify-center text-[#f3d28a] bg-[linear-gradient(160deg,#5a3d17_0%,#2a1b0c_55%,#140d06_100%)] border border-[#8a6a2f] shadow-[inset_0_0_20px_rgba(226,176,74,0.25)] transition-transform duration-500 group-hover:-rotate-3">
          {icon}
        </div>
      </div>

      <div>
        <h3 className="font-[family-name:var(--font-cinzel)] text-4xl md:text-5xl font-bold text-[#f6efe1] group-hover:text-[#e2b04a] transition-colors duration-500">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[#efe6d2]/60">{description}</p>
      </div>

      <div className="mt-auto grid grid-cols-2 border-t border-[#efe6d2]/10 pt-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#efe6d2]/45">Stake</p>
          <p className="mt-1 font-[family-name:var(--font-cinzel)] text-xl font-bold text-[#f6efe1]">{stake}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#efe6d2]/45">Win</p>
          <p className="mt-1 font-[family-name:var(--font-cinzel)] text-xl font-bold text-[#3fae5a]">{reward}</p>
        </div>
      </div>

      <span className="font-[family-name:var(--font-cinzel)] flex items-center gap-3 text-sm font-bold uppercase tracking-[0.25em] text-[#e2b04a]">
        Take a seat
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </span>
    </motion.button>
  );
}
