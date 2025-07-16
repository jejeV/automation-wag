import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Setup authentication helper
async function setupWhatsAppAuth(browser: any, testInfo: any) {
  const fileName = path.join(testInfo.project.outputDir, 'whatsapp-state.json');
  
  // Use existing session if available
  if (fs.existsSync(fileName)) {
    console.log('✔ Menggunakan session yang tersimpan');
    return fileName;
  }

  // Create new session if first run
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('https://web.whatsapp.com/', { 
      timeout: 120000,
      waitUntil: 'domcontentloaded'
    });
    
    // Wait for QR code with better error handling
    try {
      await page.locator('canvas').first().waitFor({ 
        state: 'visible',
        timeout: 120000 
      });
      console.log('➡️ Silakan scan QR code untuk login pertama kali...');
    } catch (error) {
      // QR code might not appear if already logged in
      console.log('QR code tidak ditemukan, mungkin sudah login');
    }
    
    // Wait for successful login using selector-based approach
    await Promise.race([
      page.waitForSelector('div[role="list"]', { timeout: 120000 }), // Chat list
      page.waitForSelector('div[data-testid="chat-list"]', { timeout: 120000 }), // Alternative chat list
      page.waitForSelector('div[contenteditable="true"][data-tab="3"]', { timeout: 120000 }), // Search box
      page.waitForSelector('span:has-text("Chats")', { timeout: 120000 }), // Chats text
      page.waitForSelector('span:has-text("Percakapan")', { timeout: 120000 }) // Indonesian Chats text
    ]);
    console.log('✔ Login berhasil');
    
    // Save session state
    await context.storageState({ path: fileName });
    return fileName;
    
  } finally {
    await page.close();
    await context.close();
  }
}

// Extend base test with authenticated context
const test = base.extend<{ authenticatedPage: any }>({
  authenticatedPage: async ({ browser }, use, testInfo) => {
    const storageStatePath = await setupWhatsAppAuth(browser, testInfo);
    
    // Create context with saved session
    const context = await browser.newContext({
      storageState: storageStatePath
    });
    
    const page = await context.newPage();
    
    try {
      await use(page);
    } finally {
      await page.close();
      await context.close();
    }
  }
});

test('Kirim pesan ke grup WhatsApp', async ({ authenticatedPage: page }) => {
  // Load WhatsApp with saved session
  await page.goto('https://web.whatsapp.com/', { 
    timeout: 60000,
    waitUntil: 'domcontentloaded'
  });

  // Wait for WhatsApp to load
  await page.waitForTimeout(3000);

  // Verify login by checking for main UI elements
  try {
    await Promise.race([
      page.waitForSelector('div[role="list"]', { timeout: 15000 }), // Chat list
      page.waitForSelector('div[data-testid="chat-list"]', { timeout: 15000 }), // Alternative chat list
      page.waitForSelector('div[contenteditable="true"][data-tab="3"]', { timeout: 15000 }), // Search box
      page.waitForSelector('span:has-text("Chats")', { timeout: 15000 }), // Chats text
      page.waitForSelector('span:has-text("Percakapan")', { timeout: 15000 }) // Indonesian Chats text
    ]);
  } catch (error) {
    await page.screenshot({ path: 'login-failed.png' });
    throw new Error('Gagal memverifikasi login. Pastikan sudah scan QR code dan session masih valid.');
  }

  // Focus on search with better selector
  const searchBox = page.locator('div[contenteditable="true"][data-tab="3"]').first();
  await searchBox.waitFor({ state: 'visible', timeout: 10000 });
  await searchBox.click();
  await page.waitForTimeout(1000);

  // Search for group
  const groupName = "test69";
  await searchBox.fill(groupName);
  await page.waitForTimeout(2000);

  // Open group chat with better error handling
  const groupLocator = page.locator(`span[title="${groupName}"]`).first();
  try {
    await groupLocator.waitFor({ state: 'visible', timeout: 10000 });
    await groupLocator.click();
    await page.waitForTimeout(1000);
  } catch (error) {
    await page.screenshot({ path: 'group-not-found.png' });
    throw new Error(`Grup "${groupName}" tidak ditemukan`);
  }
  
  // Send test message with better message input selector
  const testMessage = `Pesan test otomatis - ${new Date().toLocaleString()}`;
  const messageInput = page.locator('div[contenteditable="true"][data-tab="10"]');
  await messageInput.waitFor({ state: 'visible', timeout: 10000 });
  await messageInput.fill(testMessage);
  await messageInput.press('Enter');
  
  console.log('✅ Pesan terkirim ke grup:', groupName);
});

// Alternative: More robust approach with retry logic
test('Kirim pesan ke grup WhatsApp (dengan retry)', async ({ authenticatedPage: page }) => {
  await page.goto('https://web.whatsapp.com/', { 
    timeout: 60000,
    waitUntil: 'domcontentloaded'
  });

  // Wait for app to fully load
  await page.waitForLoadState('networkidle');

  // Verify login with retry
  let loginVerified = false;
  for (let i = 0; i < 3; i++) {
    try {
      await Promise.race([
        page.waitForSelector('div[role="list"]', { timeout: 10000 }),
        page.waitForSelector('div[data-testid="chat-list"]', { timeout: 10000 }),
        page.waitForSelector('div[contenteditable="true"][data-tab="3"]', { timeout: 10000 }),
      ]);
      loginVerified = true;
      break;
    } catch (error) {
      console.log(`Login verification attempt ${i + 1} failed, retrying...`);
      await page.waitForTimeout(2000);
    }
  }

  if (!loginVerified) {
    await page.screenshot({ path: 'login-failed.png' });
    throw new Error('Gagal memverifikasi login setelah 3 percobaan');
  }

  // Search for group with retry
  const groupName = "test69";
  const searchBox = page.locator('div[contenteditable="true"][data-tab="3"]').first();
  
  await searchBox.waitFor({ state: 'visible' });
  await searchBox.click();
  await searchBox.fill(groupName);
  await page.waitForTimeout(2000);

  // Find and click group
  const groupLocator = page.locator(`span[title="${groupName}"]`).first();
  await groupLocator.waitFor({ state: 'visible', timeout: 15000 });
  await groupLocator.click();
  await page.waitForTimeout(1000);
  
  // Send message
  const testMessage = `Pesan test otomatis - ${new Date().toLocaleString()}`;
  const messageInput = page.locator('div[contenteditable="true"][data-tab="10"]');
  await messageInput.waitFor({ state: 'visible' });
  await messageInput.fill(testMessage);
  await messageInput.press('Enter');
  
  // Verify message sent
  await page.waitForSelector(`span:has-text("${testMessage}")`, { timeout: 10000 });
  console.log('✅ Pesan berhasil terkirim ke grup:', groupName);
});