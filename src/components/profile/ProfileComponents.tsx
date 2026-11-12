"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

const display = "font-[family-name:var(--font-cinzel)]";

export function HistoryRow({ won, reward, title, date }: { won: boolean; reward: string; title: string; date: string }) {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-[#efe6d2]/10 last:border-b-0 hover:bg-[#efe6d2]/[0.03] transition-colors">
            <div className="flex items-center gap-4 min-w-0">
                <span
                    className={`w-14 shrink-0 text-center py-1 text-[10px] font-semibold uppercase tracking-[0.2em] border ${
                        won ? "border-[#3fae5a]/50 text-[#3fae5a]" : "border-[#a93226]/60 text-[#e74c3c]"
                    }`}
                >
                    {won ? "Won" : "Lost"}
                </span>
                <div className="min-w-0">
                    <p className="text-sm text-[#efe6d2]/90 truncate">{title}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#efe6d2]/40">{date}</p>
                </div>
            </div>
            <span className={`${display} shrink-0 text-base font-bold ${won ? "text-[#3fae5a]" : "text-[#efe6d2]/50"}`}>{reward}</span>
        </div>
    );
}

export function DashboardStat({ label, value, icon: Icon }: { label: string; value: string; icon?: LucideIcon }) {
    return (
        <div className="flex flex-col gap-2 p-4 bg-[linear-gradient(160deg,#2a1d10_0%,#14100b_60%,#0c0a08_100%)] border border-[#8a6a2f]/50">
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-3.5 h-3.5 text-[#e2b04a]" />}
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#efe6d2]/50">{label}</span>
            </div>
            <span className={`${display} text-xl md:text-2xl font-bold text-[#f6efe1] leading-none`}>{value}</span>
        </div>
    );
}

export function TacticalSkill({ label, level, color = "#e2b04a" }: { label: string; level: number; color?: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#efe6d2]/55">{label}</span>
                <span className="text-xs font-semibold text-[#efe6d2]/80">{level}/10</span>
            </div>
            <div className="flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-1.5 flex-1 transition-colors duration-500"
                        style={{ backgroundColor: i < level ? color : "rgba(239,230,210,0.08)", transitionDelay: `${i * 30}ms` }}
                    />
                ))}
            </div>
        </div>
    );
}

export function ReputationMeter({ value }: { value: number }) {
    return (
        <div>
            <div className="flex justify-between items-end mb-3">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-[#efe6d2]/50">Reputation</p>
                    <p className={`${display} text-lg font-bold text-[#f6efe1]`}>{value >= 600 ? "High Roller" : value >= 300 ? "Regular" : "Newcomer"}</p>
                </div>
                <p className={`${display} text-2xl font-bold text-[#e2b04a] leading-none`}>
                    {value}
                    <span className="text-xs text-[#efe6d2]/40"> / 1000</span>
                </p>
            </div>
            <div className="h-2 w-full bg-[#efe6d2]/[0.08] overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / 1000) * 100}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full bg-[linear-gradient(90deg,#8a6a2f,#e2b04a)]"
                />
            </div>
        </div>
    );
}
