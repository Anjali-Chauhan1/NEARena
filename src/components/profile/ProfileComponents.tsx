"use client";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export function HistoryRow({ result, reward, mode, date, color }: any) {
    const resultColor = color === 'green' ? 'text-primary' : color === 'red' ? 'text-accent' : 'text-yellow-400';
    const borderColor = color === 'green' ? 'border-primary/10' : color === 'red' ? 'border-accent/10' : 'border-white/5';
    
    return (
        <motion.div 
            whileHover={{ x: 2, backgroundColor: "rgba(255,255,255,0.03)" }}
            className={`flex items-center justify-between p-3 bg-white/[0.01] rounded-xl border ${borderColor} transition-all group`}
        >
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                    <div className={`text-[8px] font-black uppercase tracking-[0.1em] ${resultColor} mb-0.5`}>{result}</div>
                    <div className={`w-1.5 h-1.5 rounded-full ${color === 'green' ? 'bg-primary' : 'bg-accent'} shadow-[0_0_6px_currentColor]`} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-white/90 leading-tight">{mode}</span>
                    <span className="text-[8px] text-gray-600 uppercase font-black tracking-widest">{date}</span>
                </div>
            </div>
            <div className="text-right flex flex-col items-end">
                <span className={`text-sm font-black italic ${color === 'green' ? 'text-primary' : 'text-gray-400'}`}>{reward}</span>
            </div>
        </motion.div>
    )
}

export function DashboardStat({ label, value, subValue, icon: Icon }: { label: string, value: string, subValue?: string, icon?: LucideIcon }) {
    return (
        <div className="flex flex-col p-3 bg-white/[0.01] border border-white/5 rounded-xl hover:border-primary/20 transition-colors group">
            <div className="flex items-center gap-2 mb-1.5">
                {Icon && <Icon className="w-3 h-3 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />}
                <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.1em]">{label}</span>
            </div>
            <span className="text-base font-black text-white uppercase italic tracking-tighter leading-none">{value}</span>
            {subValue && (
                <span className="text-[7px] text-primary font-black mt-1.5 uppercase opacity-60 tracking-wider border-l border-primary/30 pl-1.5">
                    {subValue}
                </span>
            )}
        </div>
    )
}

export function TacticalSkill({ label, level, color = "primary" }: { label: string, level: number, color?: "primary" | "secondary" | "accent" }) {
    const colorClass = color === "primary" ? "bg-primary" : color === "secondary" ? "bg-secondary" : "bg-accent";
    const glowClass = color === "primary" ? "shadow-[0_0_8px_rgba(0,242,255,0.2)]" : color === "secondary" ? "shadow-[0_0_8px_rgba(188,19,254,0.2)]" : "shadow-[0_0_8px_rgba(255,0,60,0.2)]";

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">{label}</span>
                <span className="text-[8px] font-black text-white italic">0{level}</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                {[...Array(10)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-full flex-1 rounded-sm transition-all duration-500 ${i < level ? `${colorClass} ${glowClass}` : 'bg-white/5'}`}
                        style={{ transitionDelay: `${i * 30}ms` }}
                    />
                ))}
            </div>
        </div>
    );
}

export function ReputationMeter({ value }: { value: number }) {
    return (
        <div className="relative">
            <div className="flex justify-between items-end mb-1.5">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Trust Index</span>
                    <span className="text-base font-black italic text-white uppercase leading-none">Honor Bound</span>
                </div>
                <div className="text-right">
                    <span className="text-xl font-black italic text-primary neon-text leading-none">{value}</span>
                    <span className="text-[8px] font-black text-gray-600 block mt-0.5">/ 1000</span>
                </div>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / 1000) * 100}%` }}
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative"
                >
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                </motion.div>
            </div>
        </div>
    );
}
