export function RobotDuck() {
  return (
    <g transform="translate(43 120) scale(1.7)" strokeWidth=".9" strokeLinejoin="round">
      <path d="M5 39L25 28L55 43L35 55Z" fill="var(--moss-wash)" />
      <path d="M5 39L35 55V69L5 53Z" fill="var(--sunken)" />
      <path d="M35 55L55 43V57L35 69Z" fill="var(--surface)" />
      <path d="M25 10L39 2L53 10L39 18Z" fill="var(--moss-wash)" />
      <path d="M25 10L39 18V40L25 32Z" fill="var(--sunken)" />
      <path d="M39 18L53 10V32L39 40Z" fill="var(--surface)" />
      <path d="M53 22L65 27L53 32Z" fill="var(--moss-wash)" />
      <circle cx="47" cy="20" r="1.8" fill="currentColor" stroke="none" />
    </g>
  )
}
