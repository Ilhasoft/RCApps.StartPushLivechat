import { HttpStatusCode, IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';

import AppError from '../../domain/AppError';
import CommandError from '../../domain/CommandError';
import IAppInternalDataSource from '../internal/IAppInternalDataSource';
import IAppRemoteDataSource from '../remote/IAppRemoteDataSource';
import IAppRepository from './IAppRepository';

export default class AppRepositoryImpl implements IAppRepository {

    constructor(
        private readonly internalDataSource: IAppInternalDataSource,
        private readonly remoteDataSource: IAppRemoteDataSource,
    ) { }

    public async startFlowRemote(agentId: string, contactUuid: string, flowId: string): Promise<IHttpResponse> {
        const agent = await this.internalDataSource.getAgentById(agentId);

        if (!agent) {
            throw new AppError(`Could not find agent: ${agentId}`, HttpStatusCode.BAD_REQUEST);
        }

        return await this.remoteDataSource.startFlowRemote(agentId, contactUuid, flowId);
    }

    public async startFlowCommand(agentUsername: string, contactUrn: string, flowId: string): Promise<IHttpResponse> {
        const agent = await this.internalDataSource.getAgentByUsername(agentUsername);

        if (!agent) {
            throw new AppError(`Could not find agent: ${agentUsername}`, HttpStatusCode.BAD_REQUEST);
        }

        return await this.remoteDataSource.startFlowCommand(agent.id, contactUrn, flowId);
    }

    public async validateContact(contactUrn: string): Promise<boolean> {
        const res = await this.remoteDataSource.validateContact(contactUrn);

        if (!res || res.statusCode !== 200) {
            throw new CommandError(`Connection error, could not validate contact: ${contactUrn}`);
        }

        if (res.data.results.length === 0) {
            return false;
        }

        return true;

    }

}
