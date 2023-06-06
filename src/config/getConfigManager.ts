import { Nullable } from '../interfaces';
import ConfigManager from './ConfigManager';

let configManager: Nullable<ConfigManager> = null;
export const getConfigManager = (): ConfigManager => {
  if (!configManager) {
    configManager = new ConfigManager();
  }

  return configManager;
};
