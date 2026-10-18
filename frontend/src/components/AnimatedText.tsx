import { useState, useEffect, useRef, type ReactNode } from 'react'

/**
 * HeroHeadingReveal:
 * Reveals headings word-by-word with smooth upward translation and opacity.
 * Accessible to screen readers via aria-label.
 */
interface HeroHeadingRevealProps {
  lines: string[]
  className?: string
  startDelay?: number
  staggerDelay?: number
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'div'
  highlightIndex?: { lineIndex: number; wordIndex: number }
  renderWord?: (word: string, lineIdx: number, wordIdx: number) => ReactNode
}

export function HeroHeadingReveal({
  lines,
  className = '',
  startDelay = 100,
  staggerDelay = 55,
  as: Component = 'h1',
  renderWord,
}: HeroHeadingRevealProps) {
  const fullText = lines.join(' ')
  let globalWordCount = 0

  return (
    <Component className={className} aria-label={fullText}>
      <span aria-hidden="true">
        {lines.map((line, lineIdx) => {
          const words = line.split(' ')
          return (
            <span key={lineIdx} className="block">
              {words.map((word, wordIdx) => {
                const currentGlobalIndex = globalWordCount++
                const delay = startDelay + currentGlobalIndex * staggerDelay
                const isCustomRendered = renderWord !== undefined

                return (
                  <span key={wordIdx} className="text-reveal-mask mr-[0.26em] last:mr-0">
                    <span
                      className="text-reveal-word"
                      style={{ animationDelay: `${delay}ms` }}
                    >
                      {isCustomRendered ? renderWord(word, lineIdx, wordIdx) : word}
                    </span>
                  </span>
                )
              })}
            </span>
          )
        })}
      </span>
    </Component>
  )
}

/**
 * CharacterReveal:
 * Subtle micro-staggered character animation for prominent badges or highlight phrases.
 */
interface CharacterRevealProps {
  text: string
  className?: string
  startDelay?: number
  charStagger?: number
}

export function CharacterReveal({
  text,
  className = '',
  startDelay = 150,
  charStagger = 25,
}: CharacterRevealProps) {
  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      <span aria-hidden="true">
        {text.split('').map((char, idx) => (
          <span
            key={idx}
            className="text-reveal-char"
            style={{ animationDelay: `${startDelay + idx * charStagger}ms` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    </span>
  )
}

/**
 * ScrollHeadingReveal:
 * Reveals section headings once when they first scroll into the viewport.
 */
interface ScrollHeadingRevealProps {
  children: ReactNode
  className?: string
  threshold?: number
  delay?: number
}

export function ScrollHeadingReveal({
  children,
  className = '',
  threshold = 0.15,
  delay = 50,
}: ScrollHeadingRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = elementRef.current
    if (!el) return

    // Fallback if IntersectionObserver is unavailable
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <div
      ref={elementRef}
      className={`${className} transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/**
 * ParagraphReveal:
 * Supporting text reveal with gentle fade and upward slide.
 */
interface ParagraphRevealProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function ParagraphReveal({
  children,
  className = '',
  delay = 200,
}: ParagraphRevealProps) {
  return (
    <p
      className={`text-fade-up ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </p>
  )
}

/**
 * AnimatedNumber:
 * Smooth counting animation for metrics without showing false or jarring jumps.
 */
interface AnimatedNumberProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
}

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 650,
  className = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const initialMount = useRef(true)
  const animationFrameId = useRef<number | null>(null)

  useEffect(() => {
    // Immediate render on initial mount without jarring count from 0 if already populated
    if (initialMount.current) {
      initialMount.current = false
      setDisplayValue(value)
      return
    }

    const startTime = performance.now()
    const startValue = displayValue
    const delta = value - startValue

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const rawProgress = Math.min(1, elapsed / duration)
      // Smooth cubic-out easing
      const easeProgress = 1 - Math.pow(1 - rawProgress, 3)
      const current = startValue + delta * easeProgress

      setDisplayValue(current)

      if (rawProgress < 1) {
        animationFrameId.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    animationFrameId.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [value, duration])

  return (
    <span className={className}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  )
}
