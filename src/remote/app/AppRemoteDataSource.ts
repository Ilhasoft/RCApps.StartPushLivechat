import { IHttp, IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';

import IAppRemoteDataSource from '../../data/remote/IAppRemoteDataSource';

export default class AppRemoteDataSource implements IAppRemoteDataSource {

    constructor(
        private readonly http: IHttp,
        private readonly rapidproUrl: string,
        private readonly rapidproSecret: string,
    ) {}

    public async startFlowRemote(agentId: string, contactUuid: string, flowId: string): Promise<IHttpResponse> {

        const reqOptions = this.requestOptions();
        reqOptions['data'] = {
            flow: flowId,
            contacts: [contactUuid],
            extra: {
                agentId,
            },
        };

        return await this.http.post(`${this.rapidproUrl}/api/v2/flow_starts.json`, reqOptions);
    }

    public async startFlowCommand(agentId: string, contactUrn: string, flowId: string): Promise<IHttpResponse> {

        const reqOptions = this.requestOptions();
        reqOptions['data'] = {
            flow: flowId,
            urns: [contactUrn],
            extra: {
                agentId,
            },
        };

        return await this.http.post(`${this.rapidproUrl}/api/v2/flow_starts.json`, reqOptions);
    }

    private requestOptions(): object {
        return {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${this.rapidproSecret}`,
            },
        };
    }

}
