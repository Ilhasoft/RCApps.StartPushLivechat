import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';

import AppRepositoryImpl from '../data/app/AppRepositoryImpl';
import AppError from '../domain/AppError';
import AppInternalDataSource from '../local/internal/AppInternalDataSource';
import AppRemoteDataSource from '../remote/app/AppRemoteDataSource';
import { CONFIG_FLOW_ID, CONFIG_RAPIDPRO_AUTH_TOKEN, CONFIG_RAPIDPRO_URL } from '../settings/Constants';
import RequestBodyValidator from '../utils/RequestBodyValidator';

export class StartFlowEndpoint extends ApiEndpoint {

    public path = 'start-flow';

    private bodyConstraints = {
        agentUsername: {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
        contactUuid: {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
    };

    public async get(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponseJSON> {

        await RequestBodyValidator.validate(this.bodyConstraints, request.query);

        const agentUsername = request.query.agentUsername;
        const contactUuid = request.query.contactUuid;
        const flowId = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_FLOW_ID);

        const rapidproUrl = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_RAPIDPRO_URL);
        const secret = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_RAPIDPRO_AUTH_TOKEN);
        const appRepo = new AppRepositoryImpl(
            new AppInternalDataSource(read),
            new AppRemoteDataSource(http, rapidproUrl, secret),
        );

        try {
            const res = await appRepo.startFlowRemote(agentUsername, contactUuid, flowId);
            return this.json({status: res.statusCode, content: {flowResponse: res.content}});
        } catch (e) {
            this.app.getLogger().error(e);

            if (e.constructor.name === AppError.name) {
                return this.json({status: e.statusCode, content: {error: e.message}});
            }

            return this.json({status: HttpStatusCode.INTERNAL_SERVER_ERROR, content: {error: 'Unexpected error'}});
        }
    }

}
