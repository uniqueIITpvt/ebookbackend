import jwt from 'jsonwebtoken';
import { config } from '../../../config/index.js';
import User from '../models/User.js';

/**
 * Authentication Service
 * Handles JWT token operations and user authentication logic
 */
class AuthService {
  /**
   * Verify JWT access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Verify JWT refresh token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.refreshSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async register(userData) {
    const { name, email, password, role = 'user' } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    await user.save();

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user by credentials (includes password check)
    const user = await User.findByCredentials(email, password);

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    await user.save();

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logout user (remove refresh token)
   */
  async logout(userId, refreshToken) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Remove the specific refresh token
    user.refreshTokens = user.refreshTokens.filter(
      (rt) => rt.token !== refreshToken
    );

    await user.save();

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices (remove all refresh tokens)
   */
  async logoutAll(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.refreshTokens = [];
    await user.save();

    return { message: 'Logged out from all devices successfully' };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    // Verify refresh token
    const decoded = this.verifyRefreshToken(refreshToken);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new Error('User not found');
    }

    const tokenExists = user.refreshTokens.some(
      (rt) => rt.token === refreshToken && rt.expiresAt > Date.now()
    );

    if (!tokenExists) {
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new access token
    const accessToken = user.generateAccessToken();

    return {
      accessToken,
      user,
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    const allowedUpdates = ['name', 'bio', 'phone', 'avatar', 'preferences'];
    const updateKeys = Object.keys(updates);

    const isValidOperation = updateKeys.every((key) =>
      allowedUpdates.includes(key)
    );

    if (!isValidOperation) {
      throw new Error('Invalid updates');
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    updateKeys.forEach((key) => {
      user[key] = updates[key];
    });

    await user.save();

    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Logout from all devices for security
    user.refreshTokens = [];
    await user.save();

    return { message: 'Password changed successfully' };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    const user = await User.findOne({ email, isActive: true });

    if (!user) {
      // Don't reveal if user exists or not
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // TODO: Send email with reset token
    // For now, return the token (in production, only send via email)
    return {
      message: 'Password reset token generated',
      resetToken, // Remove this in production
    };
  }

  /**
   * Reset password using token
   */
  async resetPassword(resetToken, newPassword) {
    try {
      const decoded = jwt.verify(resetToken, config.jwt.secret);

      const user = await User.findOne({
        _id: decoded.id,
        resetPasswordToken: resetToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Update password
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      user.refreshTokens = []; // Logout from all devices

      await user.save();

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(verificationToken) {
    try {
      const decoded = jwt.verify(verificationToken, config.jwt.secret);

      const user = await User.findOne({
        _id: decoded.id,
        emailVerificationToken: verificationToken,
        emailVerificationExpire: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;

      await user.save();

      return { message: 'Email verified successfully', user };
    } catch (error) {
      throw new Error('Invalid or expired verification token');
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }

    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // TODO: Send email with verification token
    return {
      message: 'Verification email sent',
      verificationToken, // Remove this in production
    };
  }
}

export default new AuthService();
