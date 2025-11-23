import { ThemeToggle } from "./ThemeToggle";

export const Footer = () => {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="bg-sidebar border-t border-border p-4">
			<div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-text-muted">
				<div className="text-center sm:text-left">
					<a
						href="http://www.rpthreadtracker.com"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-primary transition-colors"
					>
						RPThreadTracker
					</a>{" "}
					&copy; {currentYear}{" "}
					<a
						href="http://blackjack-software.com"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-primary transition-colors"
					>
						Blackjack Software
					</a>
				</div>

				<div className="flex items-center gap-4">
					<ThemeToggle />
					<div>
						Support on{" "}
						<a
							href="https://www.patreon.com/bePatron?u=4797959"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-primary transition-colors"
						>
							Patreon
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
};
