# <a id="features">Features of this app V1.5</a>
---
### [Download demo todo items to play around](/demo)
----
### For Build - 
## Frontend
#### build as ng build --configuration production --base-href /ang/ --deploy-url /ang/
##### OR 
##### npm run "build ang"
## App Server / Backend
#### run as a spring boot app / package as a jar / war with maven package
---

## <a id="general-features">General Features</a>

- **Progressive Web App With full Offline Support**
- **Frontend**: Angular
- **Application Server**: Spring Boot
- **Database**:
    - Uses IndexedDB API for all client side storage needs [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).\
        - In browser document store that stores js objects localy
        - fast read writes and no need for serialization
        - supports atleast 10GiB of storage as compared to 10 Mib of localStorage
        - Fast retreaval with indexed items
    - Uses H2 File based relational DB for server side storage (documents are stored as normal files in os) [H2 database](https://h2database.com/html/main.html)
        - H2 Is Java based jdbc db
        - since based on java / jvm it is cross platform
        - deployment does not require a seperate instance of db
        - db files are readily portable '*.h2.db' file
        - allows dev to view / manage db with h2 browser console available at /qtodo-h2-console
- **Security**:
    - JWT based security
    - Session token sent to client and stored in localStorage (very short expiration)
    - Refresh token is stored in https secure cookies
    - Document access and socket connection is managed with url parameter based token and not Authorization Header 
- **Perk**:
    - Item description supports full Markdown and code formatting. You can paste images and files from the clipboard too. with custom extensions like `[collapse: title]content[collapse]` `@m[title](url){type:t,width:w,height:h}`
      - [collapse: this is a collapsable block]
       conetent is here 
       @m[dummy_img](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ89TzGh0JE2R8h80nW682bu-q0XAHMX0Rkyg&s){t:img}
       @m[dummy_vid](https://www.pexels.com/download/video/4620563/){t:vid,w:200px,h:300px}
      [/collapse]
    - When Using along with App Server the documents are stored on servers os in folder qtodo_data/user_data
    - Customize Appearence with 11 available themes Themes & Customization
      Themes: Choose from 11 themes, including Classic, Vibrant, Cool, Developer, and Retro.
      Wallpaper Options: Users can select from a variety of background wallpapers including GameOfLife, MandelBrotSet, JuliaSet and Arkanoid.
      Switch background with foreground with Alt + l to hide the current screen.
    - UserGroups and Colaboration is possible with the backend connected.
        - no need to share backup file to share notes. user can signup for usergroups and share their notes with participants
        - usergroups allow real time colaboration , access control , locgically grouping of users
---
## <a id="search">Search</a>

- **Prefix Matching**: Normal search or full-text search with `!F:`.
- **Cumulative Search**: Use `!ALL:` for cumulative search or exact match otherwise.
- **Sorting**:
  - **By Creation Timestamp**: Use `!OLD:`.
  - **By Update Timestamp**: Use `!LAT:`.
  - **Stable Sorting**: Use `!ASC:` or `!DESC:` to sort by properties (e.g., `!ASC:subject,day;`).
  - **Limit Results**: Use `!LIM:` to limit the number of results (e.g., `!LIM:3;`).

#### <a id="search-commands">Search Commands</a>

- `!ALL:` Any that match (default - matches all).
- `!F:` Full text search (default - subject prefix).
- `!T:` Tag-based search with `+` (include) and `-` (exclude) modifiers.

---

## <a id="filtering">Filtering</a>

- **Advanced Grouping with Tags**:
  - Use `!T:` with `+` (include) or `-` (exclude) modifier.  
  - Example: `searchQuery !T: +tag1, -tag2`.

---

## <a id="custom-forms">Custom Forms</a>

- **Add Custom Input Fields** with full validations.
- **Supported Input Types**:
  - `'text'`, `'textarea'`, `'email'`, `'password'`
  - `'number'`, `'date'`, `'select'`, `'checkbox'`, `'radio'`, `'boolean'`, `'image'`,  `'iframe'`, `'url'`
  - `'color'`, `'range'`, `'month'`, `'time'`, `'datetime-local'`, `'history'`, `'canvas'`, `'timestamp'`

---

## <a id="keyboard-shortcuts">Keyboard Shortcuts</a>

- **Navigate Faster**:
  - `Ctrl + [` → Go to editor or new child note.
  - `Ctrl + ]` → Go to home or parent note.
- **Supports full navigation in list view at home screen**:
  - Focus the search bar in list view, then press `Tab` to focus on a note, then use:
    - `↑ | w | k` for up in the same column.
    - `← | a | h` for left in the same row.
    - `↓ | s | j` for down in the same column.
    - `→ | d | l` for right in the same row.

---

## <a id="nested-notes">Nested Notes</a>

- **Create Child Notes**: Take nested notes by creating child notes.
- Example: `p1->c1; p1->c2;` or `p1->c1->c2`. Navigate the hierarchy with the generated tree view.
- Keyboard shortcuts also work for navigating through child and parent notes!
  
---
## <a id="folders">Folders</a>
  - The Local user can create folders To manage the items Based on type / genere
  - eg Finances, Homework, Science, Maths , etc.
  - access to each folder can be managed in profile page or nav bar
---
---
## <a id="usergroups">User Groups</a>
  - when tha App server is deployed users can Signup for the default usergroup `qtodo` or create their own usergroup
  - each user will belong to some usergroup created by them or some other usergroup
  - usergroups proved ability for users to colaborate on notes o share their notes to others in a Author -> Audience way
  - usegroups can be **access controled** by Owner / Manager
  - Permissions are discrete and can be granted / removed for given participants
  - A usergroup can be **open** (group is selectable at signup) or not (user must be made aware of the name to join)
  - A usegroup can be **colaboration** (participants are sent **realtime updates** of items) or not
  - Permission list -
    - `READ,  GET_DOCUMENT,  WRITE,  EDIT,  DELETE,  COLAB,  SHARE, `
    - `CHANGE_UG_CONFIG,  REMOVE_PARTICIPANT,  ADD_PARTICIPANTS,  MANAGE_PARTICIPANT_PERMISSIONS,  ENABLE_DISABLE_UG,  SERVER_TOOLS,`
  - Roles -
    - `AUTHOR,  AUDIENCE,  COLLABORATOR,  ADMIN,  UG_OWNER`
  - For user to colaborate the user must have COLAB permission to allow the socket connection
  - usergroup can be managed in the profile page
---

---
## <a id="usergroups">Tech stack</a>
  - **Frontend** - IndexDB, angular 19, tailwind
  - **Backend** - Java - H2DB, Spring Boot REST service, Spring Security with JWT, Protobuf
---

## <a id="backup">Backup</a>

- **Download Notes**: Export your notes as a JSON file and load them back as a backup.
---

---
