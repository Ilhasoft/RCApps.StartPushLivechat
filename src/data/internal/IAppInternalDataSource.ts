import { IUser } from '@rocket.chat/apps-engine/definition/users';

export default interface IAppInternalDataSource {

    getAgentById(agentId: string): Promise<IUser | undefined>;

}
