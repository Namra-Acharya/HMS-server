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
    
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
    }

    passwordStorage.password = hashPassword(password);
    passwordStorage.passwordSet = true;
    
    res.json({ success: true, message: 'Password set successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyPassword = (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    if (!passwordStorage.passwordSet) {
      return res.status(400).json({ success: false, error: 'Password not configured yet' });
    }

    const hashedInput = hashPassword(password);
    
    if (hashedInput === passwordStorage.password) {
      res.json({ success: true, message: 'Password verified' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  } catch (error) {
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

    if (!currentPassword || !newPassword) {
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
