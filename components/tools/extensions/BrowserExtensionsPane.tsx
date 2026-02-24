"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChrome, faFirefox } from "@fortawesome/free-brands-svg-icons";
import { faExternalLink } from "@fortawesome/free-solid-svg-icons";

export const BrowserExtensionsPane = () => {
	return (
		<div className="bg-surface border border-border rounded-lg shadow-sm">
			<div className="px-6 py-4 border-b border-border">
				<h2 className="text-lg font-semibold">Browser Extensions</h2>
				<p className="text-sm text-text-muted mt-1">
					Quick-add threads directly from Tumblr posts
				</p>
			</div>

			<div className="p-6 space-y-6">
				{/* How it works */}
				<div className="bg-background border border-border rounded-lg p-4">
					<h3 className="font-semibold mb-2">How It Works</h3>
					<ol className="list-decimal list-inside space-y-1 text-sm text-text-muted">
						<li>Install the RPThreadTracker QuickAdd extension for your browser</li>
						<li>Navigate to any Tumblr post you want to track</li>
						<li>Click the extension icon in your browser toolbar</li>
						<li>The "Track New Thread" form opens with the post ID pre-filled</li>
						<li>Select your character and submit to track the thread</li>
					</ol>
				</div>

				{/* Chrome */}
				<div className="border border-border rounded-lg p-4">
					<div className="flex items-start gap-4">
						<div className="flex-shrink-0">
							<FontAwesomeIcon
								icon={faChrome}
								className="w-12 h-12 text-[#4285F4]"
							/>
						</div>
						<div className="flex-1">
							<h3 className="text-lg font-semibold mb-2">Chrome Extension</h3>
							<p className="text-sm text-text-muted mb-4">
								Install the RPThreadTracker QuickAdd extension from the Chrome Web
								Store.
							</p>
							<a
								href="https://chrome.google.com/webstore/category/extensions"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm"
							>
								<span>Visit Chrome Web Store</span>
								<FontAwesomeIcon icon={faExternalLink} className="w-3 h-3" />
							</a>
						</div>
					</div>
				</div>

				{/* Firefox */}
				<div className="border border-border rounded-lg p-4">
					<div className="flex items-start gap-4">
						<div className="flex-shrink-0">
							<FontAwesomeIcon
								icon={faFirefox}
								className="w-12 h-12 text-[#FF7139]"
							/>
						</div>
						<div className="flex-1">
							<h3 className="text-lg font-semibold mb-2">Firefox Extension</h3>
							<p className="text-sm text-text-muted mb-4">
								Install the RPThreadTracker QuickAdd extension from Firefox Add-ons.
							</p>
							<a
								href="https://addons.mozilla.org/en-US/firefox/"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm"
							>
								<span>Visit Firefox Add-ons</span>
								<FontAwesomeIcon icon={faExternalLink} className="w-3 h-3" />
							</a>
						</div>
					</div>
				</div>

				{/* Note */}
				<div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
					<p className="text-sm text-text-muted">
						<strong className="text-text">Note:</strong> The browser extensions are
						currently in development. Check back soon for download links!
					</p>
				</div>
			</div>
		</div>
	);
};
