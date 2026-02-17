import "../../styles/pages/adminStoryBackoffice/StoryCreatePanel.css";

import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { BookLanguage } from "../../api/publicApi";

import type { InitialPageDraft, StoryCreateForm } from "./types";
import type { PageLayout } from "./types";

interface StoryCreatePanelProps {
  createForm: StoryCreateForm;
  setCreateForm: Dispatch<SetStateAction<StoryCreateForm>>;
  createPages: InitialPageDraft[];
  setCreatePages: Dispatch<SetStateAction<InitialPageDraft[]>>;
  creatingStory: boolean;
  uploadingTarget: string | null;
  onImageUpload: (file: File, target: string, onSuccess: (url: string) => void) => Promise<void>;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}

const DEFAULT_CREATE_FORM: StoryCreateForm = {
  title: "",
  description: "",
  language: "en",
  minAge: 5,
  maxAge: 8,
  coverImageUrl: "",
};

function StoryCreatePanel({
  createForm,
  setCreateForm,
  createPages,
  setCreatePages,
  creatingStory,
  uploadingTarget,
  onImageUpload,
  onSubmit,
  onCancel,
}: StoryCreatePanelProps) {
  return (
    <section className="story-admin-create">
      <div className="story-admin-create-head">
        <h2>Add Story</h2>
        <button type="button" className="ghost-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <form className="story-create-form-grid" onSubmit={onSubmit}>
        <label>
          <span>Title</span>
          <input
            type="text"
            value={createForm.title}
            onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
        </label>
        <label>
          <span>Description</span>
          <input
            type="text"
            value={createForm.description}
            onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
          />
        </label>
        <label>
          <span>Language</span>
          <select
            value={createForm.language}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, language: event.target.value as BookLanguage }))
            }
          >
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="ar">Arabic</option>
          </select>
        </label>
        <label>
          <span>Min Age</span>
          <input
            type="number"
            min={0}
            max={18}
            value={createForm.minAge}
            onChange={(event) => setCreateForm((current) => ({ ...current, minAge: Number(event.target.value) }))}
            required
          />
        </label>
        <label>
          <span>Max Age</span>
          <input
            type="number"
            min={0}
            max={18}
            value={createForm.maxAge}
            onChange={(event) => setCreateForm((current) => ({ ...current, maxAge: Number(event.target.value) }))}
            required
          />
        </label>
        <label>
          <span>Cover Image URL</span>
          <input
            type="url"
            value={createForm.coverImageUrl}
            onChange={(event) => setCreateForm((current) => ({ ...current, coverImageUrl: event.target.value }))}
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
              void onImageUpload(file, "create-cover", (url) =>
                setCreateForm((current) => ({ ...current, coverImageUrl: url }))
              );
              event.currentTarget.value = "";
            }}
          />
          {uploadingTarget === "create-cover" && (
            <small className="story-create-uploading-note">Uploading cover...</small>
          )}
        </label>

        <div className="story-initial-pages">
          <div className="story-initial-pages-head">
            <h3>Initial Pages</h3>
            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                setCreatePages((current) => [...current, { layout: "image_only", imageUrl: "", text: "" }])
              }
            >
              Add Page Row
            </button>
          </div>
          <p className="story-meta">
            Here you decide how many pages this story starts with and the style of each page.
          </p>
          {createPages.length === 0 && (
            <div className="state-card">No initial pages yet. You can add them now or later.</div>
          )}
          {createPages.length > 0 && (
            <ul className="initial-page-list">
              {createPages.map((page, index) => (
                <li key={`initial-page-${index}`} className="initial-page-card">
                  <div className="initial-page-head">
                    <strong>Page {index + 1}</strong>
                    <button
                      type="button"
                      className="ghost-button danger"
                      onClick={() =>
                        setCreatePages((current) => current.filter((_, currentIndex) => currentIndex !== index))
                      }
                    >
                      Remove
                    </button>
                  </div>
                  <label>
                    <span>Style</span>
                    <select
                      value={page.layout}
                      onChange={(event) =>
                        setCreatePages((current) =>
                          current.map((item, currentIndex) =>
                            currentIndex === index
                              ? {
                                  ...item,
                                  layout: event.target.value as PageLayout,
                                }
                              : item
                          )
                        )
                      }
                    >
                      <option value="image_only">Image Only</option>
                      <option value="text_only">Text Only</option>
                      <option value="image_text">Image + Text</option>
                    </select>
                  </label>
                  {page.layout !== "text_only" && (
                    <label>
                      <span>Image URL</span>
                      <input
                        type="url"
                        value={page.imageUrl}
                        placeholder="https://..."
                        onChange={(event) =>
                          setCreatePages((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === index ? { ...item, imageUrl: event.target.value } : item
                            )
                          )
                        }
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }
                          const target = `create-initial-${index}`;
                          void onImageUpload(file, target, (url) =>
                            setCreatePages((current) =>
                              current.map((item, currentIndex) =>
                                currentIndex === index ? { ...item, imageUrl: url } : item
                              )
                            )
                          );
                          event.currentTarget.value = "";
                        }}
                      />
                      {uploadingTarget === `create-initial-${index}` && (
                        <small className="story-create-uploading-note">Uploading page image...</small>
                      )}
                    </label>
                  )}
                  {page.layout !== "image_only" && (
                    <label>
                      <span>Text</span>
                      <textarea
                        rows={3}
                        value={page.text}
                        placeholder="Page text..."
                        onChange={(event) =>
                          setCreatePages((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === index ? { ...item, text: event.target.value } : item
                            )
                          )
                        }
                      />
                    </label>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="story-create-inline-actions">
          <button type="submit" className="read-button" disabled={creatingStory}>
            {creatingStory ? "Creating..." : "Save Story"}
          </button>
          <button
            type="button"
            className="ghost-button"
            disabled={creatingStory}
            onClick={() => {
              setCreateForm(DEFAULT_CREATE_FORM);
              setCreatePages([]);
            }}
          >
            Clear
          </button>
        </div>
      </form>
    </section>
  );
}

export default StoryCreatePanel;
