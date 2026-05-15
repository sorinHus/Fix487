export default function Logo({ size = 36, className }) {
  // Badge shape extracted from CorelDRAW brand mark
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 115"
      width={size}
      height={Math.round(size * 1.15)}
      className={className}
      aria-label="Fix487 logo"
      fill="none"
    >
      {/* Outer badge (hexagonal shape from brand) */}
      <polygon
        points="50,2 99,26 99,74 57,98 50,104 43,98 1,74 1,26"
        fill="#6D39F3"
      />
      {/* Inner network lines */}
      <line x1="50" y1="28" x2="75" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.45"/>
      <line x1="75" y1="50" x2="50" y2="72" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.45"/>
      <line x1="50" y1="72" x2="25" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.45"/>
      <line x1="25" y1="50" x2="50" y2="28" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.45"/>
      {/* Center circle */}
      <circle cx="50" cy="50" r="12" fill="white"/>
      {/* Node dots */}
      <circle cx="50" cy="28" r="5" fill="white" opacity="0.8"/>
      <circle cx="75" cy="50" r="5" fill="white" opacity="0.8"/>
      <circle cx="50" cy="72" r="5" fill="white" opacity="0.8"/>
      <circle cx="25" cy="50" r="5" fill="white" opacity="0.8"/>
    </svg>
  );
}
