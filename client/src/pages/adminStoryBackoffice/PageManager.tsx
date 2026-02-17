import "../../styles/pages/adminStoryBackoffice/PageManager.css";

import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { AdminStoryPage } from "../../api/backofficeApi";

import { getPageLayoutLabel, inferPageLayout } from "./storyUtils";
import type { StoryPageCreateForm, StoryPageEditForm } from "./types";
import type { PageLayout } from "./types";

export interface PageManagerProps {
  pages: AdminStoryPage[];
  pageCreateForm: StoryPageCreateForm;
  setPageCreateForm: Dispatch<SetStateAction<StoryPageCreateForm>>;
  addingPage: boolean;
  uploadingTarget: string | null;
  pageEditForm: StoryPageEditForm | null;
  setPageEditForm: Dispatch<SetStateAction<StoryPageEditForm | null>>;
  savingPage: boolean;
  reorderingPages: boolean;
  busyPageId: string | null;
  onImageUpload: (file: File, target: string, onSuccess: (url: string) => void) => Promise<void>;
  onAddPage: (event: FormEvent) => void;
  onStartPageEdit: (page: AdminStoryPage) => void;
  onSavePageEdit: (event: FormEvent) => void;
  onMovePage: (pageId: string, direction: -1 | 1) => void;
  onDeletePage: (pageId: string) => void;
}

function PageManager({
  pages,
  pageCreateForm,
  setPageCreateForm,
  addingPage,
  uploadingTarget,
  pageEditForm,
  setPageEditForm,
  savingPage,
  reorderingPages,
  busyPageId,
  onImageUpload,
  onAddPage,
  onStartPageEdit,
  onSavePageEdit,
  onMovePage,
  onDeletePage,
}: PageManagerProps) {
  return (
    <section className="story-pages-panel">
      <h2>Pages Management</h2>
      <form className="story-page-form-grid" onSubmit={onAddPage}>
        <label>
          <span>Page Style</span>
          <select
            value={pageCreateForm.layout}
            onChange={(event) =>
              setPageCreateForm((current) => ({
                ...current,
                layout: event.target.value as PageLayout,
              }))
            }
          >
            <option value="image_only">Image Only</option>
            <option value="text_only">Text Only</option>
            <option value="image_text">Image + Text</option>
          </select>
        </label>
        {pageCreateForm.layout !== "text_only" && (
          <label>
            <span>Page Image URL</span>
            <input
              type="url"
              value={pageCreateForm.imageUrl}
              onChange={(event) =>
                setPageCreateForm((current) => ({ ...current, imageUrl: event.target.value }))
              }
              placeholder="https://..."
            />
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                void onImageUpload(file, "create-page", (url) =>
                  setPageCreateForm((current) => ({ ...current, imageUrl: url }))
                );
                event.currentTarget.value = "";
              }}
            />
            {uploadingTarget === "create-page" && <small className="story-page-uploading-note">Uploading page image...</small>}
          </label>
        )}
        {pageCreateForm.layout !== "image_only" && (
          <label>
            <span>Page Text</span>
            <textarea
              rows={3}
              value={pageCreateForm.text}
              onChange={(event) =>
                setPageCreateForm((current) => ({ ...current, text: event.target.value }))
              }
              placeholder="Page text..."
            />
          </label>
        )}
        <label>
          <span>Insert At Order (optional)</span>
          <input
            type="number"
            min={1}
            value={pageCreateForm.order}
            onChange={(event) => setPageCreateForm((current) => ({ ...current, order: event.target.value }))}
            placeholder={`${pages.length + 1}`}
          />
        </label>
        <div className="story-page-inline-actions">
          <button type="submit" className="read-button" disabled={addingPage}>
            {addingPage ? "Adding..." : "Add Page"}
          </button>
        </div>
      </form>

      <ul className="story-page-list">
        {pages.map((page, index) => (
          <li key={page._id} className="story-page-card">
            <div className="story-page-preview">
              {page.imageUrl ? <img src={page.imageUrl} alt={`Story page ${page.order}`} /> : <span>No image</span>}
            </div>
            <div className="story-page-main">
              <p className="story-meta">Order: {page.order}</p>
              <p className="story-meta">Style: {getPageLayoutLabel(inferPageLayout(page.imageUrl, page.text))}</p>
              <p className="story-description">{page.text?.trim() || "Image only page"}</p>
              <div className="story-page-actions">
                <button type="button" className="ghost-button" onClick={() => onStartPageEdit(page)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onMovePage(page._id, -1)}
                  disabled={index === 0 || reorderingPages}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onMovePage(page._id, 1)}
                  disabled={index === pages.length - 1 || reorderingPages}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="ghost-button danger"
                  onClick={() => onDeletePage(page._id)}
                  disabled={busyPageId === page._id}
                >
                  {busyPageId === page._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </li>
        ))}
        {pages.length === 0 && <li className="state-card">No pages added yet.</li>}
      </ul>

      {pageEditForm && (
        <form className="story-page-form-grid story-page-edit-form" onSubmit={onSavePageEdit}>
          <h3>Edit Page</h3>
          <label>
            <span>Page Style</span>
            <select
              value={pageEditForm.layout}
              onChange={(event) =>
                setPageEditForm((current) =>
                  current ? { ...current, layout: event.target.value as PageLayout } : current
                )
              }
            >
              <option value="image_only">Image Only</option>
              <option value="text_only">Text Only</option>
              <option value="image_text">Image + Text</option>
            </select>
          </label>
          {pageEditForm.layout !== "text_only" && (
            <label>
              <span>Image URL</span>
              <input
                type="url"
                value={pageEditForm.imageUrl}
                onChange={(event) =>
                  setPageEditForm((current) =>
                    current ? { ...current, imageUrl: event.target.value } : current
                  )
                }
                placeholder="https://..."
              />
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  const target = `edit-page-${pageEditForm.pageId}`;
                  void onImageUpload(file, target, (url) =>
                    setPageEditForm((current) => (current ? { ...current, imageUrl: url } : current))
                  );
                  event.currentTarget.value = "";
                }}
              />
              {uploadingTarget === `edit-page-${pageEditForm.pageId}` && (
                <small className="story-page-uploading-note">Uploading page image...</small>
              )}
            </label>
          )}
          {pageEditForm.layout !== "image_only" && (
            <label>
              <span>Text</span>
              <textarea
                rows={3}
                value={pageEditForm.text}
                onChange={(event) =>
                  setPageEditForm((current) => (current ? { ...current, text: event.target.value } : current))
                }
                placeholder="Page text..."
              />
            </label>
          )}
          <div className="story-page-inline-actions">
            <button type="submit" className="read-button" disabled={savingPage}>
              {savingPage ? "Saving..." : "Save Page"}
            </button>
            <button type="button" className="ghost-button" onClick={() => setPageEditForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default PageManager;
