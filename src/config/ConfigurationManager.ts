import config from 'config';
import Debug from 'debug';
import { loadIntegrationConfigs } from './loadIntegrationConfigs';
import { redactSensitiveInfo } from '@common/redactSensitiveInfo';

const debug = Debug('app:ConfigurationManager');

/**
 * ConfigurationManager Class
 *
 * This class is responsible for managing application configurations. It follows the Singleton pattern,
 * ensuring that only one instance of ConfigurationManager exists throughout the application lifecycle.
 *
 * The ConfigurationManager primarily handles the retrieval of configuration values from three sources:
 * 1. Environment Variables: The highest priority, values are fetched from process.env.
 * 2. Configuration Files: If environment variables are not available, values are fetched from configuration files using the 'config' package.
 * 3. Fallback Values: If neither environment variables nor configuration files provide a value, a fallback value is returned.
 *
 * Sensitive information is redacted in debug logs to prevent data leakage.
 */
class ConfigurationManager {
    private static instance: ConfigurationManager;

    // Holds integration-specific configurations
    public readonly integrationConfigs: Record<string, any>;

    private constructor() {
        // Load integration configurations upon initialization
        this.integrationConfigs = loadIntegrationConfigs();
    }

    // Singleton pattern to ensure only one instance of ConfigurationManager exists
    public static getInstance(): ConfigurationManager {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }

    // Retrieve a specific configuration by name from the loaded integration configurations
    public getConfig(configName: string): any {
        return this.integrationConfigs[configName];
    }

    /**
     * Retrieves a configuration value, prioritizing environment variables.
     * Falls back to a config file value, and ultimately a default fallback value.
     * 
     * @param envVar - The name of the environment variable to check.
     * @param configKey - The key to look up in the config file if the environment variable is not set.
     * @param fallbackValue - The value to return if neither the environment variable nor the config file has a value.
     * @returns The resolved configuration value.
     */
    public getEnvConfig<T>(envVar: string, configKey: string, fallbackValue: T): T {
        // Guard: Ensure envVar and configKey are provided
        if (!envVar) {
            throw new Error('Environment variable name (envVar) must be provided');
        }
        if (!configKey) {
            throw new Error('Configuration key (configKey) must be provided');
        }

        // Fetch the value from the environment variables
        const envValue = process.env[envVar];
        
        // Log the value using redacted information to avoid sensitive data exposure
        debug(`Fetching configuration for ${envVar}: ${redactSensitiveInfo(envVar, envValue)}, config key: ${configKey}, fallback: ${fallbackValue}`);

        // If the environment variable is defined, return it
        if (envValue !== undefined) {
            return envValue as unknown as T;
        }

        try {
            // Attempt to fetch the value from the config file
            const configValue = config.get(configKey);
            if (configValue !== undefined) {
                return configValue as T;
            }

            // Return the fallback value if config value is undefined
            return fallbackValue;
        } catch (e) {
            // Log error and return fallback if there was an issue fetching the config value
            debug(`Error fetching CONFIG [${configKey}]. Using fallback value: ${fallbackValue}`);
            return fallbackValue;
        }
    }
}

export default ConfigurationManager;
