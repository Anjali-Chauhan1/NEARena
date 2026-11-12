interface BadgeProps {
    icon?: React.ReactNode;
    label: string;
    color: 'blue' | 'purple' | 'pink' | 'primary' | 'secondary' | 'accent' | 'warning';
}

export function Badge({ icon, label, color }: BadgeProps) {
    const colorClasses: Record<string, string> = {
        blue: 'border-primary text-primary bg-primary/20 shadow-[0_0_8px_rgba(0,242,255,0.2)]',
        primary: 'border-primary text-primary bg-primary/20 shadow-[0_0_8px_rgba(0,242,255,0.2)]',
        purple: 'border-secondary text-secondary bg-secondary/20 shadow-[0_0_8px_rgba(188,19,254,0.2)]',
        secondary: 'border-secondary text-secondary bg-secondary/20 shadow-[0_0_8px_rgba(188,19,254,0.2)]',
        pink: 'border-accent text-accent bg-accent/20 shadow-[0_0_8px_rgba(255,0,60,0.2)]',
        accent: 'border-accent text-accent bg-accent/20 shadow-[0_0_8px_rgba(255,0,60,0.2)]',
        warning: 'border-warning text-warning bg-warning/20 shadow-[0_0_8px_rgba(255,184,0,0.2)]',
    };

    const colorClass = colorClasses[color] || colorClasses.blue;
        
    return (
        <div 
          className={`
            px-4 py-1 border-[1px] text-[10px] font-black uppercase tracking-widest 
            flex items-center gap-2 font-mono transition-all duration-300
            ${colorClass}
          `}
          style={{
            clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%, 0 35%)'
          }}
        >
            {icon && <span className="opacity-80 scale-90">{icon}</span>}
            <span>{label}</span>
        </div>
    );
}
