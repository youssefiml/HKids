import { Types } from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import { Story } from "../modules/stories/story.model";
import { StoryPage } from "../modules/stories/storyPage.model";
import { validateAgeRange, validateObjectId } from "../utils/validators.util";

type StoryFilters = {
  status?: "draft" | "published";
  language?: "ar" | "en" | "fr";
  search?: string;
};

type StoryMetadataInput = {
  title: string;
  description?: string;
  language: "ar" | "en" | "fr";
  minAge: number;
  maxAge: number;
  coverImageUrl?: string;
};

type StoryPageInput = {
  imageUrl?: string;
  text?: string;
  order?: number;
};

const ensureStoryExists = async (storyId: string) => {
  validateObjectId(storyId, "Story ID");
  const story = await Story.findById(storyId);
  if (!story) {
    throw new AppError("Story not found", 404);
  }
  return story;
};

const normalizePageText = (text?: string): string => (text ? text.trim() : "");
const normalizePageImageUrl = (imageUrl?: string): string => (imageUrl ? imageUrl.trim() : "");

const ensurePageHasContent = (imageUrl: string, text: string) => {
  if (!imageUrl.trim() && !text.trim()) {
    throw new AppError("Each page must include an image, text, or both", 400);
  }
};

const loadOrderedPages = async (storyId: string) => {
  return StoryPage.find({ story: new Types.ObjectId(storyId) }).sort({ order: 1 });
};

const serializeStory = async (story: any) => {
  const pages = await loadOrderedPages(story._id.toString());
  return {
    id: story._id.toString(),
    ...story.toObject(),
    pages: pages.map((page) => ({
      id: page._id.toString(),
      _id: page._id.toString(),
      storyId: story._id.toString(),
      order: page.order,
      imageUrl: page.imageUrl,
      text: page.text ?? "",
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    })),
    pagesCount: pages.length,
  };
};

const shiftPagesFromOrder = async (storyId: string, fromOrder: number, delta: 1 | -1) => {
  await StoryPage.updateMany(
    {
      story: new Types.ObjectId(storyId),
      order: delta > 0 ? { $gte: fromOrder } : { $gt: fromOrder },
    },
    {
      $inc: {
        order: delta,
      },
    }
  );
};

const enforcePublishability = async (storyId: string) => {
  const pages = await loadOrderedPages(storyId);

  if (!pages.length) {
    throw new AppError("Story must contain at least one page before publishing", 400);
  }

  const hasInvalidPage = pages.some((page) => {
    const imageUrl = page.imageUrl?.trim() ?? "";
    const text = page.text?.trim() ?? "";
    return !imageUrl && !text;
  });
  if (hasInvalidPage) {
    throw new AppError("All story pages must include image, text, or both before publishing", 400);
  }
};

export const listAdminStories = async (filters: StoryFilters) => {
  const query: Record<string, any> = {};

  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.language) {
    query.language = filters.language;
  }
  if (filters.search) {
    query.title = { $regex: filters.search.trim(), $options: "i" };
  }

  const stories = await Story.find(query).sort({ updatedAt: -1 });

  const pagesCountByStory = await StoryPage.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { story: { $in: stories.map((story) => story._id) } } },
    { $group: { _id: "$story", count: { $sum: 1 } } },
  ]);
  const pageCountMap = new Map(
    pagesCountByStory.map((item) => [item._id.toString(), item.count])
  );

  return stories.map((story) => ({
    id: story._id.toString(),
    ...story.toObject(),
    pagesCount: pageCountMap.get(story._id.toString()) ?? 0,
  }));
};

export const getAdminStoryById = async (storyId: string) => {
  const story = await ensureStoryExists(storyId);
  return serializeStory(story);
};

export const createAdminStory = async (payload: StoryMetadataInput, adminUserId: string) => {
  validateAgeRange(payload.minAge, payload.maxAge);

  const adminObjectId = new Types.ObjectId(adminUserId);
  const story = await Story.create({
    title: payload.title.trim(),
    description: payload.description?.trim() ?? "",
    language: payload.language,
    minAge: payload.minAge,
    maxAge: payload.maxAge,
    coverImageUrl: payload.coverImageUrl?.trim() ?? "",
    status: "draft",
    publishedAt: null,
    createdBy: adminObjectId,
    updatedBy: adminObjectId,
  });

  return serializeStory(story);
};

export const updateAdminStoryMetadata = async (
  storyId: string,
  payload: Partial<StoryMetadataInput>,
  adminUserId: string
) => {
  const story = await ensureStoryExists(storyId);
  const nextMinAge = payload.minAge ?? story.minAge;
  const nextMaxAge = payload.maxAge ?? story.maxAge;
  validateAgeRange(nextMinAge, nextMaxAge);

  if (payload.title !== undefined) {
    story.title = payload.title.trim();
  }
  if (payload.description !== undefined) {
    story.description = payload.description.trim();
  }
  if (payload.language !== undefined) {
    story.language = payload.language;
  }
  if (payload.minAge !== undefined) {
    story.minAge = payload.minAge;
  }
  if (payload.maxAge !== undefined) {
    story.maxAge = payload.maxAge;
  }
  if (payload.coverImageUrl !== undefined) {
    story.coverImageUrl = payload.coverImageUrl.trim();
  }
  story.updatedBy = new Types.ObjectId(adminUserId);
  await story.save();

  return serializeStory(story);
};

export const deleteAdminStory = async (storyId: string) => {
  const story = await ensureStoryExists(storyId);
  await StoryPage.deleteMany({ story: story._id });
  await story.deleteOne();
  return { deleted: true };
};

export const addAdminStoryPage = async (storyId: string, payload: StoryPageInput, adminUserId: string) => {
  const story = await ensureStoryExists(storyId);
  const existingPages = await loadOrderedPages(storyId);
  const normalizedImageUrl = normalizePageImageUrl(payload.imageUrl);
  const normalizedText = normalizePageText(payload.text);
  ensurePageHasContent(normalizedImageUrl, normalizedText);

  const requestedOrder = payload.order ?? existingPages.length + 1;
  if (requestedOrder < 1 || requestedOrder > existingPages.length + 1) {
    throw new AppError("Invalid page order", 400);
  }

  if (requestedOrder <= existingPages.length) {
    await shiftPagesFromOrder(storyId, requestedOrder, 1);
  }

  const page = await StoryPage.create({
    story: story._id,
    order: requestedOrder,
    imageUrl: normalizedImageUrl,
    text: normalizedText,
  });

  story.updatedBy = new Types.ObjectId(adminUserId);
  await story.save();

  return {
    id: page._id.toString(),
    _id: page._id.toString(),
    storyId: story._id.toString(),
    order: page.order,
    imageUrl: page.imageUrl,
    text: page.text ?? "",
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  };
};

export const updateAdminStoryPage = async (
  storyId: string,
  pageId: string,
  payload: { imageUrl?: string; text?: string },
  adminUserId: string
) => {
  const story = await ensureStoryExists(storyId);
  validateObjectId(pageId, "Story page ID");

  const page = await StoryPage.findOne({
    _id: new Types.ObjectId(pageId),
    story: story._id,
  });
  if (!page) {
    throw new AppError("Story page not found", 404);
  }

  if (payload.imageUrl !== undefined) {
    page.imageUrl = normalizePageImageUrl(payload.imageUrl);
  }
  if (payload.text !== undefined) {
    page.text = normalizePageText(payload.text);
  }
  ensurePageHasContent(page.imageUrl ?? "", page.text ?? "");

  await page.save();
  story.updatedBy = new Types.ObjectId(adminUserId);
  await story.save();

  return {
    id: page._id.toString(),
    _id: page._id.toString(),
    storyId: story._id.toString(),
    order: page.order,
    imageUrl: page.imageUrl,
    text: page.text ?? "",
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  };
};

export const deleteAdminStoryPage = async (storyId: string, pageId: string, adminUserId: string) => {
  const story = await ensureStoryExists(storyId);
  validateObjectId(pageId, "Story page ID");

  const page = await StoryPage.findOne({
    _id: new Types.ObjectId(pageId),
    story: story._id,
  });
  if (!page) {
    throw new AppError("Story page not found", 404);
  }

  const deletedOrder = page.order;
  await page.deleteOne();
  await shiftPagesFromOrder(storyId, deletedOrder, -1);

  story.updatedBy = new Types.ObjectId(adminUserId);
  await story.save();
  return { deleted: true };
};

export const reorderAdminStoryPages = async (
  storyId: string,
  pageIds: string[],
  adminUserId: string
) => {
  const story = await ensureStoryExists(storyId);
  const pages = await loadOrderedPages(storyId);

  if (pages.length !== pageIds.length) {
    throw new AppError("Reorder payload must include all story page IDs", 400);
  }

  const existingIds = pages.map((page) => page._id.toString()).sort();
  const incomingIds = [...pageIds].sort();
  if (existingIds.join(",") !== incomingIds.join(",")) {
    throw new AppError("Reorder payload contains invalid story page IDs", 400);
  }

  const tempOffset = pageIds.length + 1000;
  await StoryPage.bulkWrite(
    pageIds.map((pageId, index) => ({
      updateOne: {
        filter: {
          _id: new Types.ObjectId(pageId),
          story: story._id,
        },
        update: {
          $set: {
            order: tempOffset + index + 1,
          },
        },
      },
    }))
  );

  await StoryPage.bulkWrite(
    pageIds.map((pageId, index) => ({
      updateOne: {
        filter: {
          _id: new Types.ObjectId(pageId),
          story: story._id,
        },
        update: {
          $set: {
            order: index + 1,
          },
        },
      },
    }))
  );

  story.updatedBy = new Types.ObjectId(adminUserId);
  await story.save();

  return (await loadOrderedPages(storyId)).map((page) => ({
    id: page._id.toString(),
    _id: page._id.toString(),
    storyId: story._id.toString(),
    order: page.order,
    imageUrl: page.imageUrl,
    text: page.text ?? "",
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  }));
};

export const setAdminStoryPublishState = async (
  storyId: string,
  published: boolean,
  adminUserId: string
) => {
  const story = await ensureStoryExists(storyId);

  if (published) {
    if (!story.coverImageUrl || !story.coverImageUrl.trim()) {
      throw new AppError("Story cover image is required before publishing", 400);
    }
    await enforcePublishability(storyId);
    story.status = "published";
    story.publishedAt = new Date();
  } else {
    story.status = "draft";
    story.publishedAt = null;
  }

  story.updatedBy = new Types.ObjectId(adminUserId);
  await story.save();
  return serializeStory(story);
};
