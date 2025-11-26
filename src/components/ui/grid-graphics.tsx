import { cn } from '@/lib/utils'

export const Grid2x2Graphic = () => (
    <div className="grid grid-cols-2 gap-2 w-full h-full">
        <div className="bg-primary/10 rounded-md" />
        <div className="bg-primary/30 rounded-md" />
        <div className="bg-primary/20 rounded-md" />
        <div className="bg-primary/10 rounded-md" />
    </div>
)

export const Grid3x3Graphic = () => (
    <div className="grid grid-cols-3 gap-1.5 w-full h-full">
        <div className="bg-primary/10 rounded-[4px]" />
        <div className="bg-primary/20 rounded-[4px]" />
        <div className="bg-primary/10 rounded-[4px]" />
        <div className="bg-primary/30 rounded-[4px]" />
        <div className="bg-primary/50 rounded-[4px]" />
        <div className="bg-primary/20 rounded-[4px]" />
        <div className="bg-primary/10 rounded-[4px]" />
        <div className="bg-primary/20 rounded-[4px]" />
        <div className="bg-primary/10 rounded-[4px]" />
    </div>
)

export const Grid4x4Graphic = () => (
    <div className="grid grid-cols-4 gap-1 w-full h-full">
        {Array.from({ length: 16 }).map((_, i) => (
            <div
                key={i}
                className={cn(
                    "rounded-[2px]",
                    i % 2 === 0 ? "bg-primary/10" : "bg-primary/20",
                    i === 5 || i === 10 ? "bg-primary/40" : ""
                )}
            />
        ))}
    </div>
)
