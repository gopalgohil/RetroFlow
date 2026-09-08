import mongoose from 'mongoose';

/**
 * Workspace Settings Schema
 * Manages organization-wide settings, default retro parameters, and preferences.
 */
const workspaceSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    workspaceName: {
      type: String,
      default: 'RetroFlow Agile Core',
      trim: true,
      maxlength: 100,
    },
    organizationName: {
      type: String,
      default: 'Agile Engineering Team',
      trim: true,
      maxlength: 100,
    },
    defaultVotingLimit: {
      type: Number,
      default: 5,
      min: 1,
      max: 20,
    },
    allowAnonymousFeedback: {
      type: Boolean,
      default: true,
    },
    timerDefaultMinutes: {
      type: Number,
      default: 10,
      min: 1,
      max: 60,
    },
    enableSlackNotifications: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const WorkspaceSettings = mongoose.model('WorkspaceSettings', workspaceSettingsSchema);

export default WorkspaceSettings;
