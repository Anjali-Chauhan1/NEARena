"use client";

import { motion } from "framer-motion";

interface StatItemProps {
    id?: string;
    icon?: React.ReactNode;
    value: string | number;
    label: string;
    variant?: 'default' | 'large' | 'minimal';
}

export function StatItem({ id, icon, value, label, variant = 'default' }: StatItemProps) {
    if (variant === 'minimal') {
        return (
            <div id={id} className="flex justify-between items-center group cursor-default gap-4 underline-offset-4 hover:underline transition-all">
              <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{label}</span>
              <span className="text-xl font-black italic tracking-tighter text-white">{value}</span>
            </div>
        );
    }

    if (variant === 'default') {
        return (
            <div id={id} className="flex items-center gap-5 group">
                {icon && (
                    <motion.div 
                        whileHover={{ scale: 1.15, rotate: -5 }}
                        className="glass-panel p-3 bg-white/5 border-white/10 group-hover:neon-border-blue transition-all"
                    >
                        {icon}
                    </motion.div>
                )}
                <div className="flex flex-col -space-y-1">
                    <span className="text-[11px] text-gray-500 uppercase font-black tracking-[0.4em] group-hover:text-primary transition-colors">{label}</span>
                    <span className="text-4xl font-black italic tracking-tighter text-white uppercase leading-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{value}</span>
                </div>
            </div>
        );
    }
    
    return null;
}
