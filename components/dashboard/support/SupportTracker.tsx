"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDollarSign } from "@fortawesome/free-solid-svg-icons";

export const SupportTracker = () => {
	return (
		<div className="bg-surface border border-border rounded-lg shadow-sm h-[230px] flex flex-col">
			{/* Header */}
			<div className="px-4 py-3 border-b-2 border-primary bg-linear-to-r from-primary/5 to-transparent">
				<h2 className="text-lg font-semibold flex items-center gap-2">
					<FontAwesomeIcon icon={faDollarSign} className="w-4 h-4 text-primary" />
					<span>Support Tracker Development</span>
				</h2>
			</div>

			{/* Body */}
			<div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
				<p className="text-text-muted">
					RPThreadTracker is always free, but user support helps keep it running!
				</p>

				<a
					href="https://www.paypal.com/donate/?business=MUTFLWGEW8Y52&no_recurring=0&item_name=Thank+you+for+supporting+my+app+development+and+helping+keep+my+apps+free%21&currency_code=USD"
					target="_blank"
					rel="noopener noreferrer"
					className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors inline-flex items-center gap-2"
				>
					<FontAwesomeIcon icon={faDollarSign} className="w-4 h-4" />
					Donate via PayPal
				</a>

				<p className="text-xs text-text-muted">Thank you for your support!</p>
			</div>
		</div>
	);
};
