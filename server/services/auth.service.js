import User from '../models/User.js';
import Project from '../models/Project.js';
import { ApiError } from '../utils/ApiError.js';
import { generateToken } from '../utils/token.js';
import emailService from './email.service.js';

/**
 * Authentication Business Logic Service
 * Completely decoupled from Express HTTP request / response abstractions.
 */
class AuthService {
  /**
   * Registers a new user in unverified state and dispatches verification OTP via Brevo
   */
  async register({ name, email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Verify existing user
    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.isVerified) {
      throw ApiError.conflict('An account with this email address already exists. Please sign in.');
    }

    // Generate secure 6-digit verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (user && !user.isVerified) {
      // Re-use existing unverified profile and update credentials
      user.name = name.trim();
      user.password = password; // pre-save hook will hash
      user.verificationOtp = otp;
      user.verificationOtpExpires = otpExpires;
      await user.save();
    } else {
      // Create new unverified user
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: 'member',
        projectRole: 'Developer',
        isVerified: false,
        verificationOtp: otp,
        verificationOtpExpires: otpExpires,
      });
    }

    console.log(`\n📬 [Signup Verification OTP for ${user.email}]: ${otp} (Valid 10m)\n`);

    // Dispatch verification email via Brevo API
    const emailHtml = emailService.getSignupVerificationTemplate(otp, user.name);
    await emailService.sendEmail({
      to: user.email,
      subject: 'RetroFlow - Verify Your Email Address',
      htmlContent: emailHtml,
    });

    return {
      requiresVerification: true,
      email: user.email,
      name: user.name,
      message: `A 6-digit verification code has been sent to ${user.email}. Please verify to activate your account.`,
    };
  }

  /**
   * Verifies the 6-digit OTP code submitted during Signup
   */
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

    if (!user.verificationOtp || user.verificationOtp !== otp.trim()) {
      throw ApiError.badRequest('Invalid or incorrect verification code.');
    }

    if (new Date() > new Date(user.verificationOtpExpires)) {
      throw ApiError.badRequest('Verification code has expired. Please request a new code.');
    }

    // Activate user account
    user.isVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    await user.save();

    return {
      verified: true,
      email: user.email,
      message: 'Email verified successfully! You can now sign in to your account.',
    };
  }

  /**
   * Resends a fresh 6-digit verification OTP
   */
  async resendVerificationOtp(email) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw ApiError.notFound('No account found with this email address.');
    }

    if (user.isVerified) {
      throw ApiError.badRequest('This account is already verified. Please sign in directly.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOtp = otp;
    user.verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`\n📬 [Resent Verification OTP for ${user.email}]: ${otp} (Valid 10m)\n`);

    const emailHtml = emailService.getSignupVerificationTemplate(otp, user.name);
    await emailService.sendEmail({
      to: user.email,
      subject: 'RetroFlow - Your New Verification Code',
      htmlContent: emailHtml,
    });

    return {
      email: user.email,
      message: `A fresh 6-digit verification code has been sent to ${user.email}`,
    };
  }

  /**
   * Authenticates an existing user (only if email is verified)
   */
  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });

    // If Admin account doesn't exist yet in fresh database, auto-provision Admin account
    if (!user && (normalizedEmail === 'gopalgohel249@gmail.com' || normalizedEmail.includes('admin'))) {
      user = await User.create({
        name: 'Gopal',
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
      const isPasswordValid = await user.matchPassword(password);
      if (!isPasswordValid) {
        throw ApiError.unauthorized('Invalid email or password.');
      }
    }

    // Ensure Admin is always verified and has admin role
    if (normalizedEmail === 'gopalgohel249@gmail.com' && (!user.isVerified || user.role !== 'admin')) {
      await User.updateOne(
        { _id: user._id },
        { $set: { isVerified: true, role: 'admin', projectRole: 'Manager' } }
      );
      user.isVerified = true;
      user.role = 'admin';
      user.projectRole = 'Manager';
    }

    // Block login if email is not verified yet
    if (!user.isVerified) {
      // Auto-dispatch a fresh OTP so the user can easily verify right away
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationOtp = otp;
      user.verificationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const emailHtml = emailService.getSignupVerificationTemplate(otp, user.name);
      await emailService.sendEmail({
        to: user.email,
        subject: 'RetroFlow - Complete Your Email Verification',
        htmlContent: emailHtml,
      });

      throw new ApiError(
        403,
        'Your email address is not verified yet. We have sent a verification code to your email. Please verify your account to sign in.',
        { email: user.email, requiresVerification: true }
      );
    }

    const token = generateToken({ id: user._id, email: user.email, role: user.role || 'member' });

    const isManagerInProjects = await Project.findOne({
      isArchived: { $ne: true },
      $or: [
        { 'lead.email': normalizedEmail },
        { members: { $elemMatch: { email: normalizedEmail, role: 'Manager' } } },
      ],
    });

    const effectiveRole =
      user.role === 'admin' || user.email === 'gopalgohel249@gmail.com'
        ? 'Manager'
        : user.projectRole === 'Manager' || isManagerInProjects
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
      },
      token,
    };
  }

  /**
   * Generates and dispatches a 6-digit OTP code for password recovery
   */
  async requestPasswordResetOtp(email) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw ApiError.notFound('No registered account found with this email address.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`\n🔑 [Password Reset OTP for ${user.email}]: ${otp} (10m lifespan)\n`);

    const emailHtml = emailService.getOtpTemplate(otp, user.name);
    await emailService.sendEmail({
      to: user.email,
      subject: 'RetroFlow - Your 6-Digit Password Reset Code',
      htmlContent: emailHtml,
    });

    return {
      email: user.email,
      expiresInMinutes: 10,
    };
  }

  /**
   * Verifies OTP and resets user password
   */
  async resetPassword({ email, otp, newPassword }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.trim()) {
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

  /**
   * Retrieves profile of authenticated user with active projects summary
   */
  async getProfile(userId) {
    const user = await User.findById(userId).select(
      '-password -resetPasswordOtp -resetPasswordExpires -verificationOtp -verificationOtpExpires'
    );
    if (!user) {
      throw ApiError.notFound('User profile not found.');
    }

    const email = user.email.toLowerCase().trim();
    const isAdmin = user.role === 'admin' || email === 'gopalgohel249@gmail.com' || email.includes('admin');

    // Retrieve active projects the user participates in or created
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

    // Dynamically detect if user is assigned Manager or Lead in any active project
    const isManagerInProjects = userProjects.some((p) => {
      const isLead = p.lead?.email?.toLowerCase().trim() === email;
      const isManagerMember = Array.isArray(p.members) && p.members.some(
        (m) => m.email?.toLowerCase().trim() === email && (m.role || '').toLowerCase() === 'manager'
      );
      return isLead || isManagerMember;
    });

    const isLeadInProjects = userProjects.some((p) => {
      const isLead = p.lead?.email?.toLowerCase().trim() === email;
      const isLeadMember = Array.isArray(p.members) && p.members.some(
        (m) => m.email?.toLowerCase().trim() === email && (m.role || '').toLowerCase().includes('lead')
      );
      return isLead || isLeadMember;
    });

    let effectiveProjectRole = 'Developer';
    if (isAdmin) {
      effectiveProjectRole = 'Manager';
    } else if (user.projectRole && user.projectRole.toLowerCase() === 'manager') {
      effectiveProjectRole = 'Manager';
    } else if (isManagerInProjects) {
      effectiveProjectRole = 'Manager';
    } else if (user.projectRole && user.projectRole.toLowerCase().includes('lead')) {
      effectiveProjectRole = 'Project Lead';
    } else if (isLeadInProjects) {
      effectiveProjectRole = 'Project Lead';
    } else if (user.projectRole && user.projectRole !== 'Unassigned') {
      effectiveProjectRole = user.projectRole;
    }

    if (effectiveProjectRole !== 'Developer' && user.projectRole !== effectiveProjectRole && !isAdmin) {
      await User.updateOne({ _id: user._id }, { $set: { projectRole: effectiveProjectRole } });
    }

    return {
      ...user.toObject(),
      projectRole: effectiveProjectRole,
      activeProjectsCount: userProjects.length,
      activeProjects: userProjects.map((p) => ({ id: p._id?.toString() || p.id, key: p.key, name: p.name })),
    };
  }

  /**
   * Updates user profile (e.g. name)
   */
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

  /**
   * Updates password verifying current password first
   */
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
}

export const authService = new AuthService();
export default authService;
