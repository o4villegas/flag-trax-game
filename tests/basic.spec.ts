import { test, expect } from "@playwright/test";

test.describe("Flag Capture Game - Basic Smoke Tests", () => {
	test("homepage loads successfully", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("h1")).toContainText("Flag Capture Game");
	});

	test("sign-in page is accessible", async ({ page }) => {
		await page.goto("/sign-in");
		await expect(page.locator("h2")).toContainText("Sign In");
		await expect(page.getByLabel("Email")).toBeVisible();
		await expect(page.getByLabel("Password")).toBeVisible();
	});

	test("sign-up page is accessible", async ({ page }) => {
		await page.goto("/sign-up");
		await expect(page.locator("h2")).toContainText("Sign Up");
		await expect(page.getByLabel("Name")).toBeVisible();
		await expect(page.getByLabel("Email")).toBeVisible();
	});

	test("navigation shows sign in/up for unauthenticated users", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible();
	});

	test("can navigate to sign-up from homepage", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("link", { name: "Get Started" }).first().click();
		await expect(page).toHaveURL("/sign-up");
	});

	test("can navigate between sign-in and sign-up", async ({ page }) => {
		await page.goto("/sign-in");
		await page.getByRole("link", { name: "Sign up" }).click();
		await expect(page).toHaveURL("/sign-up");

		await page.getByRole("link", { name: "Sign in" }).click();
		await expect(page).toHaveURL("/sign-in");
	});

	test("protected routes redirect to sign-in", async ({ page }) => {
		await page.goto("/request-flag");
		await expect(page).toHaveURL("/sign-in");

		await page.goto("/my-stats");
		await expect(page).toHaveURL("/sign-in");

		await page.goto("/admin");
		await expect(page).toHaveURL("/");
	});
});

test.describe("Flag Capture Game - Authentication Flow", () => {
	test("can create account and sign in", async ({ page }) => {
		const timestamp = Date.now();
		const testEmail = `test-${timestamp}@example.com`;
		const testPassword = "test-password-123";
		const testName = `Test User ${timestamp}`;

		// Sign up
		await page.goto("/sign-up");
		await page.getByLabel("Name").fill(testName);
		await page.getByLabel("Email").fill(testEmail);
		await page.getByLabel("Password").first().fill(testPassword);
		await page.getByLabel("Confirm Password").fill(testPassword);
		await page.getByRole("button", { name: "Sign Up" }).click();

		// Should redirect to home after successful signup
		await expect(page).toHaveURL("/", { timeout: 10000 });

		// Should see user name in navigation
		await expect(page.locator("nav")).toContainText(testName);
	});

	test("sign up shows error for mismatched passwords", async ({ page }) => {
		await page.goto("/sign-up");
		await page.getByLabel("Name").fill("Test User");
		await page.getByLabel("Email").fill("test@example.com");
		await page.getByLabel("Password").first().fill("password123");
		await page.getByLabel("Confirm Password").fill("different-password");
		await page.getByRole("button", { name: "Sign Up" }).click();

		// Should show error toast
		await expect(page.locator("text=Passwords do not match")).toBeVisible();
	});

	test("sign up shows error for short password", async ({ page }) => {
		await page.goto("/sign-up");
		await page.getByLabel("Name").fill("Test User");
		await page.getByLabel("Email").fill("test@example.com");
		await page.getByLabel("Password").first().fill("short");
		await page.getByLabel("Confirm Password").fill("short");
		await page.getByRole("button", { name: "Sign Up" }).click();

		// Should show error toast
		await expect(
			page.locator("text=Password must be at least 8 characters")
		).toBeVisible();
	});
});
