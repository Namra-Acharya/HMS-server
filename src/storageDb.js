import Database from 'better-sqlite3';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db;

export function initializeStorage() {
  try {
    const dbDir = resolve(__dirname, '../data');
    const dbPath = resolve(dbDir, 'storage.db');

    // Create directory if it doesn't exist
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
      console.log('[STORAGE] Created data directory:', dbDir);
    }

    db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create settings table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        password TEXT,
        passwordSet INTEGER DEFAULT 0
      )
    `);

    // Ensure there's at least one row
    const existingSettings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    if (!existingSettings) {
      db.prepare('INSERT INTO settings (id, password, passwordSet) VALUES (1, NULL, 0)').run();
    }

    console.log('[STORAGE] SQLite database initialized');
    return db;
  } catch (error) {
    console.error('[STORAGE] Failed to initialize database:', error.message);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    return initializeStorage();
  }
  return db;
}

export function getSetting(key) {
  try {
    const result = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    return result;
  } catch (error) {
    console.error('[STORAGE] Error reading settings:', error.message);
    throw error;
  }
}

export function updateSetting(data) {
  try {
    const stmt = db.prepare(`
      UPDATE settings 
      SET password = ?, passwordSet = ?
      WHERE id = 1
    `);
    stmt.run(data.password, data.passwordSet ? 1 : 0);
    return getSetting();
  } catch (error) {
    console.error('[STORAGE] Error updating settings:', error.message);
    throw error;
  }
}

export default {
  initializeStorage,
  getDatabase,
  getSetting,
  updateSetting
};
