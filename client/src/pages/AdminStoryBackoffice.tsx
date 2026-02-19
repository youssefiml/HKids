import "../styles/pages/adminStoryBackoffice/AdminStoryBackoffice.css";

import StoryCreatePanel from "./adminStoryBackoffice/StoryCreatePanel";
import StoryEditorPanel from "./adminStoryBackoffice/StoryEditorPanel";
import StoryListPanel from "./adminStoryBackoffice/StoryListPanel";
import StoryToolbar from "./adminStoryBackoffice/StoryToolbar";
import { useAdminStories } from "./adminStoryBackoffice/useAdminStories";

type Props = {
  token: string;
};

function AdminStoryBackoffice({ token }: Props) {
  const {
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
    refreshStories,
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
  } = useAdminStories(token);

  const showAddView = () => {
    setActionError(null);
    setActiveView("add");
  };

  const showManageView = () => {
    setActiveView("manage");
  };

  return (
    <div className="story-admin-shell">
      <StoryToolbar
        search={search}
        statusFilter={statusFilter}
        languageFilter={languageFilter}
        storiesLoading={storiesLoading}
        activeView={activeView}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onLanguageChange={setLanguageFilter}
        onRefresh={() => void refreshStories()}
        onShowAdd={showAddView}
        onShowManage={showManageView}
      />

      {storiesError && <p className="error-text">{storiesError}</p>}
      {selectedStoryError && <p className="error-text">{selectedStoryError}</p>}
      {actionError && <p className="error-text">{actionError}</p>}

      {activeView === "add" && (
        <StoryCreatePanel
          createForm={createForm}
          setCreateForm={setCreateForm}
          createPages={createPages}
          setCreatePages={setCreatePages}
          creatingStory={creatingStory}
          uploadingTarget={uploadingTarget}
          onImageUpload={handleImageUpload}
          onImportPdfPages={handleImportCreatePdfPages}
          onSubmit={handleCreateStory}
          onCancel={showManageView}
        />
      )}

      {activeView === "manage" && (
        <section className="story-admin-layout">
          <StoryListPanel
            stories={stories}
            storiesLoading={storiesLoading}
            selectedStoryId={selectedStoryId}
            busyStoryId={busyStoryId}
            onSelectStory={setSelectedStoryId}
            onTogglePublish={(story) => void handleTogglePublish(story)}
            onDeleteStory={(storyId) => void handleDeleteStory(storyId)}
            onRequestAddStory={showAddView}
          />

          <StoryEditorPanel
            selectedStoryId={selectedStoryId}
            selectedStoryLoading={selectedStoryLoading}
            selectedStory={selectedStory}
            busyStoryId={busyStoryId}
            metadataForm={metadataForm}
            setMetadataForm={setMetadataForm}
            savingMetadata={savingMetadata}
            uploadingTarget={uploadingTarget}
            onImageUpload={handleImageUpload}
            onSaveMetadata={handleSaveMetadata}
            onTogglePublish={(story) => void handleTogglePublish(story)}
            onRequestAddStory={showAddView}
            pageManager={{
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
              onImageUpload: handleImageUpload,
              onImportPdfPages: handleImportPdfPages,
              onAddPage: handleAddPage,
              onStartPageEdit: handleStartPageEdit,
              onSavePageEdit: handleSavePageEdit,
              onMovePage: (pageId, direction) => void handleMovePage(pageId, direction),
              onDeletePage: (pageId) => void handleDeletePage(pageId),
            }}
          />
        </section>
      )}
    </div>
  );
}

export default AdminStoryBackoffice;
