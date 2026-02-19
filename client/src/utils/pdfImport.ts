const MAX_PDF_PAGES = 80;
const MAX_RENDER_SIDE = 1600;

type RenderedPdfPage = {
  pageNumber: number;
  file: File;
};

type PdfLoader = Awaited<typeof import("pdfjs-dist")>["getDocument"];

let cachedPdfLoader: Promise<PdfLoader> | null = null;

const getPdfLoader = async (): Promise<PdfLoader> => {
  if (!cachedPdfLoader) {
    cachedPdfLoader = (async () => {
      const [{ GlobalWorkerOptions, getDocument }, workerModule] = await Promise.all([
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
      ]);

      if (GlobalWorkerOptions.workerSrc !== workerModule.default) {
        GlobalWorkerOptions.workerSrc = workerModule.default;
      }

      return getDocument;
    })();
  }

  return cachedPdfLoader;
};

const toSafeBaseName = (filename: string): string => {
  const withoutExtension = filename.replace(/\.[^.]+$/, "");
  const sanitized = withoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return sanitized || "story";
};

const canvasToJpegBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to convert PDF page to image."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.84
    );
  });
};

const pickRenderScale = (width: number, height: number): number => {
  const longestSide = Math.max(width, height, 1);
  const scaled = MAX_RENDER_SIDE / longestSide;
  return Math.min(2, Math.max(0.8, scaled));
};

export const extractPdfPagesAsImages = async (pdfFile: File): Promise<RenderedPdfPage[]> => {
  const lowerName = pdfFile.name.toLowerCase();
  const isPdf = pdfFile.type === "application/pdf" || lowerName.endsWith(".pdf");
  if (!isPdf) {
    throw new Error("Please select a PDF file.");
  }

  const bytes = new Uint8Array(await pdfFile.arrayBuffer());
  const getDocument = await getPdfLoader();
  const loadingTask = getDocument({ data: bytes });
  const pdf = await loadingTask.promise;

  if (pdf.numPages < 1) {
    throw new Error("The PDF has no pages.");
  }
  if (pdf.numPages > MAX_PDF_PAGES) {
    throw new Error(`This PDF has ${pdf.numPages} pages. Maximum allowed is ${MAX_PDF_PAGES}.`);
  }

  const baseName = toSafeBaseName(pdfFile.name);
  const renderedPages: RenderedPdfPage[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const initialViewport = page.getViewport({ scale: 1 });
      const scale = pickRenderScale(initialViewport.width, initialViewport.height);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) {
        throw new Error("Could not prepare canvas for PDF rendering.");
      }

      await page.render({ canvasContext: context, viewport, canvas }).promise;
      const blob = await canvasToJpegBlob(canvas);
      const file = new File([blob], `${baseName}-page-${String(pageNumber).padStart(2, "0")}.jpg`, {
        type: "image/jpeg",
      });

      renderedPages.push({ pageNumber, file });

      canvas.width = 0;
      canvas.height = 0;
    }
  } finally {
    await pdf.destroy();
    await loadingTask.destroy();
  }

  return renderedPages;
};
