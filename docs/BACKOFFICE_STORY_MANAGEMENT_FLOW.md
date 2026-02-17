# Backoffice Story Management: Minimal UI Flow

## 1. Story List Page
- Shows all stories with columns/cards:
  - title
  - language
  - minAge-maxAge
  - status (`draft` or `published`)
  - pages count
  - last updated
- Includes basic filters:
  - search by title
  - status
  - language
- Primary actions:
  - `Create Story`
  - open a story in `Story Editor`
  - quick `Publish`/`Unpublish` toggle

## 2. Story Editor Page
- Metadata panel:
  - title
  - description
  - language
  - minAge
  - maxAge
  - cover image URL
  - save metadata button
- Pages management panel:
  - add page (image only or image + short text)
  - edit page (image/text)
  - delete page
  - reorder pages
- Reorder interaction:
  - drag-drop or up/down buttons
  - save sends final ordered page IDs to reorder endpoint

## 3. Publish Toggle
- Available on list and editor pages.
- Publish pre-check:
  - cover image exists
  - at least one page exists
  - each page has an image
- If pre-check fails, user gets blocking validation error and story stays `draft`.
- Unpublish returns story to `draft`.

## 4. Access Rules in UI
- Show story management pages only for authenticated admins.
- Non-admin users should not see create/edit/publish controls.
- If non-admin reaches endpoint directly, backend returns `403`.
