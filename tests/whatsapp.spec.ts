import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function setupWhatsAppAuth(browser: any, testInfo: any) {
  const fileName = path.join(testInfo.project.outputDir, 'whatsapp-state.json');
  
  if (fs.existsSync(fileName)) {
    console.log('✔ Menggunakan session yang tersimpan');
    return fileName;
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('https://web.whatsapp.com/', { 
      timeout: 120000,
      waitUntil: 'domcontentloaded'
    });
    
    try {
      await page.locator('canvas').first().waitFor({ 
        state: 'visible',
        timeout: 120000 
      });
      console.log('➡️ Silakan scan QR code untuk login pertama kali...');
    } catch (error) {
      console.log('QR code tidak ditemukan, mungkin sudah login');
    }
    
    await Promise.race([
      page.waitForSelector('div[role="list"]', { timeout: 120000 }), 
      page.waitForSelector('div[data-testid="chat-list"]', { timeout: 120000 }),
      page.waitForSelector('div[contenteditable="true"][data-tab="3"]', { timeout: 120000 }), 
      page.waitForSelector('span:has-text("Chats")', { timeout: 120000 }), 
      page.waitForSelector('span:has-text("Percakapan")', { timeout: 120000 })
    ]);
    console.log('✔ Login berhasil');
    
    await context.storageState({ path: fileName });
    return fileName;
    
  } finally {
    await page.close();
    await context.close();
  }
}

const test = base.extend<{ authenticatedPage: any }>({
  authenticatedPage: async ({ browser }, use, testInfo) => {
    const storageStatePath = await setupWhatsAppAuth(browser, testInfo);
    
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
  await page.goto('https://web.whatsapp.com/', { 
    timeout: 60000,
    waitUntil: 'domcontentloaded'
  });

  await page.waitForTimeout(3000);

  try {
    await Promise.race([
      page.waitForSelector('div[role="list"]', { timeout: 15000 }), 
      page.waitForSelector('div[data-testid="chat-list"]', { timeout: 15000 }), 
      page.waitForSelector('div[contenteditable="true"][data-tab="3"]', { timeout: 15000 }), 
      page.waitForSelector('span:has-text("Chats")', { timeout: 15000 }), 
      page.waitForSelector('span:has-text("Percakapan")', { timeout: 15000 }) 
    ]);
  } catch (error) {
    await page.screenshot({ path: 'login-failed.png' });
    throw new Error('Gagal memverifikasi login. Pastikan sudah scan QR code dan session masih valid.');
  }

  const searchBox = page.locator('div[contenteditable="true"][data-tab="3"]').first();
  await searchBox.waitFor({ state: 'visible', timeout: 10000 });
  await searchBox.click();
  await page.waitForTimeout(1000);

  const groupName = "test69";
  await searchBox.fill(groupName);
  await page.waitForTimeout(2000);

  const groupLocator = page.locator(`span[title="${groupName}"]`).first();
  try {
    await groupLocator.waitFor({ state: 'visible', timeout: 10000 });
    await groupLocator.click();
    await page.waitForTimeout(1000);
  } catch (error) {
    await page.screenshot({ path: 'group-not-found.png' });
    throw new Error(`Grup "${groupName}" tidak ditemukan`);
  }
  
  const testMessage = `Pesan test otomatis - ${new Date().toLocaleString()}`;
  const messageInput = page.locator('div[contenteditable="true"][data-tab="10"]');
  await messageInput.waitFor({ state: 'visible', timeout: 10000 });
  await messageInput.fill(testMessage);
  await messageInput.press('Enter');
  
  console.log('✅ Pesan terkirim ke grup:', groupName);
});

test('Kirim pesan ke grup WhatsApp (dengan retry)', async ({ authenticatedPage: page }) => {
  await page.goto('https://web.whatsapp.com/', { 
    timeout: 60000,
    waitUntil: 'domcontentloaded'
  });

  await page.waitForLoadState('networkidle');

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

  const groupName = "test69";
  const searchBox = page.locator('div[contenteditable="true"][data-tab="3"]').first();
  
  await searchBox.waitFor({ state: 'visible' });
  await searchBox.click();
  await searchBox.fill(groupName);
  await page.waitForTimeout(2000);

  const groupLocator = page.locator(`span[title="${groupName}"]`).first();
  await groupLocator.waitFor({ state: 'visible', timeout: 15000 });
  await groupLocator.click();
  await page.waitForTimeout(1000);
  
  const testMessage = `Pesan test otomatis - ${new Date().toLocaleString()}`;
  const messageInput = page.locator('div[contenteditable="true"][data-tab="10"]');
  await messageInput.waitFor({ state: 'visible' });
  await messageInput.fill(testMessage);
  await messageInput.press('Enter');
  
  await page.waitForSelector(`span:has-text("${testMessage}")`, { timeout: 10000 });
  console.log('✅ Pesan berhasil terkirim ke grup:', groupName);
});
