import { HttpStatusCode, IHttp, IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';
import AppError from '../../domain/AppError';
import IAppInternalDataSource from '../internal/IAppInternalDataSource';
import IAppRemoteDataSource from '../remote/IAppRemoteDataSource';
import IAppRepository from './IAppRepository';

export default class AppRepositoryImpl implements IAppRepository {

    constructor(
        private readonly internalDataSource: IAppInternalDataSource,
        private readonly remoteDataSource: IAppRemoteDataSource,
    ) { }

    public async startFlowRemote(agentUsername: string, contactUuid: string, flowId: string): Promise<IHttpResponse> {
        const agent = await this.internalDataSource.getAgentByUsername(agentUsername);

        if (!agent) {
            throw new AppError(`Could not find agent:  ${agentUsername}`, HttpStatusCode.BAD_REQUEST);
        }

        return await this.remoteDataSource.startFlowRemote(agent.id, contactUuid, flowId);
    }

    public async startFlowCommand(agentUsername: string, contactUrn: string, flowId: string): Promise<IHttpResponse> {
        const agent = await this.internalDataSource.getAgentByUsername(agentUsername);

        if (!agent) {
            throw new AppError(`Could not find agent:  ${agentUsername}`, HttpStatusCode.BAD_REQUEST);
        }

        return await this.remoteDataSource.startFlowCommand(agent.id, contactUrn, flowId);
    }
}
