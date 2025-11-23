import { Settings } from '../database.js';
import crypto from 'crypto';

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const initializePassword = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
    }

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({
        password: hashPassword(password),
        passwordSet: true
      });
    } else {
      settings.password = hashPassword(password);
      settings.passwordSet = true;
    }

    await settings.save();
    res.json({ success: true, message: 'Password set successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    let settings = await Settings.findOne();

    if (!settings || !settings.passwordSet) {
      return res.status(400).json({ success: false, error: 'Password not configured yet' });
    }

    const hashedInput = hashPassword(password);
    
    if (hashedInput === settings.password) {
      res.json({ success: true, message: 'Password verified' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const checkPasswordSet = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    const passwordSet = settings && settings.passwordSet ? true : false;
    res.json({ success: true, passwordSet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password required' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
    }

    let settings = await Settings.findOne();

    if (!settings || !settings.passwordSet) {
      return res.status(400).json({ success: false, error: 'Password not configured yet' });
    }

    const hashedCurrent = hashPassword(currentPassword);

    if (hashedCurrent !== settings.password) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    settings.password = hashPassword(newPassword);
    await settings.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
