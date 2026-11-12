"use client";

interface ActionButtonProps {
    id?: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    color: 'blue' | 'purple' | 'pink'; 
    onClick?: () => void;
}

export function ActionButton({ id, icon, label, active, color, onClick }: ActionButtonProps) {
    const colorClass = color === 'blue' 
        ? 'border-primary shadow-[0_0_15px_rgba(0,242,255,0.3)] text-primary' 
        : color === 'purple' 
            ? 'border-secondary shadow-[0_0_15px_rgba(188,19,254,0.3)] text-secondary' 
            : 'border-accent shadow-[0_0_15px_rgba(255,0,60,0.3)] text-accent';
            
    return (
        <button 
          id={id}
          onClick={onClick}
          className={`
            relative flex flex-col items-center justify-center p-5 px-8 
            bg-background/80 border-2 transition-all duration-300
            hover:scale-105 active:scale-95 group
            ${active ? `${colorClass} opacity-100` : 'border-white/10 opacity-60 hover:opacity-90 hover:border-white/30'}
            clip-path-cyber
          `}
          style={{
            clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0% 30%)'
          }}
        >
            <div className={`transition-transform duration-300 group-hover:scale-110 mb-2`}>
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">
                {label}
            </span>
            
            {/* Corner decorator */}
            <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${active ? 'border-inherit' : 'border-transparent'}`} />
            <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${active ? 'border-inherit' : 'border-transparent'}`} />
        </button>
    )
}
