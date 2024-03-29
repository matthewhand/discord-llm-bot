// tests/commands/slash/config.test.js
const { execute } = require('../../../src/commands/slash/config');
const configManager = require('../../../src/config/configurationManager');
jest.mock('../../../src/config/configurationManager');
jest.mock('../../../src/utils/permissions', () => ({
    isUserAllowed: jest.fn().mockReturnValue(true),
    isRoleAllowed: jest.fn().mockReturnValue(true)
}));

describe('/config command', () => {
    let mockInteraction;

    beforeEach(() => {
        // Initialize mockInteraction with the structure of a Discord.js interaction object
        mockInteraction = {
            options: {
                getString: jest.fn(),
                getSubcommand: jest.fn(),
            },
            reply: jest.fn(),
            user: { id: '123' },
            member: { 
                roles: { 
                    cache: new Map() 
                } 
            },
            // Additional properties as needed for the tests
        };

        // Mocking the roles structure as needed for your tests
        mockInteraction.member.roles.cache = {
            map: jest.fn().mockReturnValue([]), // Mocking the return value as an empty array or expected roles array
        };

        configManager.setConfig.mockClear();
        configManager.saveConfig.mockClear();
    });

    test('updates configuration setting when /config update is called', async () => {
        mockInteraction.options.getSubcommand.mockReturnValue('update');
        mockInteraction.options.getString.mockImplementation(arg => {
            if (arg === 'setting') return 'testSetting';
            if (arg === 'value') return 'newValue';
        });

        await execute(mockInteraction);

        expect(configManager.setConfig).toHaveBeenCalledWith('testSetting', 'newValue');
        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Configuration updated'), ephemeral: true }));
    });

    test('saves configuration when /config save is called', async () => {
        mockInteraction.options.getSubcommand.mockReturnValue('save');

        await execute(mockInteraction);

        expect(configManager.saveConfig).toHaveBeenCalled();
        expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: 'Configuration saved successfully.', ephemeral: true }));
    });

    // Additional tests can be added for permission checks, error handling, etc.
});
