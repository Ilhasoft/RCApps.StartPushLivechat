import { IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';

export default interface IAppRemoteDataSource {

    startFlow(agentId: string, visitorToken: string, flowId: string): Promise<IHttpResponse>;

}
