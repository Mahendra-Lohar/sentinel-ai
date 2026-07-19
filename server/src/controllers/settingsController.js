import * as settingsRepo from '../repositories/settingsRepository.js';

export async function getSettings(req, res) {
  try {
    const settings = await settingsRepo.getAllSettings();
    res.json({ settings });
  } catch (error) {
    console.error('Failed to get settings:', error);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
}

export async function updateSettings(req, res) {
  try {
    const updatedSettings = await settingsRepo.updateSettings(req.body);
    res.json({ message: 'Settings updated successfully', settings: updatedSettings });
  } catch (error) {
    console.error('Failed to update settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}
