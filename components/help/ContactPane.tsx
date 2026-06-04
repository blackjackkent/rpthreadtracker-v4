import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faTumblr } from "@fortawesome/free-brands-svg-icons";

export const ContactPane = () => {
	return (
		<div className="space-y-4 max-w-2xl">
			<div className="bg-surface border border-border rounded-lg p-6 space-y-4">
				<h2 className="text-xl font-semibold">Contact</h2>
				<p className="text-text-muted leading-relaxed">
					Have a bug to report, a feature request, or just want to say hi? The
					best way to reach out is through GitHub Issues.
				</p>
				<a
					href="https://github.com/blackjacksoftware/rpthreadtracker/issues/new"
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded transition-colors font-medium"
				>
					<FontAwesomeIcon icon={faGithub} className="w-4 h-4" />
					Open a GitHub Issue
				</a>
				<p className="text-text-muted leading-relaxed">
					You can also find updates and announcements on the{" "}
					<a
						href="https://tblrthreadtracker.tumblr.com"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline inline-flex items-center gap-1"
					>
						<FontAwesomeIcon icon={faTumblr} className="w-3 h-3" />
						RPThreadTracker support blog
					</a>{" "}
					on Tumblr.
				</p>
			</div>
		</div>
	);
};
