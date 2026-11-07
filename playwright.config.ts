import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,       // run sequentially — we share one Supabase DB
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Setup: save auth state for each role
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
      testMatch: /admin\.spec\.ts/,
    },
    {
      name: 'teacher',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/teacher.json',
      },
      dependencies: ['setup'],
      testMatch: /teacher\.spec\.ts/,
    },
    {
      name: 'student',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/student.json',
      },
      dependencies: ['setup'],
      testMatch: /student\.spec\.ts/,
    },
  ],

  // Start Next.js dev server automatically before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
