interface ThreadStatusBadgeProps {
	isArchived: boolean;
	isQueued?: boolean;
	isCallingCharactersTurn?: boolean;
}

export const ThreadStatusBadge = ({
	isArchived,
	isQueued,
	isCallingCharactersTurn,
}: ThreadStatusBadgeProps) => {
	// Determine badge color and label based on thread status
	let colorClass: string;
	let label: string;

	if (isArchived) {
		colorClass = "bg-gray-500/20 text-gray-400 border-gray-500/30";
		label = "Archived";
	} else if (isQueued === true) {
		colorClass = "bg-blue-500/20 text-blue-400 border-blue-500/30";
		label = "Queued";
	} else if (isCallingCharactersTurn === true) {
		colorClass = "bg-green-500/20 text-green-400 border-green-500/30";
		label = "Your Turn";
	} else if (isCallingCharactersTurn === false) {
		colorClass = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
		label = "Their Turn";
	} else {
		// No Tumblr data available
		colorClass = "bg-gray-500/20 text-gray-400 border-gray-500/30";
		label = "No Data";
	}

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${colorClass}`}
		>
			{label}
		</span>
	);
};
