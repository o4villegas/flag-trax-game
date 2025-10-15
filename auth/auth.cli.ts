import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/better-sqlite3";

const sqlite = new Database(
	".wrangler/state/v3/d1/miniflare-D1DatabaseObject/flag-capture-db.sqlite"
);
const db = drizzle(sqlite);

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // Update every 24 hours
	},
	secret: process.env.BETTER_AUTH_SECRET || "dummy-secret-for-cli",
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5173",
});
