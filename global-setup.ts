import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting WhatsApp automation setup...');
  
  // Bersihkan session lama jika lebih dari 24 jam
  const sessionPath = path.join(config.projects[0].outputDir, 'whatsapp-state.json');
  
  if (fs.existsSync(sessionPath)) {
    const stats = fs.statSync(sessionPath);
    const fileAge = Date.now() - stats.mtime.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 jam
    
    if (fileAge > maxAge) {
      console.log('🧹 Menghapus session lama (>24 jam)...');
      fs.unlinkSync(sessionPath);
    } else {
      console.log('✅ Session masih valid');
    }
  }
  
  // Pastikan direktori output ada
  const outputDir = config.projects[0].outputDir;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('✅ Setup selesai');
}

export default globalSetup;