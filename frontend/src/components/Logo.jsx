export default function Logo({ size = 36, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-label="Fix487 logo"
    >
      <path d="M20 2L35.5 11V29L20 38L4.5 29V11L20 2Z" fill="#4F46E5" />
      <path d="M20 10L29.5 20L20 30L10.5 20Z" fill="white" opacity="0.18" />
      <path d="M20 14L26 20L20 26L14 20Z" fill="white" opacity="0.45" />
      <circle cx="20" cy="20" r="4.5" fill="white" />
    </svg>
  );
}
