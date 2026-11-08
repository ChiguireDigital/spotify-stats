import { useState } from 'react';

export default function ArtworkImage({ src, alt = '', className = '', fallback = '♪', fallbackClassName = '' }) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;
  if (showImage) {
    return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
  }
  return <span className={`${className} ${fallbackClassName}`.trim()} aria-hidden="true">{fallback}</span>;
}
