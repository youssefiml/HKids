import "../../styles/pages/adminStoryBackoffice/StoryListPanel.css";

import type { AdminStory } from "../../api/backofficeApi";

interface StoryListPanelProps {
  stories: AdminStory[];
  storiesLoading: boolean;
  selectedStoryId: string | null;
  busyStoryId: string | null;
  onSelectStory: (storyId: string) => void;
  onTogglePublish: (story: AdminStory) => void;
  onDeleteStory: (storyId: string) => void;
  onRequestAddStory: () => void;
}

function StoryListPanel({
  stories,
  storiesLoading,
  selectedStoryId,
  busyStoryId,
  onSelectStory,
  onTogglePublish,
  onDeleteStory,
  onRequestAddStory,
}: StoryListPanelProps) {
  return (
    <div className="story-list-panel">
      <h2>Stories</h2>
      {storiesLoading && <div className="state-card">Loading stories...</div>}
      {!storiesLoading && stories.length === 0 && (
        <div className="state-card story-list-empty-state">
          <p>No stories found.</p>
          <button type="button" className="read-button" onClick={onRequestAddStory}>
            Add your first story
          </button>
        </div>
      )}
      {!storiesLoading && stories.length > 0 && (
        <ul className="story-admin-list">
          {stories.map((story) => (
            <li
              key={story._id}
              className={selectedStoryId === story._id ? "story-admin-card active" : "story-admin-card"}
            >
              <div className="story-admin-card-head">
                <div>
                  <p className="story-language">{story.language}</p>
                  <h3>{story.title}</h3>
                </div>
                <span className={story.status === "published" ? "status-pill published" : "status-pill draft"}>
                  {story.status}
                </span>
              </div>
              <p className="story-meta">
                Ages {story.minAge}-{story.maxAge}
              </p>
              <p className="story-meta">Pages: {story.pagesCount ?? story.pages?.length ?? 0}</p>
              <div className="story-admin-card-actions">
                <button type="button" className="ghost-button" onClick={() => onSelectStory(story._id)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="read-button"
                  onClick={() => onTogglePublish(story)}
                  disabled={busyStoryId === story._id}
                >
                  {busyStoryId === story._id ? "Saving..." : story.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  className="ghost-button danger"
                  onClick={() => onDeleteStory(story._id)}
                  disabled={busyStoryId === story._id}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default StoryListPanel;
