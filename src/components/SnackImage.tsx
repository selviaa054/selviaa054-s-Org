import { Cookie } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SnackImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SnackImage({ src, alt, className = '' }: SnackImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#FDF2F7] via-[#FBF7FA] to-[#F1ECFA] text-[#8A6D7E] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Cookie className="w-8 h-8 mb-2 text-[#BE3E6E]/60" strokeWidth={1.5} />
        <span className="text-xs font-medium leading-snug max-w-[16ch]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
