# RPThreadTracker v4 — Manual Smoke Test Plan

## Prerequisites

- Dev server running at `http://localhost:3000`
- At least one test account with existing threads in the database
- A fresh test account (or use registration flow to create one)
- A valid Tumblr post URL to use for thread tracking

---

## 1. Authentication

### 1.1 Login

- [x] Navigate to `/login` — page renders, no redirect loop
- [x] Navigate to `/` while logged out - login page renders, no redirect loop
- [x] Submit empty form — validation errors appear on both fields
- [x] Submit wrong credentials — error banner appears, no crash
- [x] Submit valid credentials — redirects to `/` (dashboard)
- [x] After login, navigating to `/login` redirects back to `/`

### 1.2 Registration

- [x] Navigate to `/register` while logged out — page renders
- [x] Submit empty form — validation errors on all fields
- [x] Submit mismatched passwords — error shown
- [x] Submit password under 6 characters — error shown
- [x] Submit an email already in use — error shown
- [x] Submit a username already in use — error shown
- [x] Submit valid new credentials — auto-signs in, redirects to `/`
- [x] "Sign in" link on register page navigates to `/login`

### 1.3 Forgot Password

- [x] `/login` page has "Forgot your password?" link
- [x] Navigate to `/forgot-password` while logged out — page renders
- [x] Submit unknown email — success message shown (same as real email)
- [x] Submit known email — email arrives, contains reset link
- [x] Click reset link — `/reset-password/[token]` renders
- [x] Submit mismatched passwords — error shown
- [x] Submit valid new password — redirects to `/login?reset=success`
- [x] Green success banner visible on login page
- [x] Log in with new password — succeeds
- [x] Attempt to reuse the same reset link — "invalid or expired" error

### 1.4 Email Change (Settings)

- [x] In Settings → Account Info: enter a new email address, click "Send Verification Email"
- [x] Success toast shown; email arrives at new address
- [x] Click verification link — `/verify-email/[token]` auto-verifies, shows success
- [x] Log out and log back in — email in Account Info reflects the new address
- [x] Attempt to reuse the verification link — error shown

### 1.5 Logout

- [x] Profile menu → Logout — redirects to `/login`
- [x] After logout, navigating to `/` redirects to `/login`

---

## 2. Layout & Navigation

### 2.1 Sidebar

- [x] On desktop (≥1024px): sidebar open by default
- [x] Hamburger button in header toggles sidebar open/closed
- [x] On mobile (<1024px): sidebar closed by default, toggle works
- [x] All sidebar links navigate to the correct page
- [x] Active page link is visually highlighted

### 2.2 Header

- [x] Logo visible; clicking it navigates to `/`
- [x] "Add" menu dropdown: "Track New Thread" opens thread modal, "Add Character" opens character modal
- [x] News button visible with correct unread count badge (or no badge if all read)
- [x] Profile dropdown: Settings, Tools, Help, Logout all navigate/function correctly
- [x] Refresh button triggers Tumblr data refresh (progress shown)

### 2.3 Theme

- [x] Footer theme toggle switches between dark and light modes
- [x] Theme persists across page navigation
- [x] Theme persists after browser refresh

---

## 3. Dashboard

- [x] Page loads without error
- [x] **At a Glance**: all 4 stat cards show counts (Active, Your Turn, Their Turn, Queued); each links to the correct threads page
- [x] **Recent Activity**: shows up to 5 "Your Turn" threads; each has title, partner, date; "Untrack", "Archive", "Mark Queued" action buttons visible
- [x] **Your Characters**: shows character cards with thread counts; sorted alphabetically; "Manage Characters" link works
- [x] **Random Thread Generator**: "Generate" button picks a random Your Turn thread and displays title + link; multiple clicks produce different results (if multiple threads exist); "Awaiting Starter" shown if no post yet
- [x] **Support Card**: PayPal button visible
- [x] Empty states shown correctly when user has no threads/characters

---

## 4. News Sidebar

- [x] News button in header shows unread badge count on first visit (if news exists)
- [x] Clicking news button opens right sidebar
- [x] News items display title (linked), date, and "New" badge on unread items
- [x] After opening, badge count resets to 0
- [x] After reopening, no "New" badges (all marked read)
- [x] Clicking backdrop closes the sidebar
- [x] Clicking × button closes the sidebar
- [x] News item links open in new tab

---

## 5. Character Management (`/manage-characters`)

- [x] Page loads with list of characters in sortable table
- [x] Sort by character name, status, thread count — works correctly
- [x] **Create**: "Add Character" (header or page button) opens modal; submit empty form shows validation; valid submission creates character and appears in table
- [x] **Edit**: pencil icon opens modal pre-filled; change name and save — updates in table
- [x] **Hiatus toggle**: archive icon puts character on hiatus (strikethrough, muted); box-open icon removes hiatus
- [x] **Delete**: trash icon shows confirmation prompt; confirming deletes the character and removes from table; cancelling does nothing
- [x] Thread count column shows correct count; hiatus characters show "-"

---

## 6. Thread Management

### 6.1 All Threads (`/threads/all`)

- [ ] Page loads; all non-archived threads shown
- [ ] Status badges (Your Turn / Their Turn / Queued) display correctly
- [ ] Character filter dropdown filters table correctly
- [ ] Column filter inputs (title, partner, last poster) filter correctly
- [ ] Tag filter works
- [ ] Sorting columns works; custom sort indicator (primary-colored bar) appears
- [ ] Pagination controls work; page size selector works
- [ ] Expandable row shows description and tags
- [ ] Row checkbox selects thread; header checkbox selects all
- [ ] **Single actions**: Edit (opens pre-filled modal), Archive, Untrack — each works and refreshes table
- [ ] "Mark Queued" button is hidden on All Threads page
- [ ] **Bulk actions**: select multiple → Archive, Unarchive, Untrack all work

### 6.2 Your Turn (`/threads/your-turn`)

- [ ] Only shows threads where it's your turn
- [ ] "Mark Queued" button visible; disabled for threads without a valid Tumblr post
- [ ] Bulk "Toggle Queue" works

### 6.3 Their Turn (`/threads/their-turn`)

- [ ] Only shows threads where it's their turn

### 6.4 Queued (`/threads/queued`)

- [ ] Only shows queued threads
- [ ] "Unqueue" action works

### 6.5 Archived (`/threads/archived`)

- [ ] Only shows archived threads
- [ ] "Unarchive" single and bulk actions work; thread returns to active views

### 6.6 Track New Thread (modal)

- [ ] Opens from header "Add" menu and from "Track New Thread" on thread pages
- [ ] Character dropdown populated; required validation works
- [ ] Post ID field required
- [ ] Tags: add via Enter key; remove via × button
- [ ] Save creates thread; appears in table and context updates

---

## 7. Tools (`/tools`)

### 7.1 Export to Excel

- [ ] "Export" button triggers `.xlsx` download
- [ ] File contains threads organized by character sheet
- [ ] "Include archived" toggle includes/excludes archived threads in export

### 7.2 Manage Tags

- [ ] Tag list loads with counts
- [ ] Rename: select tag(s), enter new name, confirm — all renamed threads update
- [ ] Delete: select tag(s), confirm — removed from all threads

### 7.3 Manage Public Views

- [ ] Public views list loads
- [ ] **Create**: modal opens; fill all fields; slug availability check on blur; save creates view and appears in list
- [ ] **Edit**: opens pre-filled modal; changes save correctly
- [ ] **Copy URL**: copies `/public/{username}/{slug}` to clipboard
- [ ] **Delete**: inline confirm, then removes from list

### 7.4 Browser Extensions

- [ ] Tab renders with download links and instructions (static content)

---

## 8. Public View (unauthenticated)

- [ ] Navigate to `/public/{username}/{slug}` while logged out — page renders without redirect to login
- [ ] Thread table loads with correct data for the view's filters
- [ ] Status filter dropdown works
- [ ] Pagination works
- [ ] Expandable rows show description/tags
- [ ] Invalid username/slug — 404 or error state (not a crash)

---

## 9. Settings (`/settings`)

### 9.1 Change Password

- [ ] Submit empty form — validation errors
- [ ] Wrong current password — error shown
- [ ] Mismatched new passwords — error shown
- [ ] Valid submission — success toast; can log in with new password

### 9.2 Account Info

- [ ] Username field editable; save updates username (sidebar/header reflect new name without full reload)
- [ ] Email field shows current email (disabled); separate input for new email
- [ ] "Send Verification Email" — success toast, email arrives

### 9.3 Delete Account

- [ ] "Delete Account" button shows inline confirmation
- [ ] Cancel dismisses prompt
- [ ] Confirm — signs out, redirects to `/login`; attempting to log in with deleted credentials fails

---

## 10. Help (`/help`)

- [ ] Page loads
- [ ] All 4 tabs render: About, Support Guides, FAQ, Contact
- [ ] FAQ accordion items expand/collapse
- [ ] External links (Patreon, GitHub Issues, guides) have correct `href` and open in new tab

---

## 11. Quick-Add (Browser Extension Flow)

- [ ] Navigate to `/quick-add?blogShortname=someblog&postId=12345` while logged out — redirects to `/login?callbackUrl=...`; after login, returns to quick-add with params preserved
- [ ] While logged in — page renders without sidebar/header (minimal shell)
- [ ] Character dropdown pre-selects character matching `blogShortname` (if one exists)
- [ ] Post ID pre-filled from `postId` param
- [ ] Submit valid thread — success confirmation shown
- [ ] Form resets for adding another thread

---

## 12. Cross-Cutting Concerns

- [ ] **Toast notifications**: success and error toasts appear and auto-dismiss for all mutations
- [ ] **Loading states**: buttons show disabled/spinner while async operations are in flight
- [ ] **No console errors** on any page under normal use
- [ ] **Mobile layout**: sidebar collapses, tables scroll horizontally, cards stack vertically
- [ ] **Dark/light mode**: all pages readable in both themes; no invisible text
- [ ] **Thread status refresh**: "Refresh" button in header triggers re-fetch; progress indicator visible; counts update after completion

---

## Test Data Notes

- Test with a user that has **0 threads** to verify all empty states
- Test with a user that has threads in **all status categories** (your turn, their turn, queued, archived)
- Test with a Tumblr post that **no longer exists** to verify graceful null handling (no post date, queue button disabled)
