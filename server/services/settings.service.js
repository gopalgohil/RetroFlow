import WorkspaceSettings from '../models/WorkspaceSettings.js';

class SettingsService {
  async getSettings(userId) {
    let settings = await WorkspaceSettings.findOne({ userId });

    if (!settings) {
      settings = await WorkspaceSettings.create({
        userId,
        workspaceName: 'Digiflux Agile Core',
        organizationName: 'Agile Engineering Team',
        defaultVotingLimit: 1,
        allowAnonymousFeedback: true,
        timerDefaultMinutes: 10,
        enableSlackNotifications: false,
      });
    }

    return settings;
  }

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
