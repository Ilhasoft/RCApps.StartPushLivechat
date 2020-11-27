import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { IApiResponseJSON } from '@rocket.chat/apps-engine/definition/api/IResponse';

import AppRepositoryImpl from '../data/app/AppRepositoryImpl';
import AppError from '../domain/AppError';
import AppInternalDataSource from '../local/internal/AppInternalDataSource';
import AppRemoteDataSource from '../remote/app/AppRemoteDataSource';
import { CONFIG_FLOW_ID, CONFIG_RAPIDPRO_AUTH_TOKEN, CONFIG_RAPIDPRO_URL, COOKIE_RC_USER_ID, RC_SERVER_URL } from '../settings/Constants';
import CookieExtractor from '../utils/CookieExtractor';
import RequestBodyValidator from '../utils/RequestBodyValidator';
import URNValidator from '../utils/URNValidator';

export class StartFlowEndpoint extends ApiEndpoint {

    public path = 'start-flow';

    private bodyConstraints = {
        contactUrn: {
            presence: {
                allowEmpty: false,
            },
            type: 'string',
        },
        extra: {
            presence: false,
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

        const contactUrn = request.query.contactUrn;
        const extra = request.query.extra;
        const flowId = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_FLOW_ID);

        const rapidproUrl = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_RAPIDPRO_URL);
        const secret = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_RAPIDPRO_AUTH_TOKEN);
        const appRepo = new AppRepositoryImpl(
            new AppInternalDataSource(read),
            new AppRemoteDataSource(http, rapidproUrl, secret),
        );

        try {
            if (!request.headers.cookie) {
                throw new AppError('Missing cookie header', HttpStatusCode.BAD_REQUEST);
            }
            const cookiesExtractor = new CookieExtractor(request.headers.cookie);
            const agentId = cookiesExtractor.getCookie(COOKIE_RC_USER_ID);

            const UrnValidator = new URNValidator();

            const [isValidUrn, validUrn, contactName] = await UrnValidator.validateURN(appRepo, contactUrn);
            if (!isValidUrn) {
                throw new AppError(`Invalid URN: ${contactUrn}`, HttpStatusCode.BAD_REQUEST);
            }

            await appRepo.startFlow(agentId, validUrn, flowId, extra);
            const serverUrl = await read.getEnvironmentReader().getServerSettings().getValueById(RC_SERVER_URL);
            return this.json({ status: HttpStatusCode.TEMPORARY_REDIRECT, headers: { Location: serverUrl } });
        } catch (e) {
            this.app.getLogger().error(e);

            if (e.constructor.name === AppError.name) {
                return this.json({ status: e.statusCode, content: { error: e.message } });
            }

            return this.json({ status: HttpStatusCode.INTERNAL_SERVER_ERROR, content: { error: 'Unexpected error' } });
        }
    }

}
