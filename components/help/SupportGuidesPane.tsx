import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";

interface Guide {
	title: string;
	description: string;
	href: string;
}

const GUIDES: Guide[] = [
	{
		title: "Intro Tutorial",
		description:
			"New to RPThreadTracker? Watch this video walkthrough to get up and running quickly.",
		href: "https://www.youtube.com/watch?v=example",
	},
	{
		title: "Guide to Managing Public Views",
		description:
			"Learn how to create shareable public views of your thread lists that partners and followers can browse.",
		href: "https://rpthreadtracker.tumblr.com/post/public-views-guide",
	},
	{
		title: "Guide to Marking Threads as Queued",
		description:
			"Understand how to use the queue feature to track threads you've queued in Tumblr's post queue.",
		href: "https://rpthreadtracker.tumblr.com/post/queued-threads-guide",
	},
];

export const SupportGuidesPane = () => {
	return (
		<div className="space-y-4 max-w-2xl">
			<div className="bg-surface border border-border rounded-lg p-6 space-y-4">
				<h2 className="text-xl font-semibold">Support Guides</h2>
				<p className="text-text-muted">
					Tutorials and guides to help you get the most out of RPThreadTracker.
				</p>
				<ul className="space-y-4">
					{GUIDES.map((guide) => (
						<li key={guide.href} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
							<a
								href={guide.href}
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary hover:underline font-medium flex items-center gap-2"
							>
								{guide.title}
								<FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
							</a>
							<p className="text-text-muted text-sm mt-1">{guide.description}</p>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};
