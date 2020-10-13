import { IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';

export default interface IAppRepository {

    startFlowRemote(agentId: string, contactUuid: string, flowId: string): Promise<IHttpResponse>;

    startFlowCommand(agentUsername: string, contactUrn: string, flowId: string): Promise<IHttpResponse>;

    validateContact(contactUrn: string): Promise<boolean>;
}
