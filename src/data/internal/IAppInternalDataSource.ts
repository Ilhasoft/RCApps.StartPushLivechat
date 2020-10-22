import { IUser } from '@rocket.chat/apps-engine/definition/users';

export default interface IAppInternalDataSource {

    getAgentByUsername(agentUsername: string): Promise<IUser | undefined>;

    getAgentById(agentId: string): Promise<IUser | undefined>;
}
