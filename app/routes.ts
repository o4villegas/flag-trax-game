import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	// Public routes
	index("routes/home.tsx"),
	route("sign-in", "routes/auth/sign-in.tsx"),
	route("sign-up", "routes/auth/sign-up.tsx"),

	// Protected routes (will add auth checks in loaders later)
	route("request-flag", "routes/request-flag.tsx"),
	route("my-stats", "routes/my-stats.tsx"),
	route("flag/:flagNumber", "routes/flag.tsx"),
	route("capture-success/:flagNumber", "routes/capture-success.tsx"),

	// Admin routes (will add admin checks in loaders later)
	route("admin", "routes/admin/dashboard.tsx"),
] satisfies RouteConfig;
