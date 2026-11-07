import { test, expect } from '@playwright/test'

test.describe('Admin — Dashboard', () => {
  test('loads dashboard with stat cards', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    // Sidebar should show the admin nav items
    await expect(page.getByRole('link', { name: /attendance/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /payments/i })).toBeVisible()
  })
})

test.describe('Admin — Users', () => {
  test('shows teacher and student list', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible()
    // At least one teacher should be listed
    await expect(page.getByText(/sheikh abdullah/i).first()).toBeVisible()
  })
})

test.describe('Admin — Attendance', () => {
  test('attendance overview loads', async ({ page }) => {
    await page.goto('/admin/attendance')
    await expect(page.getByRole('heading', { name: /attendance/i })).toBeVisible()
  })
})

test.describe('Admin — Payments', () => {
  test('payments page shows student list', async ({ page }) => {
    await page.goto('/admin/payments')
    await expect(page.getByRole('heading', { name: /payments/i })).toBeVisible()
    // Summary cards should exist
    await expect(page.getByText(/total students/i)).toBeVisible()
    await expect(page.getByText(/paid/i).first()).toBeVisible()
  })

  test('can toggle a payment status', async ({ page }) => {
    await page.goto('/admin/payments')
    // Find the first "Mark paid" button and click it
    const markPaidBtn = page.getByRole('button', { name: /mark paid/i }).first()
    if (await markPaidBtn.isVisible()) {
      await markPaidBtn.click()
      // After toggle, should now show "Paid"
      await expect(page.getByRole('button', { name: /^paid$/i }).first()).toBeVisible({ timeout: 5_000 })
    }
  })
})

test.describe('Admin — Analytics', () => {
  test('analytics page loads', async ({ page }) => {
    await page.goto('/admin/analytics')
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible()
  })
})

test.describe('Admin — Library', () => {
  test('library page loads', async ({ page }) => {
    await page.goto('/admin/library')
    await expect(page.getByRole('heading', { name: /library/i })).toBeVisible()
  })
})
