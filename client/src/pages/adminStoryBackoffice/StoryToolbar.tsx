import "../../styles/pages/adminStoryBackoffice/StoryToolbar.css";

import type { BackofficeView, LanguageFilter, StoryStatusFilter } from "./types";

interface StoryToolbarProps {
  search: string;
  statusFilter: StoryStatusFilter;
  languageFilter: LanguageFilter;
  storiesLoading: boolean;
  activeView: BackofficeView;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StoryStatusFilter) => void;
  onLanguageChange: (value: LanguageFilter) => void;
  onRefresh: () => void;
  onShowAdd: () => void;
  onShowManage: () => void;
}

function StoryToolbar({
  search,
  statusFilter,
  languageFilter,
  storiesLoading,
  activeView,
  onSearchChange,
  onStatusChange,
  onLanguageChange,
  onRefresh,
  onShowAdd,
  onShowManage,
}: StoryToolbarProps) {
  return (
    <section className="story-admin-toolbar">
      <label>
        <span>Search</span>
        <input
          type="search"
          placeholder="Story title..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <label>
        <span>Status</span>
        <select value={statusFilter} onChange={(event) => onStatusChange(event.target.value as StoryStatusFilter)}>
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
      <label>
        <span>Language</span>
        <select value={languageFilter} onChange={(event) => onLanguageChange(event.target.value as LanguageFilter)}>
          <option value="all">All</option>
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="ar">Arabic</option>
        </select>
      </label>
      <button type="button" className="ghost-button" onClick={onRefresh} disabled={storiesLoading}>
        {storiesLoading ? "Refreshing..." : "Refresh"}
      </button>
      {activeView === "manage" ? (
        <button type="button" className="read-button toolbar-action" onClick={onShowAdd}>
          Add Story
        </button>
      ) : (
        <button type="button" className="ghost-button toolbar-action" onClick={onShowManage}>
          Back to Stories
        </button>
      )}
    </section>
  );
}

export default StoryToolbar;
