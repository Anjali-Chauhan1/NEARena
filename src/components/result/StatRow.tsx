"use client";

export function StatRow({ label, value, color }: any) {
  return (
    <div className="flex justify-between items-center mb-3">
      <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">{label}</span>
      <span className={`text-sm font-black text-${color}`}>{value}</span>
    </div>
  );
}
