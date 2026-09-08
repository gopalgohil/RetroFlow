import WorkspaceSettings from '../models/WorkspaceSettings.js';

/**
 * Workspace Settings Service
 * Encapsulates organizational configuration and agile governance parameters
 */
class SettingsService {
  /**
   * Retrieves workspace settings, initializing defaults if none exist
   * @param {string|ObjectId} userId - Organization administrator / facilitator ID
   * @returns {Promise<Object>} Workspace settings document
   */
  async getSettings(userId) {
    let settings = await WorkspaceSettings.findOne({ userId });

    if (!settings) {
      settings = await WorkspaceSettings.create({
        userId,
        workspaceName: 'RetroFlow Agile Core',
        organizationName: 'Agile Engineering Team',
        defaultVotingLimit: 5,
        allowAnonymousFeedback: true,
        timerDefaultMinutes: 10,
        enableSlackNotifications: false,
      });
    }

    return settings;
  }

  /**
   * Updates workspace configuration with validation
   * @param {string|ObjectId} userId - Facilitator user ID
   * @param {Object} updateData - Key/value pairs to update
   * @returns {Promise<Object>} Updated settings document
   */
  async updateSettings(userId, updateData) {
    const {
      workspaceName,
      organizationName,
      defaultVotingLimit,
      allowAnonymousFeedback,
      timerDefaultMinutes,
      enableSlackNotifications,
    } = updateData;

    const updated = await WorkspaceSettings.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...(workspaceName !== undefined && { workspaceName: workspaceName.trim() }),
          ...(organizationName !== undefined && { organizationName: organizationName.trim() }),
          ...(defaultVotingLimit !== undefined && { defaultVotingLimit: Number(defaultVotingLimit) }),
          ...(allowAnonymousFeedback !== undefined && {
            allowAnonymousFeedback: Boolean(allowAnonymousFeedback),
          }),
          ...(timerDefaultMinutes !== undefined && {
            timerDefaultMinutes: Number(timerDefaultMinutes),
          }),
          ...(enableSlackNotifications !== undefined && {
            enableSlackNotifications: Boolean(enableSlackNotifications),
          }),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    return updated;
  }
}

export const settingsService = new SettingsService();
export default settingsService;
