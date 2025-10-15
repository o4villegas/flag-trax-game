import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Import and re-export Better Auth tables
import { user, session, account, verification } from "../auth-schema";
export { user, session, account, verification };

// Flag Requests table
export const flagRequests = sqliteTable("flag_requests", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: text("user_id").notNull().references(() => user.id),
	status: text("status", { enum: ["pending", "approved", "rejected"] })
		.default("pending")
		.notNull(),
	requestedAt: text("requested_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	processedAt: text("processed_at"),
	processedByAdminEmail: text("processed_by_admin_email"),
});

// Flags table
export const flags = sqliteTable("flags", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	flagNumber: integer("flag_number").notNull().unique(),
	currentOwnerId: text("current_owner_id")
		.notNull()
		.references(() => user.id),
	originalRequesterId: text("original_requester_id")
		.notNull()
		.references(() => user.id),
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	lastCapturedAt: text("last_captured_at"),
});

// Captures table
export const captures = sqliteTable("captures", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	flagId: integer("flag_id")
		.notNull()
		.references(() => flags.id, { onDelete: "cascade" }),
	capturedByUserId: text("captured_by_user_id")
		.notNull()
		.references(() => user.id),
	capturedAt: text("captured_at").notNull(),
	notes: text("notes"),
	photoUrl: text("photo_url"),
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});
