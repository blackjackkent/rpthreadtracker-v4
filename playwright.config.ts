import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";

// .env.test.local wins over .env.local — put TEST_DATABASE_URL etc. there
dotenv.config({ path: path.resolve(__dirname, ".env.test.local") });
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const testDbUrl = process.env.TEST_DATABASE_URL;

export default defineConfig({
	testDir: "./tests/e2e",

	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,

	reporter: "html",

	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},

	globalSetup: "./tests/global-setup.ts",
	globalTeardown: "./tests/global-teardown.ts",

	projects: [
		{
			name: "setup",
			testMatch: /.*\.setup\.ts/,
		},
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				storageState: "tests/.auth/user.json",
			},
			dependencies: ["setup"],
		},
	],

	webServer: {
		command: "npm run dev",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
		// Override DATABASE_URL so the dev server hits the test DB
		env: {
			...(testDbUrl ? { DATABASE_URL: testDbUrl } : {}),
			NEXTAUTH_URL: "http://localhost:3000",
			// Dummy Tumblr vars — real calls are mocked via page.route()
			TUMBLR_CONSUMER_KEY: process.env.TUMBLR_CONSUMER_KEY ?? "test",
			TUMBLR_CONSUMER_SECRET: process.env.TUMBLR_CONSUMER_SECRET ?? "test",
			TUMBLR_OAUTH_TOKEN: process.env.TUMBLR_OAUTH_TOKEN ?? "test",
			TUMBLR_OAUTH_SECRET: process.env.TUMBLR_OAUTH_SECRET ?? "test",
		},
	},
});
