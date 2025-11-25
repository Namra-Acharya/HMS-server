import crypto from 'crypto';
import { getSetting, updateSetting, getDatabase } from '../storageDb.js';

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const initializePassword = (req, res) => {
  try {
    const { password } = req.body;

    console.log('[AUTH] initializePassword called');
    console.log('[AUTH] password received:', password ? 'yes' : 'no');

    if (!password || typeof password !== 'string' || password.length < 4) {
      console.log('[AUTH] Password validation failed');
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
    }

    const hashedPassword = hashPassword(password);
    updateSetting({
      password: hashedPassword,
      passwordSet: true
    });

    console.log('[AUTH] Password initialized successfully');
    res.json({ success: true, message: 'Password set successfully' });
  } catch (error) {
    console.error('[AUTH] initializePassword error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyPassword = (req, res) => {
  try {
    const { password } = req.body;

    console.log('[AUTH] verifyPassword called');

    if (!password || typeof password !== 'string') {
      console.log('[AUTH] Password missing or invalid type in request');
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    const settings = getSetting();
    console.log('[AUTH] passwordSet:', settings?.passwordSet);
    console.log('[AUTH] password received:', password ? 'yes' : 'no');

    if (!settings || !settings.passwordSet) {
      console.log('[AUTH] Password not set in storage');
      return res.status(400).json({ success: false, error: 'Password not configured yet' });
    }

    const hashedInput = hashPassword(password);
    console.log('[AUTH] Comparing hashes...');

    if (hashedInput === settings.password) {
      console.log('[AUTH] Password verified successfully');
      res.json({ success: true, message: 'Password verified' });
    } else {
      console.log('[AUTH] Password mismatch');
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  } catch (error) {
    console.error('[AUTH] verifyPassword error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const checkPasswordSet = (req, res) => {
  try {
    const settings = getSetting();
    const passwordSet = settings && settings.passwordSet ? true : false;
    console.log('[AUTH] checkPasswordSet - passwordSet:', passwordSet);
    res.json({ success: true, passwordSet });
  } catch (error) {
    console.error('[AUTH] checkPasswordSet error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const changePassword = (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string' || !newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ success: false, error: 'Current and new password required' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
    }

    const settings = getSetting();

    if (!settings || !settings.passwordSet) {
      return res.status(400).json({ success: false, error: 'Password not configured yet' });
    }

    const hashedCurrent = hashPassword(currentPassword);

    if (hashedCurrent !== settings.password) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashedNew = hashPassword(newPassword);
    updateSetting({
      password: hashedNew,
      passwordSet: true
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('[AUTH] changePassword error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
