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

    public async startFlow(agentUsername: string, visitorToken: string, flowId: string): Promise<IHttpResponse> {
        const agent = await this.internalDataSource.getAgentByUsername(agentUsername);

        if (!agent) {
            throw new AppError(`Could not find agent:  ${agentUsername}`, HttpStatusCode.BAD_REQUEST);
        }

        return await this.remoteDataSource.startFlow(agentUsername, visitorToken, flowId);
    }
}
