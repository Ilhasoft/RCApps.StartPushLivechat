import { IHttpResponse } from '@rocket.chat/apps-engine/definition/accessors';

export default interface IAppRemoteDataSource {

    startFlow(agentId: string, contactUrn: string, flowId: string, extra: string | undefined): Promise<IHttpResponse>;

    validateContact(contactUrn: string): Promise<IHttpResponse>;

}
