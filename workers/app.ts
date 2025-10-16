import { Hono } from "hono";
import type { Context, Next } from "hono";
import { createRequestHandler } from "react-router";
import { createAuth } from "../auth/auth.server";
import { drizzle } from "drizzle-orm/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { user, session, flagRequests, flags, captures } from "../db/schema";
import { eq, desc, max, and } from "drizzle-orm";

type Env = {
	DB: D1Database;
	PHOTOS: R2Bucket;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	ADMIN_EMAIL: string;
};

type Variables = {
	auth: ReturnType<typeof createAuth>;
	db: DrizzleD1Database;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Initialize auth and db on each request
app.use("*", async (c, next) => {
	c.set("auth", createAuth(c.env));
	c.set("db", drizzle(c.env.DB));
	await next();
});

// Mount Better Auth routes
app.on(["POST", "GET"], "/api/auth/*", async (c) => {
	const auth = c.get("auth");
	return auth.handler(c.req.raw);
});

// ============================================================================
// PHOTO UPLOAD ROUTE
// ============================================================================

app.post("/api/photos", async (c) => {
	const auth = c.get("auth");
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const formData = await c.req.formData();
		const file = formData.get("photo") as File;

		if (!file) {
			return c.json({ error: "No photo provided" }, 400);
		}

		// Generate unique filename
		const timestamp = Date.now();
		const randomId = Math.random().toString(36).substring(2, 15);
		const extension = file.name.split(".").pop() || "jpg";
		const filename = `${session.user.id}-${timestamp}-${randomId}.${extension}`;

		// Upload to R2
		await c.env.PHOTOS.put(filename, file.stream(), {
			httpMetadata: {
				contentType: file.type,
			},
		});

		// Return URL (adjust based on your R2 public URL setup)
		const photoUrl = `/photos/${filename}`;

		return c.json({ photoUrl });
	} catch (error) {
		console.error("Photo upload error:", error);
		return c.json({ error: "Failed to upload photo" }, 500);
	}
});

// ============================================================================
// FLAG REQUEST ROUTES
// ============================================================================

app.post("/api/flag-requests", async (c) => {
	const auth = c.get("auth");
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = c.get("db");

	try {
		// Check if user already has a pending request
		const existingRequest = await db
			.select()
			.from(flagRequests)
			.where(
				and(
					eq(flagRequests.userId, session.user.id),
					eq(flagRequests.status, "pending")
				)
			)
			.limit(1);

		if (existingRequest.length > 0) {
			return c.json(
				{ error: "You already have a pending flag request" },
				400
			);
		}

		// Create new flag request
		const result = await db
			.insert(flagRequests)
			.values({
				userId: session.user.id,
			})
			.returning();

		return c.json({ request: result[0] });
	} catch (error) {
		console.error("Flag request error:", error);
		return c.json({ error: "Failed to create flag request" }, 500);
	}
});

app.get("/api/flag-requests", async (c) => {
	const auth = c.get("auth");
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = c.get("db");

	try {
		const requests = await db
			.select()
			.from(flagRequests)
			.where(eq(flagRequests.userId, session.user.id))
			.orderBy(desc(flagRequests.requestedAt));

		return c.json({ requests });
	} catch (error) {
		console.error("Get flag requests error:", error);
		return c.json({ error: "Failed to get flag requests" }, 500);
	}
});

// ============================================================================
// FLAG ROUTES
// ============================================================================

app.get("/api/flags/:flagNumber", async (c) => {
	const auth = c.get("auth");
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const flagNumber = parseInt(c.req.param("flagNumber"));
	const db = c.get("db");

	try {
		const flagData = await db
			.select({
				flag: flags,
				currentOwner: user,
			})
			.from(flags)
			.leftJoin(user, eq(flags.currentOwnerId, user.id))
			.where(eq(flags.flagNumber, flagNumber))
			.limit(1);

		if (flagData.length === 0) {
			return c.json({ error: "Flag not found" }, 404);
		}

		// Get capture history
		const captureHistory = await db
			.select({
				capture: captures,
				capturedBy: user,
			})
			.from(captures)
			.leftJoin(user, eq(captures.capturedByUserId, user.id))
			.where(eq(captures.flagId, flagData[0].flag.id))
			.orderBy(desc(captures.capturedAt));

		return c.json({
			flag: flagData[0].flag,
			currentOwner: flagData[0].currentOwner,
			captureHistory,
		});
	} catch (error) {
		console.error("Get flag error:", error);
		return c.json({ error: "Failed to get flag" }, 500);
	}
});

app.get("/api/flags/mine", async (c) => {
	const auth = c.get("auth");
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = c.get("db");

	try {
		const userFlags = await db
			.select()
			.from(flags)
			.where(eq(flags.currentOwnerId, session.user.id))
			.orderBy(desc(flags.lastCapturedAt));

		return c.json({ flags: userFlags });
	} catch (error) {
		console.error("Get my flags error:", error);
		return c.json({ error: "Failed to get flags" }, 500);
	}
});

// ============================================================================
// CAPTURE ROUTES
// ============================================================================

app.post("/api/captures", async (c) => {
	const auth = c.get("auth");
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = c.get("db");

	try {
		const body = await c.req.json();
		const { flagNumber, capturedAt, notes, photoUrl } = body;

		if (!flagNumber || !capturedAt) {
			return c.json(
				{ error: "flagNumber and capturedAt are required" },
				400
			);
		}

		// Use transaction for atomic capture
		const result = await db.transaction(async (tx) => {
			// 1. Get flag
			const flagData = await tx
				.select()
				.from(flags)
				.where(eq(flags.flagNumber, parseInt(flagNumber)))
				.limit(1);

			if (flagData.length === 0) {
				throw new Error("Flag not found");
			}

			const flag = flagData[0];

			// 2. Check if user is trying to capture own flag
			if (flag.currentOwnerId === session.user.id) {
				throw new Error("You cannot capture your own flag");
			}

			// 3. Create capture record
			const capture = await tx
				.insert(captures)
				.values({
					flagId: flag.id,
					capturedByUserId: session.user.id,
					capturedAt,
					notes,
					photoUrl,
				})
				.returning();

			// 4. Update flag ownership
			await tx
				.update(flags)
				.set({
					currentOwnerId: session.user.id,
					lastCapturedAt: capturedAt,
				})
				.where(eq(flags.id, flag.id));

			return { capture: capture[0], flagNumber: flag.flagNumber };
		});

		return c.json(result);
	} catch (error) {
		console.error("Capture error:", error);
		if (error instanceof Error) {
			return c.json({ error: error.message }, 400);
		}
		return c.json({ error: "Failed to record capture" }, 500);
	}
});

app.get("/api/captures/:flagId", async (c) => {
	const auth = c.get("auth");
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const flagId = parseInt(c.req.param("flagId"));
	const db = c.get("db");

	try {
		const captureHistory = await db
			.select({
				capture: captures,
				capturedBy: user,
			})
			.from(captures)
			.leftJoin(user, eq(captures.capturedByUserId, user.id))
			.where(eq(captures.flagId, flagId))
			.orderBy(desc(captures.capturedAt));

		return c.json({ captures: captureHistory });
	} catch (error) {
		console.error("Get captures error:", error);
		return c.json({ error: "Failed to get captures" }, 500);
	}
});

// ============================================================================
// STATS ROUTES
// ============================================================================

app.get("/api/stats/me", async (c) => {
	const auth = c.get("auth");
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = c.get("db");

	try {
		// Count flags currently owned
		const ownedFlags = await db
			.select()
			.from(flags)
			.where(eq(flags.currentOwnerId, session.user.id));

		// Count total captures made by user
		const totalCaptures = await db
			.select()
			.from(captures)
			.where(eq(captures.capturedByUserId, session.user.id));

		// Count flags originally requested by user
		const requestedFlags = await db
			.select()
			.from(flags)
			.where(eq(flags.originalRequesterId, session.user.id));

		return c.json({
			stats: {
				flagsOwned: ownedFlags.length,
				totalCaptures: totalCaptures.length,
				flagsRequested: requestedFlags.length,
			},
		});
	} catch (error) {
		console.error("Get stats error:", error);
		return c.json({ error: "Failed to get stats" }, 500);
	}
});

// ============================================================================
// ADMIN ROUTES
// ============================================================================

// Admin middleware
const adminOnly = async (
	c: Context<{ Bindings: Env; Variables: Variables }>,
	next: Next
) => {
	const auth = c.get("auth");
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session || session.user.email !== c.env.ADMIN_EMAIL) {
		return c.json({ error: "Forbidden" }, 403);
	}

	await next();
};

app.get("/api/admin/flag-requests", adminOnly, async (c) => {
	const db = c.get("db");

	try {
		const requests = await db
			.select({
				request: flagRequests,
				requestedBy: user,
			})
			.from(flagRequests)
			.leftJoin(user, eq(flagRequests.userId, user.id))
			.orderBy(desc(flagRequests.requestedAt));

		return c.json({ requests });
	} catch (error) {
		console.error("Get admin flag requests error:", error);
		return c.json({ error: "Failed to get flag requests" }, 500);
	}
});

app.post("/api/admin/flag-requests/:id/approve", adminOnly, async (c) => {
	const requestId = parseInt(c.req.param("id"));
	const db = c.get("db");

	try {
		// Use transaction for atomic flag approval
		const result = await db.transaction(async (tx) => {
			// 1. Verify request exists and is pending
			const request = await tx
				.select()
				.from(flagRequests)
				.where(eq(flagRequests.id, requestId))
				.limit(1);

			if (request.length === 0) {
				throw new Error("Request not found");
			}

			if (request[0].status !== "pending") {
				throw new Error("Request is not pending");
			}

			// 2. Get next flag number atomically
			const maxFlag = await tx
				.select({ max: max(flags.flagNumber) })
				.from(flags);

			const nextFlagNumber = (maxFlag[0]?.max ?? 0) + 1;

			// 3. Create flag
			await tx.insert(flags).values({
				flagNumber: nextFlagNumber,
				currentOwnerId: request[0].userId,
				originalRequesterId: request[0].userId,
			});

			// 4. Update request status
			await tx
				.update(flagRequests)
				.set({
					status: "approved",
					processedAt: new Date().toISOString(),
					processedByAdminEmail: c.env.ADMIN_EMAIL,
				})
				.where(eq(flagRequests.id, requestId));

			return { flagNumber: nextFlagNumber };
		});

		return c.json(result);
	} catch (error) {
		console.error("Approve request error:", error);
		if (error instanceof Error) {
			return c.json({ error: error.message }, 400);
		}
		return c.json({ error: "Failed to approve request" }, 500);
	}
});

app.post("/api/admin/flag-requests/:id/reject", adminOnly, async (c) => {
	const requestId = parseInt(c.req.param("id"));
	const db = c.get("db");

	try {
		const request = await db
			.select()
			.from(flagRequests)
			.where(eq(flagRequests.id, requestId))
			.limit(1);

		if (request.length === 0) {
			return c.json({ error: "Request not found" }, 404);
		}

		if (request[0].status !== "pending") {
			return c.json({ error: "Request is not pending" }, 400);
		}

		await db
			.update(flagRequests)
			.set({
				status: "rejected",
				processedAt: new Date().toISOString(),
				processedByAdminEmail: c.env.ADMIN_EMAIL,
			})
			.where(eq(flagRequests.id, requestId));

		return c.json({ success: true });
	} catch (error) {
		console.error("Reject request error:", error);
		return c.json({ error: "Failed to reject request" }, 500);
	}
});

app.get("/api/admin/flags", adminOnly, async (c) => {
	const db = c.get("db");

	try {
		const allFlags = await db
			.select({
				flag: flags,
				currentOwner: user,
			})
			.from(flags)
			.leftJoin(user, eq(flags.currentOwnerId, user.id))
			.orderBy(desc(flags.flagNumber));

		return c.json({ flags: allFlags });
	} catch (error) {
		console.error("Get admin flags error:", error);
		return c.json({ error: "Failed to get flags" }, 500);
	}
});

app.delete("/api/admin/flags/:id", adminOnly, async (c) => {
	const flagId = parseInt(c.req.param("id"));
	const db = c.get("db");

	try {
		// Delete flag (captures will cascade due to foreign key constraint)
		await db.delete(flags).where(eq(flags.id, flagId));

		return c.json({ success: true });
	} catch (error) {
		console.error("Delete flag error:", error);
		return c.json({ error: "Failed to delete flag" }, 500);
	}
});

app.get("/api/admin/captures", adminOnly, async (c) => {
	const db = c.get("db");

	try {
		const allCaptures = await db
			.select({
				capture: captures,
				capturedBy: user,
				flag: flags,
			})
			.from(captures)
			.leftJoin(user, eq(captures.capturedByUserId, user.id))
			.leftJoin(flags, eq(captures.flagId, flags.id))
			.orderBy(desc(captures.capturedAt));

		return c.json({ captures: allCaptures });
	} catch (error) {
		console.error("Get admin captures error:", error);
		return c.json({ error: "Failed to get captures" }, 500);
	}
});

app.delete("/api/admin/captures/:id", adminOnly, async (c) => {
	const captureId = parseInt(c.req.param("id"));
	const db = c.get("db");

	try {
		// Use transaction for atomic capture deletion with ownership reversion
		await db.transaction(async (tx) => {
			// 1. Get capture to find flag
			const capture = await tx
				.select()
				.from(captures)
				.where(eq(captures.id, captureId))
				.limit(1);

			if (capture.length === 0) {
				throw new Error("Capture not found");
			}

			// 2. Delete capture
			await tx.delete(captures).where(eq(captures.id, captureId));

			// 3. Find previous capture
			const previousCapture = await tx
				.select()
				.from(captures)
				.where(eq(captures.flagId, capture[0].flagId))
				.orderBy(desc(captures.capturedAt))
				.limit(1);

			// 4. Update flag ownership
			if (previousCapture.length > 0) {
				// Revert to previous capturer
				await tx
					.update(flags)
					.set({
						currentOwnerId: previousCapture[0].capturedByUserId,
						lastCapturedAt: previousCapture[0].capturedAt,
					})
					.where(eq(flags.id, capture[0].flagId));
			} else {
				// Revert to original requester
				const flag = await tx
					.select()
					.from(flags)
					.where(eq(flags.id, capture[0].flagId))
					.limit(1);

				if (flag.length > 0) {
					await tx
						.update(flags)
						.set({
							currentOwnerId: flag[0].originalRequesterId,
							lastCapturedAt: null,
						})
						.where(eq(flags.id, capture[0].flagId));
				}
			}
		});

		return c.json({ success: true });
	} catch (error) {
		console.error("Delete capture error:", error);
		if (error instanceof Error) {
			return c.json({ error: error.message }, 400);
		}
		return c.json({ error: "Failed to delete capture" }, 500);
	}
});

// ============================================================================
// PHOTO SERVING ROUTE
// ============================================================================

app.get("/photos/:filename", async (c) => {
	const filename = c.req.param("filename");

	try {
		const object = await c.env.PHOTOS.get(filename);

		if (!object) {
			return c.text("Photo not found", 404);
		}

		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set("etag", object.httpEtag);
		headers.set("cache-control", "public, max-age=31536000, immutable");

		return new Response(object.body, { headers });
	} catch (error) {
		console.error("Photo serve error:", error);
		return c.text("Failed to serve photo", 500);
	}
});

// ============================================================================
// REACT ROUTER CATCH-ALL (MUST BE LAST)
// ============================================================================

app.get("*", (c) => {
	const requestHandler = createRequestHandler(
		() => import("virtual:react-router/server-build"),
		import.meta.env.MODE
	);

	return requestHandler(c.req.raw, {
		cloudflare: { env: c.env, ctx: c.executionCtx },
	});
});

export default app;
