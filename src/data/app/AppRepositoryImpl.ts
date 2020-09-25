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

    public async startFlow(agentId: string, visitorToken: string, flowId: string): Promise<IHttpResponse> {
        const agent = await this.internalDataSource.getAgentById(agentId);

        if (!agent) {
            throw new AppError(`Could not find agent:  ${agentId}`, HttpStatusCode.BAD_REQUEST);
        }

        return await this.remoteDataSource.startFlow(agentId, visitorToken, flowId);
    }
}
