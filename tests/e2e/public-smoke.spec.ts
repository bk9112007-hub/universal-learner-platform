import { test, expect } from "@playwright/test";

test("public homepage smoke", async ({ page }) => {
  test.skip(!process.env.E2E_BASE_URL, "Set E2E_BASE_URL to run browser smoke tests against a live app.");

  await page.goto("/");
  await expect(page.getByText("Universal Learner")).toBeVisible();
});
