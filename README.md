## 📌 Project Overview

This project implements a robust automated test solution for sending messages to WhatsApp groups using WhatsApp Web, leveraging Playwright's powerful browser automation capabilities.

## ✨ Key Features

- **Session Persistence**: Avoids repetitive logins using `storageState`
- **Reliable Locators**: Multi-strategy element selection resistant to UI changes
- **Comprehensive Error Handling**: Smart retries, fallback locators, and detailed reporting
- **Message Verification**: Confirms successful message delivery
- **Visual Debugging**: Automatic screenshots on failures

## 🛠 Technical Stack

- **Framework**: Playwright Test
- **Language**: TypeScript
- **Pattern**: Page Object Model (easily extensible)
- **Node.js**: v16+

## 📋 Prerequisites

1. WhatsApp group named "test69" must exist in your contacts
2. Access to WhatsApp Web
3. Environment setup:
   ```bash
   Node.js v16+
   Playwright dependencies
   ```

## 🚀 Setup & Execution

1. Install dependencies:
   ```bash
   npm install
   npx playwright install
   ```

2. Run tests:
   ```bash
   # First run (will require QR scan)
   npx playwright test
   
   # Subsequent runs (uses saved session)
   npx playwright test
   ```

3. View reports:
   ```bash
   npx playwright show-report
   ```

## 🧪 Test Scenarios

1. **Successful Authentication**
   - QR code detection
   - Session persistence verification

2. **Group Navigation**
   - Group search functionality
   - Group selection validation

3. **Message Delivery**
   - Message input verification
   - Send button functionality
   - Delivery status check

## 📊 Reporting

- HTML reports with detailed traces
- Screenshots on failures
- Video recordings (configurable)
