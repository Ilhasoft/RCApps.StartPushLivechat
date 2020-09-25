import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ApiSecurity, ApiVisibility, IApi } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';

import { StartFlowEndpoint } from './src/endpoint/StartFlowEndpoint';
import { APP_SETTINGS } from './src/settings/Constants';

export class StartPushLivechatApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await this.extendConfiguration(configurationExtend);
        await configurationExtend.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [
                new StartFlowEndpoint(this),
            ],
        } as IApi);
    }

    public async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        APP_SETTINGS.forEach((setting) => configuration.settings.provideSetting(setting));
    }
}
