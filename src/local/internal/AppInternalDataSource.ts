import {IPersistence, IPersistenceRead, IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {RocketChatAssociationModel, RocketChatAssociationRecord} from '@rocket.chat/apps-engine/definition/metadata';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import IAppInternalDataSource from '../../data/internal/IAppInternalDataSource';

export default class AppInternalDataSource implements IAppInternalDataSource {

    constructor(private readonly reader: IRead) {}

    public async getAgentById(agentId: string): Promise<IUser | undefined> {
        return this.reader.getUserReader().getById(agentId);
    }

}
