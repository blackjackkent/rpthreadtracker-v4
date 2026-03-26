# RPThreadTracker QuickAdd — Browser Extension

Adds a toolbar button that appears on Tumblr post pages. Click it to open a focused window for quickly adding that thread to your RPThreadTracker account.

## Files

```
extension/
├── manifest.chrome.json   # Chrome (MV3) manifest
├── manifest.firefox.json  # Firefox (MV3) manifest
├── icon.png               # Extension icon
└── scripts/
    └── background.js      # Service worker — URL detection + popup launcher
```

## Loading in development

### Chrome
1. Copy `manifest.chrome.json` → `manifest.json` in this folder
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select this `extension/` folder

### Firefox
1. Copy `manifest.firefox.json` → `manifest.json` in this folder
2. Go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on** and select `manifest.json`

## Publishing

### Chrome Web Store
- Zip the folder with `manifest.chrome.json` renamed to `manifest.json`
- Upload at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

### Firefox Add-ons
- Zip the folder with `manifest.firefox.json` renamed to `manifest.json`
- Upload at [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
- Firefox requires the extension to be signed; use `web-ext sign` for self-distribution

## How it works

1. `background.js` listens for tab updates
2. If the URL matches `*.tumblr.com/post/{id}`, the toolbar icon is enabled
3. Clicking the icon opens a 520×700 popup to `/quick-add?blogShortname=...&postId=...`
4. The app pre-fills the post ID and attempts to match the blog shortname to one of your characters
5. On submit the thread is tracked; on success a confirmation is shown with an option to close the window

## Updating the production URL

If the app moves domains, update `APP_URL` in `scripts/background.js`.
