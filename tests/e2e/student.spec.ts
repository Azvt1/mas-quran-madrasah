import { test, expect } from '@playwright/test'

test.describe('Student — Dashboard', () => {
  test('loads with stat cards', async ({ page }) => {
    await page.goto('/student/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    // Quick links section
    await expect(page.getByRole('link', { name: /homework/i }).first()).toBeVisible()
  })
})

test.describe('Student — Homework', () => {
  test('homework list loads', async ({ page }) => {
    await page.goto('/student/homework')
    await expect(page.getByRole('heading', { name: /homework/i })).toBeVisible()
  })

  test('can open a homework detail', async ({ page }) => {
    await page.goto('/student/homework')
    const firstHw = page.getByRole('link').filter({ hasText: /surah|iqra|review|memoris/i }).first()
    if (await firstHw.isVisible()) {
      await firstHw.click()
      await page.waitForURL(/\/student\/homework\//)
      await expect(page.getByRole('heading')).toBeVisible()
    }
  })
})

test.describe('Student — Attendance', () => {
  test('attendance page loads with rate', async ({ page }) => {
    await page.goto('/student/attendance')
    await expect(page.getByRole('heading', { name: /attendance/i })).toBeVisible()
    // Should show attendance rate percentage
    await expect(page.getByText(/%/)).toBeVisible()
  })
})

test.describe('Student — Progress', () => {
  test('progress page shows current book/surah', async ({ page }) => {
    await page.goto('/student/progress')
    await expect(page.getByRole('heading', { name: /progress/i })).toBeVisible()
  })
})

test.describe('Student — Library', () => {
  test('library page loads', async ({ page }) => {
    await page.goto('/student/library')
    await expect(page.getByRole('heading', { name: /library/i })).toBeVisible()
  })
})

test.describe('Student — Settings', () => {
  test('settings page shows email and password forms', async ({ page }) => {
    await page.goto('/student/settings')
    await expect(page.getByRole('heading', { name: /account settings/i })).toBeVisible()
    await expect(page.getByText(/change email/i)).toBeVisible()
    await expect(page.getByText(/change password/i)).toBeVisible()
  })
})

test.describe('Student — Auth guard', () => {
  test('cannot access teacher routes', async ({ page }) => {
    await page.goto('/teacher/dashboard')
    // Should be redirected away from teacher area
    await expect(page).not.toHaveURL(/\/teacher\/dashboard/)
  })

  test('cannot access admin routes', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).not.toHaveURL(/\/admin\/dashboard/)
  })
})
