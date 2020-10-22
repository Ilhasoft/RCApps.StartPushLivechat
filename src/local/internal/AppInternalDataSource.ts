import { IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import IAppInternalDataSource from '../../data/internal/IAppInternalDataSource';

export default class AppInternalDataSource implements IAppInternalDataSource {

    constructor(private readonly reader: IRead) { }

    public async getAgentByUsername(agentUsername: string): Promise<IUser | undefined> {
        return this.reader.getUserReader().getByUsername(agentUsername);
    }

    public async getAgentById(agentId: string): Promise<IUser | undefined> {
        return this.reader.getUserReader().getById(agentId);
    }

}
