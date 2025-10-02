import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 180 * 1000,  
  fullyParallel: false, 
  retries: 1, 
  reporter: [
    ['html'],
    ['list'], 
    ['json', { outputFile: 'test-results.json' }] 
  ],
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 30 * 1000,
    navigationTimeout: 60 * 1000, 
    trace: 'on-first-retry',
    video: 'retain-on-failure', 
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  
  projects: [
    {
      name: 'WhatsApp Tests',
      testMatch: '**/*.spec.ts',
      use: {
        ...require('@playwright/test').devices['Desktop Chrome'],
        headless: false,
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-blink-features=AutomationControlled',
            '--no-first-run',
            '--disable-extensions-except=',
            '--disable-extensions',
            '--disable-default-apps',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        }
      }
    }
  ],
a
  globalSetup: require.resolve('./global-setup.ts'),
  outputDir: 'test-results/',
  webServer: {
    command: 'npx playwright show-report',
    port: 9323,
    reuseExistingServer: !process.env.CI
  }
});
