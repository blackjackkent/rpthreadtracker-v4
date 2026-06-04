export const dynamic = "force-dynamic";

export default function MaintenancePage() {
	return (
		<div className="min-h-screen bg-background text-text flex flex-col items-center justify-center px-4">
			<div className="text-center max-w-md space-y-4">
				<h1 className="text-8xl font-bold text-primary">503</h1>
				<h2 className="text-2xl font-semibold">Service Unavailable</h2>
				<p className="text-text-muted leading-relaxed">
					RPThreadTracker is temporarily down for maintenance. We&apos;ll be
					back shortly.
				</p>
				<p className="text-text-muted text-sm">
					Check the{" "}
					<a
						href="https://tblrthreadtracker.tumblr.com"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
					>
						announcements blog
					</a>{" "}
					for updates.
				</p>
			</div>
		</div>
	);
}
