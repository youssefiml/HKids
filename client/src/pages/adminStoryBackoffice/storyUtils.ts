import type { AdminStoryPage } from "../../api/backofficeApi";

import type { PageLayout } from "./types";

export const sortPages = (pages: AdminStoryPage[] | undefined): AdminStoryPage[] => {
  return [...(pages ?? [])].sort((a, b) => a.order - b.order);
};

export const inferPageLayout = (imageUrl?: string, text?: string): PageLayout => {
  const hasImage = Boolean(imageUrl?.trim());
  const hasText = Boolean(text?.trim());

  if (hasImage && hasText) {
    return "image_text";
  }
  if (hasImage) {
    return "image_only";
  }
  return "text_only";
};

export const getPageLayoutLabel = (layout: PageLayout): string => {
  if (layout === "image_only") {
    return "Image Only";
  }
  if (layout === "text_only") {
    return "Text Only";
  }
  return "Image + Text";
};

export const buildPagePayload = (layout: PageLayout, imageUrl: string, text: string) => {
  const normalizedImageUrl = imageUrl.trim();
  const normalizedText = text.trim();

  if (layout === "image_only") {
    return { imageUrl: normalizedImageUrl };
  }
  if (layout === "text_only") {
    return { text: normalizedText };
  }
  return { imageUrl: normalizedImageUrl, text: normalizedText };
};

export const validatePageByLayout = (
  layout: PageLayout,
  imageUrl: string,
  text: string,
  label: string
): string | null => {
  const normalizedImageUrl = imageUrl.trim();
  const normalizedText = text.trim();

  if (layout === "image_only" && !normalizedImageUrl) {
    return `${label}: image URL is required.`;
  }
  if (layout === "text_only" && !normalizedText) {
    return `${label}: text is required.`;
  }
  if (layout === "image_text" && (!normalizedImageUrl || !normalizedText)) {
    return `${label}: both image URL and text are required.`;
  }
  return null;
};