import { test, expect, Page } from '@playwright/test';

// Constants untuk data test
const TEST_DATA = {
  baseUrl: 'https://staging.onebox.co.id',
  credentials: {
    email: 'dinni@ciptadrasoft.com',
    password: 'Dingirl_9a#'
  },
  testMessage: 'selamat pagi'
};

class LoginPage {
  private page: Page
  public emailInput;
  public passwordInput;
  public loginButton;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Masuk' });
  }

  async goto() {
    await this.page.goto(`${TEST_DATA.baseUrl}/Login`);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

class DashboardPage {
  private page: Page;
  public messageTextbox;
  public sendButton;

  constructor(page: Page) {
    this.page = page;
    this.messageTextbox = page.locator('[id^="container-summernote"]').getByRole('textbox');
    this.sendButton = page.getByRole('button', { name: 'Send' });
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async selectConversation(conversationName: string) {
    await this.page.getByRole('link', { name: conversationName }).click();
  }

  async sendMessage(message: string) {
    await this.messageTextbox.fill(message);
    await this.sendButton.click();
  }
}

test.describe('OneBox Messaging Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('should login and send message successfully', async ({ page }) => {
    // Step 1: Navigate to login page
    await loginPage.goto();
    
    // Step 2: Verify login page loaded by checking actual title and key elements
    await expect(page).toHaveTitle(/Onebox.*Cloud/i);
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    
    // Step 3: Perform login
    await loginPage.login(TEST_DATA.credentials.email, TEST_DATA.credentials.password);
    
    // Step 4: Wait for dashboard to load
    await dashboardPage.waitForLoad();
    
    // Step 5: Verify successful login by checking URL contains expected path
    await expect(page).toHaveURL(/\/(?!Login)/i);
    
    // Step 6: Select conversation (gunakan selector yang lebih spesifik)
    await dashboardPage.selectConversation('jssnnnnn. -');
    
    // Step 7: Wait for conversation to load
    await page.waitForTimeout(2000); 
    
    // Step 8: Send message
    await dashboardPage.sendMessage(TEST_DATA.testMessage);
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await loginPage.goto();
    
    await loginPage.login('invalid@email.com', 'wrongpassword');
    
    // Verify error message appears
    await expect(page.locator('text=Invalid')).toBeVisible();
  });

  test('should validate required fields on login', async ({ page }) => {
    await loginPage.goto();
    
    // Try to login without filling fields
    await loginPage.loginButton.click();
    
    // Verify validation messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });
});

// Utility functions untuk reusable actions
export class TestUtils {
  static async waitForElement(page: Page, selector: string, timeout = 5000) {
    await page.waitForSelector(selector, { timeout });
  }

  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `screenshots/${name}-${Date.now()}.png` });
  }

  static async clearAndFill(page: Page, selector: string, text: string) {
    await page.fill(selector, '');
    await page.fill(selector, text);
  }
}