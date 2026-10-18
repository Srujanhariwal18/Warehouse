import { useRef, useState, type ReactNode } from 'react'

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  onClick?: () => void
}

export function TiltCard({
  children,
  className = '',
  maxTilt = 6,
  onClick,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<{
    transform: string
    transition: string
  }>({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    transition: 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1)',
  })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Respect reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Only on fine-pointer devices
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const card = cardRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Normalize between -1 and 1
    const rotateX = ((y - centerY) / centerY) * -maxTilt
    const rotateY = ((x - centerX) / centerX) * maxTilt

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`,
      transition: 'transform 80ms ease-out',
    })
  }

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
    })
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: style.transform,
        transition: style.transition,
        transformStyle: 'preserve-3d',
      }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </div>
  )
}
