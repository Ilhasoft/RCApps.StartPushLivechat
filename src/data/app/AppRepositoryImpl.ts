import { HttpStatusCode, IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';

import AppError from '../../domain/AppError';
import CommandError from '../../domain/CommandError';
import IContact from '../../domain/Contact';
import IAppInternalDataSource from '../internal/IAppInternalDataSource';
import IAppRemoteDataSource from '../remote/IAppRemoteDataSource';
import IAppRepository from './IAppRepository';

export default class AppRepositoryImpl implements IAppRepository {

    constructor(
        private readonly internalDataSource: IAppInternalDataSource,
        private readonly remoteDataSource: IAppRemoteDataSource,
    ) { }

    public async startFlow(agentId: string, contactUrn: string, flowId: string, extra: string | undefined): Promise<IHttpResponse> {
        const agent = await this.internalDataSource.getAgentById(agentId);

        if (!agent) {
            throw new AppError(`Could not find agent: ${agentId}`, HttpStatusCode.BAD_REQUEST);
        }

        return await this.remoteDataSource.startFlow(agentId, contactUrn, flowId, extra);
    }

    public async getContact(contactUrn: string): Promise<IContact | undefined> {
        const res = await this.remoteDataSource.validateContact(contactUrn);

        if (!res || res.statusCode !== 200) {
            throw new CommandError(`Connection error, could not validate contact: ${contactUrn}, Status: ${res.statusCode}`);
        }

        if (res.data.results.length === 0) {
            return undefined;
        }

        return res.data.results[0] as IContact;

    }

}
