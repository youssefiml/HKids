import { useState } from "react";

type Props = {
  className?: string;
  imageClassName?: string;
  label?: string;
  showLabel?: boolean;
};

function PlatformLogo({ className, imageClassName, label = "HKids", showLabel = false }: Props) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={className ? `platform-logo ${className}` : "platform-logo"}>
      {!imageError && (
        <img
          className={imageClassName ? `platform-logo-image ${imageClassName}` : "platform-logo-image"}
          src="/hkids-logo.png"
          alt="HKids logo"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      )}
      {(showLabel || imageError) && <span className="platform-logo-label">{label}</span>}
    </div>
  );
}

export default PlatformLogo;
