import { useState } from "react";

function StoryCover({ coverUrl, title }: { coverUrl: string; title: string }) {
  const [brokenImage, setBrokenImage] = useState(false);

  if (!coverUrl || brokenImage) {
    return (
      <div className="story-cover story-cover-fallback" aria-hidden="true">
        <span>{title.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <img
      className="story-cover"
      src={coverUrl}
      alt={`${title} cover`}
      loading="lazy"
      onError={() => setBrokenImage(true)}
    />
  );
}

export default StoryCover;