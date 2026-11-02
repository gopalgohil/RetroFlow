// Settings service returns default workspace settings in-memory without creating a MongoDB collection.

class SettingsService {
  async getSettings(userId) {
    return {
      userId,
      workspaceName: 'RetroFlow Agile Core',
      organizationName: 'Agile Engineering Team',
      defaultVotingLimit: 1,
      allowAnonymousFeedback: true,
      timerDefaultMinutes: 10,
      enableSlackNotifications: false,
    };
  }

  async updateSettings(userId, updateData) {
    return {
      userId,
      workspaceName: (updateData.workspaceName || 'RetroFlow Agile Core').trim(),
      organizationName: (updateData.organizationName || 'Agile Engineering Team').trim(),
      defaultVotingLimit:
        updateData.defaultVotingLimit !== undefined ? Number(updateData.defaultVotingLimit) : 1,
      allowAnonymousFeedback:
        updateData.allowAnonymousFeedback !== undefined ? Boolean(updateData.allowAnonymousFeedback) : true,
      timerDefaultMinutes:
        updateData.timerDefaultMinutes !== undefined ? Number(updateData.timerDefaultMinutes) : 10,
      enableSlackNotifications:
        updateData.enableSlackNotifications !== undefined ? Boolean(updateData.enableSlackNotifications) : false,
    };
  }
}

export const settingsService = new SettingsService();
export default settingsService;
