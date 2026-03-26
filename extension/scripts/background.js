const APP_URL = "https://www.rpthreadtracker.com";
const TUMBLR_POST_PATTERN = /^https?:\/\/([\w-]+)\.tumblr\.com\/post\/(\d+)/;

// Disable the action for all tabs by default
chrome.action.disable();

// Show/hide the action based on whether the current tab is a Tumblr post
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status !== "complete" || !tab.url) return;

	if (TUMBLR_POST_PATTERN.test(tab.url)) {
		chrome.action.enable(tabId);
	} else {
		chrome.action.disable(tabId);
	}
});

// Open the quick-add popup when the action icon is clicked
chrome.action.onClicked.addListener((tab) => {
	if (!tab.url) return;

	const match = tab.url.match(TUMBLR_POST_PATTERN);
	if (!match) return;

	const blogShortname = match[1];
	const postId = match[2];

	chrome.windows.create({
		url: `${APP_URL}/quick-add?blogShortname=${blogShortname}&postId=${postId}`,
		left: 100,
		top: 100,
		width: 520,
		height: 700,
		type: "popup",
	});
});
