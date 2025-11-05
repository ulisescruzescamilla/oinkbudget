import { LinearGradient } from "@/components/ui/linear-gradient"

interface GradientViewProps {
  children: React.ReactNode,
  className?: string,
}

export const GradientView = ({ children, className }: GradientViewProps) => {
  return (
    <LinearGradient
      className={`flex flex-row items-center w-full p-2 ${className}`}
      colors={['#8637CF', '#0F55A1']}
      start={[0, 1]}
      end={[1, 0]}
    >
      {children}
    </LinearGradient>
  )
}