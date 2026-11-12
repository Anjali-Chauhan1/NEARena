interface BadgeProps {
    icon?: React.ReactNode;
    label: string;
    tone?: "gold" | "muted";
}

export function Badge({ icon, label, tone = "gold" }: BadgeProps) {
    const toneClass = tone === "gold" ? "border-[#c9973a] text-[#e2b04a] bg-[#c9973a]/10" : "border-[#efe6d2]/25 text-[#efe6d2]/70";

    return (
        <div className={`px-3 py-1 border text-[10px] font-semibold uppercase tracking-[0.25em] flex items-center gap-2 ${toneClass}`}>
            {icon && <span className="opacity-80">{icon}</span>}
            <span>{label}</span>
        </div>
    );
}
