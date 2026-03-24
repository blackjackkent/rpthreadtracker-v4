export const AboutTrackerPane = () => {
	return (
		<div className="space-y-6 max-w-2xl">
			<div className="bg-surface border border-border rounded-lg p-6 space-y-4">
				<h2 className="text-xl font-semibold">About RPThreadTracker</h2>
				<p className="text-text-muted leading-relaxed">
					RPThreadTracker helps you keep track of your roleplay threads on
					Tumblr. It connects to Tumblr&apos;s public API to check the status of
					your threads and lets you know whose turn it is to reply, so you never
					lose track of an ongoing story.
				</p>
				<p className="text-text-muted leading-relaxed">
					RPThreadTracker is not affiliated with or endorsed by Tumblr. It uses
					Tumblr&apos;s publicly available API to access post data. All trademarks
					belong to their respective owners.
				</p>
				<p className="text-text-muted leading-relaxed">
					RPThreadTracker is developed and maintained by{" "}
					<a
						href="https://blackjacksoftware.dev"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
					>
						Blackjack Software
					</a>
					.
				</p>
			</div>

			<div className="bg-surface border border-border rounded-lg p-6 space-y-4">
				<h2 className="text-xl font-semibold">Support the Project</h2>
				<p className="text-text-muted leading-relaxed">
					RPThreadTracker is free to use! If you find it helpful, consider
					supporting development on{" "}
					<a
						href="https://www.patreon.com/blackjacksoftware"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
					>
						Patreon
					</a>
					. Your support helps keep the servers running and new features coming.
				</p>
			</div>
		</div>
	);
};
