import type { Config } from "drizzle-kit";

export default {
	schema: "./db/schema.ts",
	out: "./migrations",
	dialect: "sqlite",
	driver: "d1-http",
	dbCredentials: {
		wranglerConfigPath: "./wrangler.jsonc",
		dbName: "flag-capture-db",
	},
} satisfies Config;
