import { IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';

import IContact from '../../domain/Contact';

export default interface IAppRepository {

    startFlow(agentUsername: string, contactUrn: string, flowId: string): Promise<IHttpResponse>;

    getContact(contactUrn: string): Promise<IContact | undefined>;
}
