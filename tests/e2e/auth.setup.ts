/**
 * Auth setup — runs once before the test suites.
 * Logs in as each role and saves browser storage state so
 * every spec file starts already authenticated.
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL!;
const ADMIN_PASS = process.env.TEST_ADMIN_PASS!;
const TEACHER_EMAIL = process.env.TEST_TEACHER_EMAIL!;
const TEACHER_PASS = process.env.TEST_TEACHER_PASS!;
const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL!;
const STUDENT_PASS = process.env.TEST_STUDENT_PASS!;

async function loginAs(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  expectedPath: string,
) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Hard navigation (window.location.href) can be slow on first dev-server load
  await page.waitForURL(`**${expectedPath}**`, { timeout: 45_000 });
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(new RegExp(expectedPath));
}

setup("authenticate as admin", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS, "/admin/dashboard");
  await page.context().storageState({ path: "tests/e2e/.auth/admin.json" });
});

setup("authenticate as teacher", async ({ page }) => {
  await loginAs(page, TEACHER_EMAIL, TEACHER_PASS, "/teacher/dashboard");
  await page.context().storageState({ path: "tests/e2e/.auth/teacher.json" });
});

setup("authenticate as student", async ({ page }) => {
  await loginAs(page, STUDENT_EMAIL, STUDENT_PASS, "/student/dashboard");
  await page.context().storageState({ path: "tests/e2e/.auth/student.json" });
});
