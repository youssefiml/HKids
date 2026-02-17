import "../../styles/pages/adminStoryBackoffice/StoryEditorPanel.css";

import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { AdminStory } from "../../api/backofficeApi";
import type { BookLanguage } from "../../api/publicApi";

import PageManager from "./PageManager";
import type { PageManagerProps } from "./PageManager";
import type { StoryMetadataForm } from "./types";

interface StoryEditorPanelProps {
  selectedStoryId: string | null;
  selectedStoryLoading: boolean;
  selectedStory: AdminStory | null;
  busyStoryId: string | null;
  metadataForm: StoryMetadataForm;
  setMetadataForm: Dispatch<SetStateAction<StoryMetadataForm>>;
  savingMetadata: boolean;
  uploadingTarget: string | null;
  onImageUpload: (file: File, target: string, onSuccess: (url: string) => void) => Promise<void>;
  onSaveMetadata: (event: FormEvent) => void;
  onTogglePublish: (story: AdminStory) => void;
  onRequestAddStory: () => void;
  pageManager: PageManagerProps;
}

function StoryEditorPanel({
  selectedStoryId,
  selectedStoryLoading,
  selectedStory,
  busyStoryId,
  metadataForm,
  setMetadataForm,
  savingMetadata,
  uploadingTarget,
  onImageUpload,
  onSaveMetadata,
  onTogglePublish,
  onRequestAddStory,
  pageManager,
}: StoryEditorPanelProps) {
  return (
    <div className="story-editor-panel">
      {!selectedStoryId && (
        <div className="state-card story-editor-empty-state">
          <p>Select a story from the list to edit metadata and manage pages.</p>
          <button type="button" className="ghost-button" onClick={onRequestAddStory}>
            Add Story
          </button>
        </div>
      )}

      {selectedStoryId && selectedStoryLoading && <div className="state-card">Loading story editor...</div>}

      {selectedStoryId && !selectedStoryLoading && selectedStory && (
        <>
          <section className="story-editor-metadata">
            <div className="story-editor-metadata-head">
              <h2>Story Editor</h2>
              <button
                type="button"
                className="read-button"
                onClick={() => onTogglePublish(selectedStory)}
                disabled={busyStoryId === selectedStory._id}
              >
                {busyStoryId === selectedStory._id
                  ? "Saving..."
                  : selectedStory.status === "published"
                    ? "Unpublish Story"
                    : "Publish Story"}
              </button>
            </div>

            <form className="story-editor-form-grid" onSubmit={onSaveMetadata}>
              <label>
                <span>Title</span>
                <input
                  type="text"
                  value={metadataForm.title}
                  onChange={(event) => setMetadataForm((current) => ({ ...current, title: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Description</span>
                <input
                  type="text"
                  value={metadataForm.description}
                  onChange={(event) =>
                    setMetadataForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Language</span>
                <select
                  value={metadataForm.language}
                  onChange={(event) =>
                    setMetadataForm((current) => ({ ...current, language: event.target.value as BookLanguage }))
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
                  value={metadataForm.minAge}
                  onChange={(event) =>
                    setMetadataForm((current) => ({ ...current, minAge: Number(event.target.value) }))
                  }
                  required
                />
              </label>
              <label>
                <span>Max Age</span>
                <input
                  type="number"
                  min={0}
                  max={18}
                  value={metadataForm.maxAge}
                  onChange={(event) =>
                    setMetadataForm((current) => ({ ...current, maxAge: Number(event.target.value) }))
                  }
                  required
                />
              </label>
              <label>
                <span>Cover Image URL</span>
                <input
                  type="url"
                  value={metadataForm.coverImageUrl}
                  onChange={(event) =>
                    setMetadataForm((current) => ({ ...current, coverImageUrl: event.target.value }))
                  }
                  placeholder="https://..."
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file || !selectedStoryId) {
                      return;
                    }
                    const target = `edit-cover-${selectedStoryId}`;
                    void onImageUpload(file, target, (url) =>
                      setMetadataForm((current) => ({ ...current, coverImageUrl: url }))
                    );
                    event.currentTarget.value = "";
                  }}
                />
                {selectedStoryId && uploadingTarget === `edit-cover-${selectedStoryId}` && (
                  <small className="story-editor-uploading-note">Uploading cover...</small>
                )}
              </label>
              <div className="story-editor-inline-actions">
                <button type="submit" className="read-button" disabled={savingMetadata}>
                  {savingMetadata ? "Saving..." : "Save Metadata"}
                </button>
              </div>
            </form>
          </section>

          <PageManager {...pageManager} />
        </>
      )}
    </div>
  );
}

export default StoryEditorPanel;
