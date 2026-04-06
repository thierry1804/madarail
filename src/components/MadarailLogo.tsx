/** Logo officiel — https://upload.wikimedia.org/wikipedia/commons/a/a1/Madarail_logo.svg */
export function MadarailLogo({
  className = 'h-9 w-auto',
  alt = 'Madarail',
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src="/madarail-logo.svg"
      alt={alt}
      className={`object-contain object-left max-w-full ${className}`}
      decoding="async"
    />
  );
}
