export function BrandMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg
      aria-label="Invora"
      className={className}
      fill="none"
      role="img"
      viewBox="0 0 36 36"
    >
      {/* Outer technical hexagon */}
      <path
        d="M18 3L32 10.5V25.5L18 33L4 25.5V10.5L18 3Z"
        stroke="#2E3D4B"
        strokeWidth="1.5"
      />
      {/* Inner faceted isometric crate structure */}
      <path
        d="M18 3V18M18 18L4 10.5M18 18L32 10.5"
        stroke="#43D9E8"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M18 18V33"
        stroke="#5AA9FF"
        strokeLinecap="round"
        strokeWidth="2"
      />
      {/* Precision telemetry vertex nodes */}
      <circle cx="18" cy="18" fill="#43D9E8" r="2.5" />
      <circle cx="18" cy="3" fill="#5AA9FF" r="1.5" />
      <circle cx="4" cy="25.5" fill="#43D9E8" r="1.5" />
      <circle cx="32" cy="25.5" fill="#43D9E8" r="1.5" />
    </svg>
  )
}
