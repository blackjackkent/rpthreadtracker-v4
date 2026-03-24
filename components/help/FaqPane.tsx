"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

interface FaqItem {
	question: string;
	answer: React.ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
	{
		question: 'Why am I seeing a "Not Found" error for a thread?',
		answer: (
			<div className="space-y-2 text-text-muted text-sm">
				<p>There are a few reasons a thread might show as "Not Found":</p>
				<ul className="list-disc list-inside space-y-1 ml-2">
					<li>The post URL you entered is incorrect or has changed.</li>
					<li>The post has been deleted by you or your partner.</li>
					<li>
						The blog is set to private or has been deactivated, so Tumblr&apos;s
						API can&apos;t access it.
					</li>
					<li>
						Tumblr&apos;s API is temporarily unavailable — try refreshing again
						later.
					</li>
				</ul>
			</div>
		),
	},
	{
		question: "Why can't I track open starters on Tumblr?",
		answer: (
			<p className="text-text-muted text-sm">
				Open starters are posts that haven&apos;t been replied to yet, so
				there&apos;s no reblog chain for RPThreadTracker to analyze. The app
				determines whose turn it is by looking at who most recently reblogged
				the thread, which requires at least one reply to exist.
			</p>
		),
	},
	{
		question:
			"Why doesn't the Export Threads tool include post dates and whose turn it is?",
		answer: (
			<p className="text-text-muted text-sm">
				Post dates and turn status come from the Tumblr API, which is fetched
				live when you load the app. The export is generated from your saved
				thread data in the database, which doesn&apos;t store those values
				between sessions. You can use the export as a record of your thread
				list, but live Tumblr data isn&apos;t included.
			</p>
		),
	},
];

const FaqItemRow = ({ item }: { item: FaqItem }) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<li className="border-t border-border first:border-t-0">
			<button
				type="button"
				onClick={() => setIsOpen((prev) => !prev)}
				className="w-full text-left flex items-center justify-between gap-4 py-4 font-medium hover:text-primary transition-colors"
			>
				<span>{item.question}</span>
				<FontAwesomeIcon
					icon={isOpen ? faChevronUp : faChevronDown}
					className="w-4 h-4 shrink-0 text-text-muted"
				/>
			</button>
			{isOpen && <div className="pb-4">{item.answer}</div>}
		</li>
	);
};

export const FaqPane = () => {
	return (
		<div className="space-y-4 max-w-2xl">
			<div className="bg-surface border border-border rounded-lg p-6">
				<h2 className="text-xl font-semibold mb-4">
					Frequently Asked Questions
				</h2>
				<ul className="space-y-0">
					{FAQ_ITEMS.map((item) => (
						<FaqItemRow key={item.question} item={item} />
					))}
				</ul>
			</div>
		</div>
	);
};
