'use client'

interface WindowControlsProps {
  className?: string
}

export function WindowControls({ className = '' }: WindowControlsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-[0_0_0_1px_rgba(0,0,0,0.12)]" />
      <div className="w-3 h-3 rounded-full bg-[#FEBC2E] shadow-[0_0_0_1px_rgba(0,0,0,0.12)]" />
      <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-[0_0_0_1px_rgba(0,0,0,0.12)]" />
    </div>
  )
}
