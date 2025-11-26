import { cn } from "@/lib/utils"
import Image from "next/image"

export function LogoIcon({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn("relative", className)} {...props}>
      <Image
        src="/logo/Zapmark.svg"
        alt="Zapmark Logo"
        fill
        className="object-contain"
      />
    </div>
  )
}
