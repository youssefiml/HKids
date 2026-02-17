import type { BookLanguage } from "../../api/publicApi";

export type StoryStatusFilter = "all" | "draft" | "published";
export type LanguageFilter = "all" | BookLanguage;
export type BackofficeView = "manage" | "add";
export type PageLayout = "image_only" | "text_only" | "image_text";

export interface StoryCreateForm {
  title: string;
  description: string;
  language: BookLanguage;
  minAge: number;
  maxAge: number;
  coverImageUrl: string;
}

export interface InitialPageDraft {
  layout: PageLayout;
  imageUrl: string;
  text: string;
}

export interface StoryMetadataForm {
  title: string;
  description: string;
  language: BookLanguage;
  minAge: number;
  maxAge: number;
  coverImageUrl: string;
}

export interface StoryPageCreateForm {
  layout: PageLayout;
  imageUrl: string;
  text: string;
  order: string;
}

export interface StoryPageEditForm {
  pageId: string;
  layout: PageLayout;
  imageUrl: string;
  text: string;
}