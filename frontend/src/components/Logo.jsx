export default function Logo({ size = 36, className }) {
  return (
    <img
      src="/logo.svg"
      width={size}
      height={size}
      className={className}
      alt="Fix487 logo"
    />
  );
}
