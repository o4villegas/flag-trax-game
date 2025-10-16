import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";

type AuthEnv = {
	DB: D1Database;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
};

export function createAuth(env: AuthEnv) {
	const db = drizzle(env.DB);

	return betterAuth({
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
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
	});
}
