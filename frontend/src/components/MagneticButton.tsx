import { useRef, useState, type ReactNode } from 'react'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  strength?: number // displacement limit in px
  onClick?: () => void
  href?: string
}

export function MagneticButton({
  children,
  className = '',
  strength = 10,
  onClick,
  href,
}: MagneticButtonProps) {
  const btnRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const btn = btnRef.current
    if (!btn) return

    const rect = btn.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY

    const moveX = (distanceX / (rect.width / 2)) * strength
    const moveY = (distanceY / (rect.height / 2)) * strength

    setPosition({ x: moveX, y: moveY })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  const transformStyle = {
    transform: `translate3d(${position.x.toFixed(1)}px, ${position.y.toFixed(1)}px, 0)`,
    transition: position.x === 0 && position.y === 0 ? 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)' : 'transform 80ms ease-out',
  }

  if (href) {
    return (
      <a
        ref={btnRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={transformStyle}
        className={`inline-block will-change-transform ${className}`}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      ref={btnRef as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={transformStyle}
      className={`inline-block will-change-transform ${className}`}
    >
      {children}
    </button>
  )
}
