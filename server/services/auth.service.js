import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Project from '../models/Project.js';
import RetroBoard from '../models/RetroBoard.js';
import { ApiError } from '../utils/ApiError.js';
import { generateToken } from '../utils/token.js';
import emailService from './email.service.js';
import { isSuperAdmin, getSuperAdminEmail } from '../config/admin.config.js';
import env from '../config/env.js';

const hashOtp = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp.toString().trim(), salt);
};

const verifyOtp = async (plainOtp, storedOtp) => {
  if (!plainOtp || !storedOtp) return false;
  const trimmed = plainOtp.toString().trim();
  if (storedOtp.startsWith('$2')) {
    return bcrypt.compare(trimmed, storedOtp);
  }
  return storedOtp === trimmed;
};

class AuthService {
  async register({ name, email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.isVerified) {
      throw ApiError.conflict('An account with this email address already exists. Please sign in.');
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 
    const hashedOtp = await hashOtp(otp);

    if (user && !user.isVerified) {
      const isSuper = isSuperAdmin(normalizedEmail);
      user.name = name.trim();
      user.password = password; 
      user.status = isSuper ? 'approved' : 'pending';
      user.verificationOtp = hashedOtp;
      user.verificationOtpExpires = otpExpires;
      await user.save();
    } else {
      const isSuper = isSuperAdmin(normalizedEmail);
      const isPreApproved = Boolean(
        isSuper ||
        (await RetroBoard.exists({ approvedMembers: normalizedEmail }))
      );

      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: isSuper ? 'admin' : 'member',
        projectRole: isSuper ? 'Manager' : 'Developer',
        status: isSuper ? 'approved' : 'pending',
        isVerified: false,
        isApproved: isPreApproved,
        hasLoggedIn: false,
        verificationOtp: hashedOtp,
        verificationOtpExpires: otpExpires,
      });
    }

    console.log(`\n📬 [Signup Verification]: Verification OTP email dispatched to ${user.email} (Valid 10m)\n`);

    const emailHtml = emailService.getSignupVerificationTemplate(otp, user.name);
    await emailService.sendEmail({
      to: user.email,
      subject: 'Digiflux - Verify Your Email Address',
      htmlContent: emailHtml,
    });

    return {
      requiresVerification: true,
      email: user.email,
      name: user.name,
      message: `A 6-digit verification code has been sent to ${user.email}. Please verify to activate your account.`,
    };
  }

  async verifyEmail({ email, otp }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw ApiError.notFound('Account not found with this email address.');
    }

    if (user.isVerified) {
      return {
        alreadyVerified: true,
        email: user.email,
        message: 'Your email is already verified. Please sign in.',
      };
    }

    const isOtpValid = await verifyOtp(otp, user.verificationOtp);
    if (!isOtpValid) {
      throw ApiError.badRequest('Invalid or incorrect verification code.');
    }

    if (new Date() > new Date(user.verificationOtpExpires)) {
      throw ApiError.badRequest('Verification code has expired. Please request a new code.');
    }

    const isSuper = isSuperAdmin(user.email);
    user.isVerified = true;
    user.status = isSuper ? 'approved' : (user.status || 'pending');
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    await user.save();

    emailService.notifyUserWelcome({ user }).catch((err) => {
      console.error('[Brevo User Welcome Notification Error]', err.message);
    });

    if (!isSuper) {
      const reviewUrl = `${env.CLIENT_URL || 'http://localhost:3000'}/dashboard?tab=members`;
      emailService.notifyAdminNewUser({ user, reviewUrl }).catch((err) => {
        console.error('[Brevo Admin Notification Error]', err.message);
      });
      console.log(`\n📬 [Admin Notification]: Dispatched new pending user alert for ${user.email} to Admin\n`);
    }

    return {
      verified: true,
      status: user.status,
      email: user.email,
      message: 'Email verified successfully! You can now sign in to your account.',
    };
  }

  async resendVerificationOtp(email) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw ApiError.notFound('No account found with this email address.');
    }

    if (user.isVerified) {
      throw ApiError.badRequest('This account is already verified. Please sign in directly.');
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    user.verificationOtp = await hashOtp(otp);
    user.verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`\n📬 [Resent Verification OTP]: Fresh verification OTP dispatched to ${user.email}\n`);

    const emailHtml = emailService.getSignupVerificationTemplate(otp, user.name);
    await emailService.sendEmail({
      to: user.email,
      subject: 'Digiflux - Your New Verification Code',
      htmlContent: emailHtml,
    });

    return {
      email: user.email,
      message: `A fresh 6-digit verification code has been sent to ${user.email}`,
    };
  }

  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user && isSuperAdmin(normalizedEmail)) {
      user = await User.create({
        name: 'Workspace Admin',
        email: normalizedEmail,
        password,
        role: 'admin',
        projectRole: 'Manager',
        isVerified: true,
      });
      console.log(`\n👑 [Admin Account Auto-Provisioned] ${normalizedEmail} successfully initialized as verified Admin.\n`);
    } else if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    } else {
      if (!user.password && user.authProvider === 'google') {
        throw ApiError.badRequest(
          'This account was created with Google. Please click "Continue with Google" to sign in.'
        );
      }
      const isPasswordValid = await user.matchPassword(password);
      if (!isPasswordValid) {
        throw ApiError.unauthorized('Invalid email or password.');
      }
    }

    if (isSuperAdmin(normalizedEmail)) {
      if (user.status !== 'approved' || !user.isVerified || user.role !== 'admin' || !user.isApproved) {
        await User.updateOne(
          { _id: user._id },
          { $set: { status: 'approved', isVerified: true, isApproved: true, role: 'admin', projectRole: 'Manager' } }
        );
        user.status = 'approved';
        user.isApproved = true;
        user.isVerified = true;
        user.role = 'admin';
        user.projectRole = 'Manager';
      }
    }

    if (!user.isVerified) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      user.verificationOtp = await hashOtp(otp);
      user.verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      console.log(`\n📬 [Login Verification]: OTP dispatched to unverified user ${user.email}\n`);

      const emailHtml = emailService.getSignupVerificationTemplate(otp, user.name);
      await emailService.sendEmail({
        to: user.email,
        subject: 'Digiflux - Complete Your Email Verification',
        htmlContent: emailHtml,
      });

      throw new ApiError(
        403,
        'Your email address is not verified yet. We have sent a verification code to your email. Please verify your account to sign in.',
        { email: user.email, requiresVerification: true }
      );
    }

    const isSuper = isSuperAdmin(normalizedEmail) || user.role === 'admin';
    const userStatus = user.status || (user.isApproved ? 'approved' : 'pending');

    if (!isSuper && userStatus === 'rejected') {
      throw new ApiError(
        403,
        'Your registration request has been rejected by the workspace administrator. Please contact support if you believe this is an error.',
        { status: 'rejected', email: user.email }
      );
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { hasLoggedIn: true, lastLogin: new Date() } }
    );

    const token = generateToken({ id: user._id, name: user.name, email: user.email, role: user.role || 'member' });

    const isAdmin = Boolean(
      user.role === 'admin' ||
      isSuperAdmin(user.email)
    );

    const effectiveRole = isAdmin
      ? 'Manager'
      : user.projectRole && user.projectRole !== 'Unassigned'
      ? user.projectRole
      : 'Developer';

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'member',
        projectRole: effectiveRole,
        status: user.status || 'approved',
        isApproved: Boolean(user.role === 'admin' || isSuperAdmin(user.email) || user.isApproved),
      },
      token,
    };
  }

  async requestPasswordResetOtp(email) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw ApiError.notFound('Account not found! Please create an account first.');
    }

    if (!user.isVerified) {
      throw ApiError.badRequest('This account has not been registered or verified yet. Please create and verify your account first.');
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    user.resetPasswordOtp = await hashOtp(otp);
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`\n🔑 [Password Reset]: Password reset OTP dispatched to ${user.email} (10m lifespan)\n`);

    const emailHtml = emailService.getOtpTemplate(otp, user.name);
    await emailService.sendEmail({
      to: user.email,
      subject: 'Digiflux - Your 6-Digit Password Reset Code',
      htmlContent: emailHtml,
    });

    return {
      email: user.email,
      expiresInMinutes: 10,
    };
  }

  async resetPassword({ email, otp, newPassword }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const isOtpValid = await verifyOtp(otp, user.resetPasswordOtp);
    if (!isOtpValid) {
      throw ApiError.badRequest('Invalid or incorrect verification code.');
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      throw ApiError.badRequest('Verification code has expired. Please request a new one.');
    }

    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    await user.save();

    return {
      success: true,
      email: user.email,
    };
  }

  async getProfile(userId) {
    const user = await User.findById(userId).select(
      '-password -resetPasswordOtp -resetPasswordExpires -verificationOtp -verificationOtpExpires'
    );
    if (!user) {
      throw ApiError.notFound('User profile not found.');
    }

    const email = user.email.toLowerCase().trim();
    const isAdmin = user.role === 'admin' || isSuperAdmin(email);

    const userProjects = await Project.find({
      isArchived: { $ne: true },
      $or: [
        { createdBy: userId },
        { 'lead.email': email },
        { 'members.email': email },
      ],
    })
      .select('id key name lead members')
      .lean();

    let effectiveProjectRole = 'Developer';
    if (isAdmin) {
      effectiveProjectRole = 'Manager';
    } else if (user.projectRole && user.projectRole !== 'Unassigned') {
      effectiveProjectRole = user.projectRole;
    }

    return {
      ...user.toObject(),
      projectRole: effectiveProjectRole,
      status: user.status || (isAdmin || user.isApproved ? 'approved' : 'pending'),
      isApproved: Boolean(isAdmin || user.isApproved),
      activeProjectsCount: userProjects.length,
      activeProjects: userProjects.map((p) => ({ id: p._id?.toString() || p.id, key: p.key, name: p.name })),
    };
  }

  async updateProfile(userId, { name }) {
    if (!name || !name.trim()) {
      throw ApiError.badRequest('Full name is required.');
    }
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    user.name = name.trim();
    await user.save();

    return this.getProfile(userId);
  }

  async changePassword(userId, { currentPassword, newPassword, email }) {
    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Current password and new password are required.');
    }
    if (newPassword.length < 8) {
      throw ApiError.badRequest('New password must be at least 8 characters long.');
    }

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }
    if (!user) {
      throw ApiError.notFound('User account not found.');
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect. Please try again.');
    }

    user.password = newPassword;
    await user.save();

    return { success: true, message: 'Password updated successfully.' };
  }

  async googleAuth({ email, name, avatar, googleId }) {
    if (!email) {
      throw ApiError.badRequest('Email is required for Google authentication.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    const isAdmin = Boolean(
      isSuperAdmin(normalizedEmail)
    );

    let isNewUser = false;

    if (user) {
      let needsSave = false;
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        needsSave = true;
      }
      if (!user.isVerified) {
        user.isVerified = true;
        needsSave = true;
      }
      if (isAdmin) {
        user.role = 'admin';
        user.projectRole = 'Manager';
        user.isApproved = true;
        user.status = 'approved';
        needsSave = true;
      }
      user.hasLoggedIn = true;
      user.lastLogin = new Date();
      await user.save();
    } else {
      isNewUser = true;
      const isPreApproved = Boolean(
        isAdmin ||
        (await RetroBoard.exists({ approvedMembers: normalizedEmail }))
      );

      user = await User.create({
        name: name ? name.trim() : 'Google User',
        email: normalizedEmail,
        googleId: googleId || null,
        avatar: avatar || null,
        authProvider: 'google',
        role: isAdmin ? 'admin' : 'member',
        projectRole: isAdmin ? 'Manager' : 'Developer',
        status: isAdmin ? 'approved' : 'pending',
        isVerified: true,
        isApproved: isPreApproved,
        hasLoggedIn: true,
        lastLogin: new Date(),
      });
      console.log(`\n🎉 [Google Account Initialized] ${user.name} (${user.email}) registered via Google Auth.\n`);

      if (!isAdmin) {
        emailService.notifyUserWelcome({ user }).catch((err) => {
          console.error('[Brevo User Welcome Notification Error]', err.message);
        });

        const reviewUrl = `${env.CLIENT_URL || 'http://localhost:3000'}/dashboard?tab=members`;
        emailService.notifyAdminNewUser({ user, reviewUrl }).catch((err) => {
          console.error('[Brevo Admin Notification Error]', err.message);
        });
      }
    }

    const isSuper = isAdmin || user.role === 'admin';
    const userStatus = user.status || (user.isApproved ? 'approved' : 'pending');

    if (!isSuper && userStatus === 'rejected') {
      throw new ApiError(
        403,
        'Your registration request has been rejected by the workspace administrator. Please contact support if you believe this is an error.',
        { status: 'rejected', email: user.email }
      );
    }

    const token = generateToken({ id: user._id, name: user.name, email: user.email, role: user.role || 'member' });

    const effectiveRole = isAdmin
      ? 'Manager'
      : user.projectRole && user.projectRole !== 'Unassigned'
      ? user.projectRole
      : 'Developer';

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        projectRole: effectiveRole,
        status: user.status || 'approved',
        isVerified: user.isVerified,
        isApproved: Boolean(isAdmin || user.isApproved || user.status === 'approved'),
        avatar: user.avatar,
      },
    };
  }
}

export const authService = new AuthService();
export default authService;
