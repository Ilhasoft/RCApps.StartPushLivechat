import { IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';

export default interface IAppRemoteDataSource {

    startFlowRemote(agentId: string, contactUuid: string, flowId: string): Promise<IHttpResponse>;

    startFlowCommand(agentId: string, contactUrn: string, flowId: string): Promise<IHttpResponse>;

}
