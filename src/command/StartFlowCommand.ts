import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { StartPushLivechatApp } from '../../StartPushLivechatApp';
import AppRepositoryImpl from '../data/app/AppRepositoryImpl';
import IAppRepository from '../data/app/IAppRepository';
import AppError from '../domain/AppError';
import CommandError from '../domain/CommandError';
import { validate } from '../lib/validatejs/0_13_1/validate';
import AppInternalDataSource from '../local/internal/AppInternalDataSource';
import AppRemoteDataSource from '../remote/app/AppRemoteDataSource';
import { CONFIG_FLOW_ID, CONFIG_RAPIDPRO_AUTH_TOKEN, CONFIG_RAPIDPRO_URL } from '../settings/Constants';

const WAID_PATTERN = '^55[0-9]{2}9?[0-9]{8}$';

export class StartFlowCommand implements ISlashCommand {

    private static readonly ERR_INVALID_COMMAND = 'Formato do comando é inválido.';
    private static readonly TXT_INVALID_COMMAND = ':x: Formato do comando é inválido! Digite `/iniciar-conversa ajuda` para ver as instruções.';
    private static readonly TXT_USAGE_INFO = 'StartPushLivechat é um aplicativo para o Rocket.Chat com objetivo de iniciar um fluxo para um agente ' +
        'e contato específico.\nOperações disponíveis:\n\n' +
        'Para ver esta ajuda:         `/iniciar-conversa ajuda`\n' +
        'Para iniciar um fluxo para um contato: `/iniciar-conversa <canal> urn_do_contato           (e.g. /iniciar-conversa whatsapp +55(82)95555-5555)`\n';

    public command: string;
    public i18nParamsExample: string;
    public i18nDescription: string;
    public providesPreview: boolean;

    constructor(private readonly app: StartPushLivechatApp) {
        this.command = 'iniciar-conversa';
        this.i18nParamsExample = 'iniciar_conversa_message_param_example';
        this.i18nDescription = 'iniciar_conversa_message_decription';
        this.providesPreview = false;
    }

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
        if (context.getArguments().length === 0) {
            return await this.onInvalidUsage(context, modify);
        }
        const operation = context.getArguments()[0];
        let contactUrn: string;
        let rawUrn: string | undefined;

        try {
            switch (operation) {
                case 'ajuda':
                    return this.sendNotifyMessage(context, modify, StartFlowCommand.TXT_USAGE_INFO);
                case 'whatsapp':
                    await this.onRunningCommand(context, modify);
                    rawUrn = this.getContactUrnFromArgs(context.getArguments(), operation);
                    contactUrn = `${operation}:${rawUrn}`;
                    return await this.startFlow(context, read, modify, http, contactUrn);
                case 'telegram':
                    await this.onRunningCommand(context, modify);
                    rawUrn = this.getContactUrnFromArgs(context.getArguments(), operation);
                    contactUrn = `${operation}:${rawUrn}`;
                    return await this.startFlow(context, read, modify, http, contactUrn);
                default:
                    return await this.onInvalidUsage(context, modify);
            }
        } catch (error) {
            this.app.getLogger().error(error);
            if (error instanceof CommandError) {
                return await this.onInvalidUsage(context, modify, error.message);
            }
            const errorMessage = ':x: ' + error.message;

            return await this.sendNotifyMessage(context, modify, errorMessage);
        }
    }

    private async startFlow(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, contactUrn: string) {
        // only accept command when it's used on the bot direct message
        if (context.getRoom().type !== RoomType.DIRECT_MESSAGE) {
            throw new CommandError('Este comando só está disponível quando utilizado com o usuário Bot do Aplicativo.');
        }

        const usersIds = context.getRoom().userIds;
        const senderId = context.getSender().id;
        if (!usersIds) { return; }
        const recipientUserId = usersIds.filter((value, index, arr) => {
            return value !== senderId;
        })[0];
        const appUser = await read.getUserReader().getAppUser(this.app.getID());
        // only accept command when it's used on the bot direct message
        if (appUser!.id !== recipientUserId) {
            throw new CommandError('Este comando só está disponível quando utilizado com o usuário Bot do Aplicativo.');
        }
        // only accept commands from livechat agents
        if (!context.getSender().roles.includes('livechat-agent')) {
            throw new CommandError('Este comando só está disponível para agentes livechat.');
        }

        const flowId = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_FLOW_ID);
        const rapidproUrl = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_RAPIDPRO_URL);
        const secret = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_RAPIDPRO_AUTH_TOKEN);
        const appRepo = new AppRepositoryImpl(
            new AppInternalDataSource(read),
            new AppRemoteDataSource(http, rapidproUrl, secret),
        );

        const [isValidUrn, validUrn] =  await this.validateURN(appRepo, contactUrn);
        if (!isValidUrn) {
            throw new CommandError(`Não foi possível encontrar o contato: ${contactUrn}`);
        }
        contactUrn = validUrn;

        const res = await appRepo.startFlowCommand(context.getSender().username, contactUrn, flowId);
        if (res.statusCode === HttpStatusCode.CREATED) {
            return await this.sendNotifyMessage(context, modify, ':white_check_mark: O Fluxo foi iniciado com sucesso');
        } else {
            throw new CommandError(`Não foi possível iniciar o fluxo para o contato: ${contactUrn}`);
        }

    }

    private async validateURN(appRepo: IAppRepository, urn: string): Promise<[boolean, string]> {
        const [scheme, specific] = urn.split(':');

        if (scheme === 'whatsapp') {
            return await this.validateWhatsAppURN(appRepo, urn);
        }

        return [true, urn];
    }

    private async validateWhatsAppURN(appRepo: IAppRepository, urn: string): Promise<[boolean, string]> {

        let isValid = await appRepo.validateContact(urn);
        if (isValid) {
            return [true, urn];
        }

        // segunda tentativa
        const [scheme, specific] = urn.split(':');
        const countryCodeAndDDD = specific.substring(0, 4);
        const contactNumber = specific.substring(4);
        if (contactNumber.length === 9) {
            urn = `${scheme}:${countryCodeAndDDD}${contactNumber.substring(1)}`;
        } else {
            urn = `${scheme}:${countryCodeAndDDD}9${contactNumber}`;
        }

        isValid = await appRepo.validateContact(urn);

        return [isValid, urn];
    }

    private getContactUrnFromArgs(args: Array<string>, type: string): string {
        if (args.length !== 2) {
            throw new CommandError(StartFlowCommand.ERR_INVALID_COMMAND);
        }

        const urn = args[1];
        let trimmed: string;

        switch (type) {
            case 'whatsapp':
                trimmed = urn.replace(/[- )(+]/g, '');
                // check if urn has country code, if not add the default brazilian +55
                if (trimmed.length <= 11) { // maximum length with ddd and the newer 9
                    trimmed = '55' + trimmed;
                }
                if (trimmed.match(WAID_PATTERN)) {
                    return trimmed;
                } else {
                    throw new CommandError('Número do WhatsApp possui formato inválido. Digite "/iniciar-conversa ajuda" para instruções');
                }
            case 'telegram':
                return urn;
            default:
                throw new CommandError('Canal desconhecido. Digite "/iniciar-conversa ajuda" para instruções');
        }

    }

    private async sendNotifyMessage(context: SlashCommandContext, modify: IModify, text: string) {
        const message = modify.getCreator().startMessage()
            .setUsernameAlias('StartPushLivechat')
            .setEmojiAvatar(':speech_balloon:')
            .setText(text)
            .setRoom(context.getRoom())
            .setSender(context.getSender())
            .getMessage();

        await modify.getNotifier().notifyUser(context.getSender(), message);
    }

    private async onRunningCommand(context: SlashCommandContext, modify: IModify) {
        await this.sendNotifyMessage(context, modify, `:desktop: /iniciar-conversa ${context.getArguments().join(' ')}`);
    }

    private async onInvalidUsage(context: SlashCommandContext, modify: IModify, text?: string) {
        await this.sendNotifyMessage(context, modify, text ? `:x: ${text}` : StartFlowCommand.TXT_INVALID_COMMAND);
    }

}
