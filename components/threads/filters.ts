import { ThreadStatusWithDetails } from "@/types/tumblr";

/**
 * Filter function type for thread tables
 */
export type ThreadFilterFunction = (
	thread: ThreadStatusWithDetails
) => boolean;

/**
 * Filter for "Your Turn" threads
 * Shows active threads where it's the calling character's turn (not queued)
 */
export const filterYourTurn: ThreadFilterFunction = (thread) => {
	return (
		!thread.isArchived &&
		thread.isCallingCharactersTurn === true &&
		thread.isQueued !== true
	);
};

/**
 * Filter for "Their Turn" threads
 * Shows active threads where it's the partner's turn (not queued)
 */
export const filterTheirTurn: ThreadFilterFunction = (thread) => {
	return (
		!thread.isArchived &&
		thread.isCallingCharactersTurn === false &&
		thread.isQueued !== true
	);
};

/**
 * Filter for "Queued" threads
 * Shows active threads that are marked as queued
 */
export const filterQueued: ThreadFilterFunction = (thread) => {
	return !thread.isArchived && thread.isQueued === true;
};

/**
 * Filter for "All Threads"
 * Shows all active (non-archived) threads
 */
export const filterAll: ThreadFilterFunction = (thread) => {
	return !thread.isArchived;
};

/**
 * Filter for "Archived" threads
 * Shows only archived threads
 */
export const filterArchived: ThreadFilterFunction = (thread) => {
	return thread.isArchived;
};
