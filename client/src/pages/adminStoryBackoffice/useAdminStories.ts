import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import type { AdminStory, AdminStoryPage } from "../../api/backofficeApi";
import {
  addAdminStoryPage,
  createAdminStory,
  deleteAdminStory,
  deleteAdminStoryPage,
  getAdminStories,
  getAdminStoryById,
  reorderAdminStoryPages,
  setAdminStoryPublished,
  updateAdminStory,
  updateAdminStoryPage,
  uploadAdminStoryImage,
} from "../../api/backofficeApi";
import type { BookLanguage } from "../../api/publicApi";

import {
  buildPagePayload,
  inferPageLayout,
  sortPages,
  validatePageByLayout,
} from "./storyUtils";
import { extractPdfPagesAsImages } from "../../utils/pdfImport";
import type {
  BackofficeView,
  InitialPageDraft,
  LanguageFilter,
  StoryMetadataForm,
  StoryPageCreateForm,
  StoryPageEditForm,
  StoryStatusFilter,
} from "./types";

const DEFAULT_CREATE_FORM = {
  title: "",
  description: "",
  language: "en" as BookLanguage,
  minAge: 5,
  maxAge: 8,
  coverImageUrl: "",
};

const DEFAULT_PAGE_CREATE_FORM: StoryPageCreateForm = {
  layout: "image_only",
  imageUrl: "",
  text: "",
  order: "",
};

const DEFAULT_METADATA_FORM: StoryMetadataForm = {
  title: "",
  description: "",
  language: "en",
  minAge: 5,
  maxAge: 8,
  coverImageUrl: "",
};

const PDF_IMPORT_TARGET = "import-pdf";
const PDF_CREATE_IMPORT_TARGET = "import-pdf-create";

export function useAdminStories(token: string) {
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storiesError, setStoriesError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StoryStatusFilter>("all");
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("all");
  const [activeView, setActiveView] = useState<BackofficeView>("manage");

  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<AdminStory | null>(null);
  const [selectedStoryLoading, setSelectedStoryLoading] = useState(false);
  const [selectedStoryError, setSelectedStoryError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [busyStoryId, setBusyStoryId] = useState<string | null>(null);
  const [busyPageId, setBusyPageId] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [createPages, setCreatePages] = useState<InitialPageDraft[]>([]);
  const [creatingStory, setCreatingStory] = useState(false);

  const [metadataForm, setMetadataForm] = useState(DEFAULT_METADATA_FORM);
  const [savingMetadata, setSavingMetadata] = useState(false);

  const [pageCreateForm, setPageCreateForm] = useState(DEFAULT_PAGE_CREATE_FORM);
  const [addingPage, setAddingPage] = useState(false);

  const [pageEditForm, setPageEditForm] = useState<StoryPageEditForm | null>(null);
  const [savingPage, setSavingPage] = useState(false);
  const [reorderingPages, setReorderingPages] = useState(false);

  const loadStories = useCallback(async () => {
    setStoriesLoading(true);
    setStoriesError(null);

    try {
      const data = await getAdminStories(token, {
        status: statusFilter === "all" ? undefined : statusFilter,
        language: languageFilter === "all" ? undefined : languageFilter,
        search: search.trim() || undefined,
      });
      setStories(data);

      if (selectedStoryId && !data.some((story) => story._id === selectedStoryId)) {
        setSelectedStoryId(null);
        setSelectedStory(null);
        setPageEditForm(null);
      }
    } catch (error) {
      setStories([]);
      setStoriesError(error instanceof Error ? error.message : "Failed to load stories.");
    } finally {
      setStoriesLoading(false);
    }
  }, [token, statusFilter, languageFilter, search, selectedStoryId]);

  const loadSelectedStory = useCallback(async () => {
    if (!selectedStoryId) {
      setSelectedStory(null);
      setSelectedStoryError(null);
      return;
    }

    setSelectedStoryLoading(true);
    setSelectedStoryError(null);

    try {
      const story = await getAdminStoryById(selectedStoryId, token);
      setSelectedStory(story);
      setMetadataForm({
        title: story.title,
        description: story.description ?? "",
        language: story.language,
        minAge: story.minAge,
        maxAge: story.maxAge,
        coverImageUrl: story.coverImageUrl ?? "",
      });
    } catch (error) {
      setSelectedStory(null);
      setSelectedStoryError(error instanceof Error ? error.message : "Failed to load story.");
    } finally {
      setSelectedStoryLoading(false);
    }
  }, [token, selectedStoryId]);

  useEffect(() => {
    void loadStories();
  }, [loadStories]);

  useEffect(() => {
    void loadSelectedStory();
  }, [loadSelectedStory]);

  const pages = useMemo(() => sortPages(selectedStory?.pages), [selectedStory?.pages]);

  const handleImageUpload = useCallback(
    async (file: File, target: string, onSuccess: (url: string) => void) => {
      setActionError(null);
      setUploadingTarget(target);
      try {
        const result = await uploadAdminStoryImage(file, token);
        onSuccess(result.url);
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Failed to upload image.");
      } finally {
        setUploadingTarget((current) => (current === target ? null : current));
      }
    },
    [token]
  );

  const handleImportPdfPages = useCallback(
    async (file: File) => {
      if (!selectedStoryId) {
        setActionError("Select a story before importing a PDF.");
        return;
      }

      setActionError(null);
      setBusyStoryId(selectedStoryId);
      setUploadingTarget(PDF_IMPORT_TARGET);

      let importedCount = 0;

      try {
        const renderedPages = await extractPdfPagesAsImages(file);

        for (let index = 0; index < renderedPages.length; index += 1) {
          const renderedPage = renderedPages[index];
          setUploadingTarget(`${PDF_IMPORT_TARGET}-${index + 1}-${renderedPages.length}`);

          const uploaded = await uploadAdminStoryImage(renderedPage.file, token);
          await addAdminStoryPage(
            selectedStoryId,
            {
              imageUrl: uploaded.url,
            },
            token
          );
          importedCount += 1;
        }

        await loadStories();
        await loadSelectedStory();
      } catch (error) {
        const baseMessage = error instanceof Error ? error.message : "Failed to import PDF pages.";
        const message =
          importedCount > 0 ? `${baseMessage} Imported ${importedCount} pages before stopping.` : baseMessage;
        setActionError(message);
      } finally {
        setBusyStoryId(null);
        setUploadingTarget((current) => (current?.startsWith(PDF_IMPORT_TARGET) ? null : current));
      }
    },
    [selectedStoryId, token, loadStories, loadSelectedStory]
  );

  const handleImportCreatePdfPages = useCallback(
    async (file: File) => {
      setActionError(null);
      setUploadingTarget(PDF_CREATE_IMPORT_TARGET);

      let importedCount = 0;

      try {
        const renderedPages = await extractPdfPagesAsImages(file);

        for (let index = 0; index < renderedPages.length; index += 1) {
          const renderedPage = renderedPages[index];
          setUploadingTarget(`${PDF_CREATE_IMPORT_TARGET}-${index + 1}-${renderedPages.length}`);

          const uploaded = await uploadAdminStoryImage(renderedPage.file, token);
          setCreatePages((current) => [
            ...current,
            {
              layout: "image_only",
              imageUrl: uploaded.url,
              text: "",
            },
          ]);
          importedCount += 1;
        }
      } catch (error) {
        const baseMessage = error instanceof Error ? error.message : "Failed to import PDF pages.";
        const message =
          importedCount > 0 ? `${baseMessage} Imported ${importedCount} pages before stopping.` : baseMessage;
        setActionError(message);
      } finally {
        setUploadingTarget((current) => (current?.startsWith(PDF_CREATE_IMPORT_TARGET) ? null : current));
      }
    },
    [token]
  );

  const handleCreateStory = async (event: FormEvent) => {
    event.preventDefault();
    setActionError(null);

    if (createForm.minAge > createForm.maxAge) {
      setActionError("Min age cannot be greater than max age.");
      return;
    }

    for (let index = 0; index < createPages.length; index += 1) {
      const page = createPages[index];
      const pageError = validatePageByLayout(page.layout, page.imageUrl, page.text, `Initial page ${index + 1}`);
      if (pageError) {
        setActionError(pageError);
        return;
      }
    }

    setCreatingStory(true);
    try {
      const created = await createAdminStory(
        {
          title: createForm.title.trim(),
          description: createForm.description.trim(),
          language: createForm.language,
          minAge: createForm.minAge,
          maxAge: createForm.maxAge,
          coverImageUrl: createForm.coverImageUrl.trim(),
        },
        token
      );

      for (let index = 0; index < createPages.length; index += 1) {
        const page = createPages[index];
        const payload = buildPagePayload(page.layout, page.imageUrl, page.text);
        await addAdminStoryPage(
          created._id,
          {
            ...payload,
            order: index + 1,
          },
          token
        );
      }

      setCreateForm((current) => ({
        ...current,
        title: "",
        description: "",
        coverImageUrl: "",
      }));
      setCreatePages([]);

      await loadStories();
      setActiveView("manage");
      setSelectedStoryId(created._id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to create story.");
    } finally {
      setCreatingStory(false);
    }
  };

  const handleSaveMetadata = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedStoryId) {
      return;
    }

    setActionError(null);

    if (metadataForm.minAge > metadataForm.maxAge) {
      setActionError("Min age cannot be greater than max age.");
      return;
    }

    setSavingMetadata(true);
    setBusyStoryId(selectedStoryId);
    try {
      const updated = await updateAdminStory(
        selectedStoryId,
        {
          title: metadataForm.title.trim(),
          description: metadataForm.description.trim(),
          language: metadataForm.language,
          minAge: metadataForm.minAge,
          maxAge: metadataForm.maxAge,
          coverImageUrl: metadataForm.coverImageUrl.trim(),
        },
        token
      );

      setSelectedStory(updated);
      await loadStories();
      await loadSelectedStory();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to update story metadata.");
    } finally {
      setSavingMetadata(false);
      setBusyStoryId(null);
    }
  };

  const handleAddPage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedStoryId) {
      return;
    }

    setActionError(null);
    const pageError = validatePageByLayout(pageCreateForm.layout, pageCreateForm.imageUrl, pageCreateForm.text, "New page");
    if (pageError) {
      setActionError(pageError);
      return;
    }

    const payload = buildPagePayload(pageCreateForm.layout, pageCreateForm.imageUrl, pageCreateForm.text);
    const parsedOrder = pageCreateForm.order.trim() ? Number(pageCreateForm.order) : undefined;
    if (parsedOrder !== undefined && (!Number.isInteger(parsedOrder) || parsedOrder < 1)) {
      setActionError("Page order must be a positive integer.");
      return;
    }

    setAddingPage(true);
    setBusyStoryId(selectedStoryId);
    try {
      await addAdminStoryPage(
        selectedStoryId,
        {
          ...payload,
          order: parsedOrder,
        },
        token
      );
      setPageCreateForm(DEFAULT_PAGE_CREATE_FORM);
      await loadStories();
      await loadSelectedStory();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to add story page.");
    } finally {
      setAddingPage(false);
      setBusyStoryId(null);
    }
  };

  const handleStartPageEdit = (page: AdminStoryPage) => {
    setPageEditForm({
      pageId: page._id,
      layout: inferPageLayout(page.imageUrl, page.text),
      imageUrl: page.imageUrl,
      text: page.text ?? "",
    });
  };

  const handleSavePageEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedStoryId || !pageEditForm) {
      return;
    }

    setActionError(null);
    const pageError = validatePageByLayout(pageEditForm.layout, pageEditForm.imageUrl, pageEditForm.text, "Edit page");
    if (pageError) {
      setActionError(pageError);
      return;
    }

    const payload = buildPagePayload(pageEditForm.layout, pageEditForm.imageUrl, pageEditForm.text);
    setSavingPage(true);
    setBusyPageId(pageEditForm.pageId);
    try {
      await updateAdminStoryPage(selectedStoryId, pageEditForm.pageId, payload, token);
      await loadStories();
      await loadSelectedStory();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to update story page.");
    } finally {
      setSavingPage(false);
      setBusyPageId(null);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!selectedStoryId) {
      return;
    }

    const confirmed = window.confirm("Delete this page?");
    if (!confirmed) {
      return;
    }

    setActionError(null);
    setBusyPageId(pageId);
    try {
      await deleteAdminStoryPage(selectedStoryId, pageId, token);
      if (pageEditForm?.pageId === pageId) {
        setPageEditForm(null);
      }
      await loadStories();
      await loadSelectedStory();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to delete story page.");
    } finally {
      setBusyPageId(null);
    }
  };

  const handleMovePage = async (pageId: string, direction: -1 | 1) => {
    if (!selectedStoryId || reorderingPages) {
      return;
    }

    const orderedPages = sortPages(selectedStory?.pages);
    const currentIndex = orderedPages.findIndex((page) => page._id === pageId);
    if (currentIndex < 0) {
      return;
    }

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= orderedPages.length) {
      return;
    }

    const nextOrder = [...orderedPages];
    const [movingPage] = nextOrder.splice(currentIndex, 1);
    nextOrder.splice(targetIndex, 0, movingPage);
    const nextPageIds = nextOrder.map((page) => page._id);

    setActionError(null);
    setReorderingPages(true);
    setBusyPageId(pageId);
    try {
      await reorderAdminStoryPages(selectedStoryId, nextPageIds, token);
      await loadStories();
      await loadSelectedStory();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to reorder story pages.");
    } finally {
      setReorderingPages(false);
      setBusyPageId(null);
    }
  };

  const handleTogglePublish = async (story: AdminStory) => {
    const nextPublished = story.status !== "published";
    setActionError(null);
    setBusyStoryId(story._id);
    try {
      await setAdminStoryPublished(story._id, nextPublished, token);
      await loadStories();
      if (selectedStoryId === story._id) {
        await loadSelectedStory();
      }
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : nextPublished
            ? "Failed to publish story."
            : "Failed to unpublish story."
      );
    } finally {
      setBusyStoryId(null);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    const confirmed = window.confirm("Delete this story and all its pages?");
    if (!confirmed) {
      return;
    }

    setActionError(null);
    setBusyStoryId(storyId);
    try {
      await deleteAdminStory(storyId, token);
      if (selectedStoryId === storyId) {
        setSelectedStoryId(null);
        setSelectedStory(null);
        setPageEditForm(null);
      }
      await loadStories();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to delete story.");
    } finally {
      setBusyStoryId(null);
    }
  };

  return {
    stories,
    storiesLoading,
    storiesError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    languageFilter,
    setLanguageFilter,
    activeView,
    setActiveView,
    selectedStoryId,
    setSelectedStoryId,
    selectedStory,
    selectedStoryLoading,
    selectedStoryError,
    actionError,
    setActionError,
    busyStoryId,
    busyPageId,
    uploadingTarget,
    createForm,
    setCreateForm,
    createPages,
    setCreatePages,
    creatingStory,
    metadataForm,
    setMetadataForm,
    savingMetadata,
    pageCreateForm,
    setPageCreateForm,
    addingPage,
    pageEditForm,
    setPageEditForm,
    savingPage,
    reorderingPages,
    pages,
    refreshStories: loadStories,
    handleImageUpload,
    handleImportPdfPages,
    handleImportCreatePdfPages,
    handleCreateStory,
    handleSaveMetadata,
    handleAddPage,
    handleStartPageEdit,
    handleSavePageEdit,
    handleDeletePage,
    handleMovePage,
    handleTogglePublish,
    handleDeleteStory,
  };
}
