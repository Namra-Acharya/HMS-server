import crypto from 'crypto';

// In-memory storage for password (will reset on server restart)
let passwordStorage = {
  password: null,
  passwordSet: false
};

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

    passwordStorage.password = hashPassword(password);
    passwordStorage.passwordSet = true;

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
    console.log('[AUTH] passwordSet:', passwordStorage.passwordSet);
    console.log('[AUTH] password received:', password ? 'yes' : 'no');

    if (!password || typeof password !== 'string') {
      console.log('[AUTH] Password missing or invalid type in request');
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    if (!passwordStorage.passwordSet) {
      console.log('[AUTH] Password not set in storage');
      return res.status(400).json({ success: false, error: 'Password not configured yet' });
    }

    const hashedInput = hashPassword(password);
    console.log('[AUTH] Comparing hashes...');

    if (hashedInput === passwordStorage.password) {
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
    res.json({ success: true, passwordSet: passwordStorage.passwordSet });
  } catch (error) {
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

    if (!passwordStorage.passwordSet) {
      return res.status(400).json({ success: false, error: 'Password not configured yet' });
    }

    const hashedCurrent = hashPassword(currentPassword);

    if (hashedCurrent !== passwordStorage.password) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    passwordStorage.password = hashPassword(newPassword);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
