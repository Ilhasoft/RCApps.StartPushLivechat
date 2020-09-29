import { IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';

export default interface IAppRepository {

    startFlowRemote(agentUsername: string, contactUuid: string, flowId: string): Promise<IHttpResponse>;

    startFlowCommand(agentUsername: string, contactUrn: string, flowId: string): Promise<IHttpResponse>;
}
