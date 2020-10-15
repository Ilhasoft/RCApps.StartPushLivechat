import { IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';

import IContact from '../../domain/Contact';

export default interface IAppRepository {

    startFlowRemote(agentId: string, contactUuid: string, flowId: string): Promise<IHttpResponse>;

    startFlowCommand(agentUsername: string, contactUrn: string, flowId: string): Promise<IHttpResponse>;

    getContact(contactUrn: string): Promise<IContact | undefined>;
}
