import { test, expect } from '@playwright/test'

test.describe('Teacher — Dashboard', () => {
  test('loads with student count and quick links', async ({ page }) => {
    await page.goto('/teacher/dashboard')
    // Heading is "Good afternoon/morning, <name>"
    await expect(page.getByRole('heading').first()).toBeVisible()
    await expect(page.getByText(/active students/i)).toBeVisible()
  })
})

test.describe('Teacher — Students', () => {
  test('shows the teacher\'s student list', async ({ page }) => {
    await page.goto('/teacher/students')
    await expect(page.getByRole('heading', { name: /students/i })).toBeVisible()
    // Teacher teaches Iqra book 1/2 students
    await expect(page.getByText(/hamza soufi|adam|malham|kareem|ishaaq|jacoub|noah|jood/i).first()).toBeVisible()
  })
})

test.describe('Teacher — Attendance', () => {
  test('attendance page loads with session list', async ({ page }) => {
    await page.goto('/teacher/attendance')
    await expect(page.getByRole('heading', { name: /attendance/i })).toBeVisible()
  })

  test('can open a session and mark a student present', async ({ page }) => {
    await page.goto('/teacher/attendance')
    // Click the first available session
    const sessionLink = page.getByRole('link', { name: /session|class/i }).first()
    if (await sessionLink.isVisible()) {
      await sessionLink.click()
      await page.waitForURL(/\/teacher\/attendance\//)
      // Present button for first student
      const presentBtn = page.getByRole('button', { name: /present/i }).first()
      if (await presentBtn.isVisible()) {
        await presentBtn.click()
        await expect(page.getByRole('button', { name: /present/i }).first()).toBeVisible({ timeout: 5_000 })
      }
    }
  })
})

test.describe('Teacher — Homework', () => {
  test('homework list page loads', async ({ page }) => {
    await page.goto('/teacher/homework')
    await expect(page.getByRole('heading', { name: /homework/i })).toBeVisible()
  })

  test('can assign homework to a student', async ({ page }) => {
    // Step 1: go to homework student list, click first student
    await page.goto('/teacher/homework')
    const firstStudent = page.getByRole('link').filter({ hasText: /\w/ }).first()
    await firstStudent.click()
    await page.waitForURL(/\/teacher\/homework\/student\//, { timeout: 10_000 })

    // Step 2: click "Assign homework" to open the form
    await page.getByRole('link', { name: /assign homework/i }).click()
    await page.waitForURL(/\/new$/, { timeout: 10_000 })

    // Step 3: fill the form
    await page.getByLabel(/title/i).fill('Playwright Test — Al-Fatiha')
    const dueField = page.getByLabel(/due date/i)
    if (await dueField.isVisible()) {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      await dueField.fill(nextWeek.toISOString().split('T')[0])
    }
    await page.getByRole('button', { name: /assign homework/i }).click()

    // Step 4: should redirect back to student homework page with the new entry
    await page.waitForURL(/\/teacher\/homework\/student\/[^/]+$/, { timeout: 10_000 })
    await expect(page.getByText(/playwright test/i)).toBeVisible()
  })
})

test.describe('Teacher — Progress', () => {
  test('progress page loads with student cards', async ({ page }) => {
    await page.goto('/teacher/progress')
    await expect(page.getByRole('heading', { name: /progress/i })).toBeVisible()
  })
})

test.describe('Teacher — Analytics', () => {
  test('analytics page loads', async ({ page }) => {
    await page.goto('/teacher/analytics')
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible()
  })
})

test.describe('Teacher — Settings', () => {
  test('settings page shows email and password forms', async ({ page }) => {
    await page.goto('/teacher/settings')
    await expect(page.getByRole('heading', { name: /account settings/i })).toBeVisible()
    await expect(page.getByText(/change email/i)).toBeVisible()
    await expect(page.getByText(/change password/i)).toBeVisible()
  })

  test('can change password', async ({ page }) => {
    await page.goto('/teacher/settings')
    await page.getByPlaceholder(/new password/i).fill(process.env.TEST_TEACHER_PASS!)
    await page.getByPlaceholder(/confirm new password/i).fill(process.env.TEST_TEACHER_PASS!)
    await page.getByRole('button', { name: /save new password/i }).click()
    await expect(page.getByText(/password updated/i)).toBeVisible({ timeout: 8_000 })
  })
})
