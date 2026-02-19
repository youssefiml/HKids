type OptimizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  preferredType?: "image/webp" | "image/jpeg";
  keepOriginalIfSmaller?: boolean;
};

const DEFAULT_MAX_SIDE = 1800;
const DEFAULT_QUALITY = 0.82;

const clampQuality = (value?: number): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_QUALITY;
  }
  return Math.min(Math.max(value, 0.4), 0.95);
};

const replaceExtension = (filename: string, nextExtension: string): string => {
  const baseName = filename.replace(/\.[^.]+$/, "");
  return `${baseName || "upload"}${nextExtension}`;
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
};

const isSupportedInputType = (file: File): boolean => {
  if (!file.type.startsWith("image/")) {
    return false;
  }
  // Keep animated GIFs untouched to avoid dropping animation frames.
  if (file.type === "image/gif") {
    return false;
  }
  return true;
};

export const optimizeImageForUpload = async (
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> => {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof createImageBitmap !== "function" ||
    !isSupportedInputType(file)
  ) {
    return file;
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const maxWidth = Math.max(1, options.maxWidth ?? DEFAULT_MAX_SIDE);
    const maxHeight = Math.max(1, options.maxHeight ?? DEFAULT_MAX_SIDE);
    const preferredType = options.preferredType ?? "image/webp";
    const quality = clampQuality(options.quality);
    const keepOriginalIfSmaller = options.keepOriginalIfSmaller ?? true;

    const widthRatio = maxWidth / Math.max(bitmap.width, 1);
    const heightRatio = maxHeight / Math.max(bitmap.height, 1);
    const ratio = Math.min(1, widthRatio, heightRatio);

    const targetWidth = Math.max(1, Math.round(bitmap.width * ratio));
    const targetHeight = Math.max(1, Math.round(bitmap.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      return file;
    }

    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    let optimizedBlob = await canvasToBlob(canvas, preferredType, quality);
    if ((!optimizedBlob || !optimizedBlob.type) && preferredType !== "image/jpeg") {
      optimizedBlob = await canvasToBlob(canvas, "image/jpeg", quality);
    }
    if (!optimizedBlob) {
      return file;
    }

    if (keepOriginalIfSmaller && optimizedBlob.size >= file.size) {
      return file;
    }

    const outputType = optimizedBlob.type || preferredType;
    const nextExtension = outputType === "image/webp" ? ".webp" : ".jpg";
    const outputName = replaceExtension(file.name, nextExtension);

    return new File([optimizedBlob], outputName, {
      type: outputType,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
};
