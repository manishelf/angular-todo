
# Features of this app V1.00

[Download demo todo items to play around](/demo)

## General Features

- **A Fully Offline Progressive Web App**
- **Frontend**: Angular
- **Database**: Uses IndexedDB API for all storage needs. Fast in-browser persistent DB supported by all major browsers.
- **Perk**: Item description supports full Markdown and code formatting. You can paste images and files from the clipboard too.

---

## Search

- **Prefix Matching**: Normal search or full-text search with `!F:`.
- **Cumulative Search**: Use `!ALL:` for cumulative search or exact match otherwise.
- **Sorting**:
  - **By Creation Timestamp**: Use `!OLD:`.
  - **By Update Timestamp**: Use `!LAT:`.
  - **Stable Sorting**: Use `!ASC:` or `!DESC:` to sort by properties (e.g., `!ASC:subject,day;`).
  - **Limit Results**: Use `!LIM:` to limit the number of results (e.g., `!LIM:3;`).

#### Search Commands

- `!ALL:` Any that match (default - matches all).
- `!F:` Full text search (default - subject prefix).
- `!T:` Tag-based search with `+` (include) and `-` (exclude) modifiers.


---

## Filtering

- **Advanced Grouping with Tags**:
  - Use `!T:` with `+` (include) or `-` (exclude) modifier.  
  - Example: `searchQuery !T: +tag1, -tag2`.

---

## Custom Forms

- **Add Custom Input Fields** with full validations.
- **Supported Input Types**:
  - `'text'`, `'textarea'`, `'email'`, `'password'`
  - `'number'`, `'date'`, `'select'`, `'checkbox'`, `'radio'`, `'boolean'`, `'image'`, `'url'`
  - `'color'`, `'range'`, `'month'`, `'time'`, `'datetime-local'`, `'history'`, `'canvas'`, `'timestamp'`

---


## Keyboard Shortcuts

- **Navigate Faster**:
  - `Ctrl + [` → Go to editor or new child note.
  - `Ctrl + ]` → Go to home or parent note.
- **supports full navigation in list view at home sreen**
  - focus the search bar in list view then press tab to focus on a note then ->
  - `↑ | w | k` for up in same column
  - `← | a | h` for right in same row
  - `↓ | s | j` for down in same column
  - `→ | d | l` for left in same row
---

## Nested Notes

- **Create Child Notes**: Take nested notes by creating child notes.
- e.g. `p1->c1; p1->c2;` or `p1->c1->c2` navigate the hierarchy with the generated treeview
- Keyboard shortcuts also work for navigating through child and parent notes!

---

## Backup

- **Download Notes**: Export your notes as a JSON file and load them back as a backup.
- **Use Third-Party Sharing Sites**:
  - [snapdrop.net](https://snapdrop.net)
  - [sharedrop.io](https://sharedrop.io)
  - [file.pizza](https://file.pizza)
  - [send-anywhere.com](https://send-anywhere.com)
  - [wetransfer.com](https://wetransfer.com)

---
