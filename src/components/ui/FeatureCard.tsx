"use client";

import { motion } from "framer-motion";

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
}

export function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className="glass-panel p-12 group relative overflow-hidden flex flex-col items-start gap-6 transition-all duration-500 ease-out"
    >
      {/* Decorative accent background */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
      
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 group-hover:neon-border-blue group-hover:bg-primary/5 transition-all duration-500 shadow-inner">
        <div className="group-hover:scale-110 transition-transform duration-500">{icon}</div>
      </div>
      
      <div className="space-y-4 relative z-10">
        <h3 className="text-3xl font-black tracking-tighter text-white uppercase italic group-hover:neon-text-blue transition-colors leading-none">{title}</h3>
        <p className="text-gray-400 text-base leading-relaxed font-medium tracking-wide">{desc}</p>
      </div>

      {/* Modern scanline effect on hover */}
      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-0 group-hover:scale-100 transition-transform duration-700" />
    </motion.div>
  );
}
