import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export const RC_SERVER_URL = 'Site_Url';

export const CONFIG_FLOW_ID = 'config_flow_id';
export const CONFIG_RAPIDPRO_URL = 'config_rapidpro_url';
export const CONFIG_RAPIDPRO_AUTH_TOKEN = 'config_rapidpro_auth_token';

export const COOKIE_RC_USER_ID = 'rc_uid';

export const APP_SETTINGS: Array<ISetting> = [
    {
        id: CONFIG_FLOW_ID,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: CONFIG_FLOW_ID,
    },
    {
        id: CONFIG_RAPIDPRO_URL,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: CONFIG_RAPIDPRO_URL,
    },
    {
        id: CONFIG_RAPIDPRO_AUTH_TOKEN,
        type: SettingType.STRING,
        packageValue: '',
        required: true,
        public: false,
        i18nLabel: CONFIG_RAPIDPRO_AUTH_TOKEN,
    },
];
