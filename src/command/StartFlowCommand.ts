import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { StartPushLivechatApp } from '../../StartPushLivechatApp';
import AppRepositoryImpl from '../data/app/AppRepositoryImpl';
import AppError from '../domain/AppError';
import CommandError from '../domain/CommandError';
import AppInternalDataSource from '../local/internal/AppInternalDataSource';
import AppRemoteDataSource from '../remote/app/AppRemoteDataSource';
import { CONFIG_FLOW_ID, CONFIG_RAPIDPRO_AUTH_TOKEN, CONFIG_RAPIDPRO_URL } from '../settings/Constants';

export class StartFlowCommand implements ISlashCommand {

    private static readonly ERR_INVALID_COMMAND = 'Formato do comando é inválido.';
    private static readonly TXT_INVALID_COMMAND = ':x: Formato do comando é inválido! Digite `/iniciar-conversa ajuda` para ver as instruções.';
    private static readonly TXT_USAGE_INFO = 'StartPushLivechat é um aplicativo para o Rocket.Chat para iniciar um fluxo para um agente ' +
        'e contato específico.\nOperações disponíveis:\n\n' +
        'Para ver esta ajuda:         `/iniciar-conversa ajuda`\n' +
        'Para iniciar um fluxo para um contato: `/iniciar-conversa <canal> urn_do_contato           (e.g. /iniciar-conversa whatsapp +5555555555555)`\n';

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

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<void> {
        if (context.getArguments().length === 0) {
            return await this.onInvalidUsage(context, modify);
        }
        const operation = context.getArguments()[0];
        let contactUrn: string;

        try {
            switch (operation) {
                case 'ajuda':
                    return this.sendNotifyMessage(context, modify, StartFlowCommand.TXT_USAGE_INFO);
                case 'whatsapp':
                    await this.onRunningCommand(context, modify);
                    contactUrn = 'whatsapp:' + this.getContactUrnFromArgs(context.getArguments());
                    return await this.startFlow(context, read, modify, http, contactUrn);
                case 'telegram':
                    await this.onRunningCommand(context, modify);
                    contactUrn = 'telegram:' + this.getContactUrnFromArgs(context.getArguments());
                    return await this.startFlow(context, read, modify, http, contactUrn);
                default:
                    return await this.onInvalidUsage(context, modify);
            }
        } catch (error) {
            if (error instanceof CommandError) {
                return await this.onInvalidUsage(context, modify);
            }
            this.app.getLogger().error(error);
            const errorMessage = ':x: ' + error.message;

            return await this.sendNotifyMessage(context, modify, errorMessage);
        }
    }

    private async startFlow(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, contactUrn: string) {
        // only accept command when it's used on the bot direct message
        if (context.getRoom().type !== RoomType.DIRECT_MESSAGE) {
            return await this.sendNotifyMessage(context, modify, ':exclamation: Este comando só está disponível quando utilizado com o usuário Bot do Aplicativo.');
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
            return await this.sendNotifyMessage(context, modify, ':exclamation: Este comando só está disponível quando utilizado com o usuário Bot do Aplicativo.');
        }
        // only accept commands from livechat agents
        if (!context.getSender().roles.includes('livechat-agent')) {
            return await this.sendNotifyMessage(context, modify, ':exclamation: Este comando só está disponível para agentes livechat.');
        }

        const flowId = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_FLOW_ID);
        const rapidproUrl = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_RAPIDPRO_URL);
        const secret = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_RAPIDPRO_AUTH_TOKEN);
        const appRepo = new AppRepositoryImpl(
            new AppInternalDataSource(read),
            new AppRemoteDataSource(http, rapidproUrl, secret),
        );

        // validate contact, if invalid throws error
        await appRepo.validateContact(contactUrn);

        const res = await appRepo.startFlowCommand(context.getSender().username, contactUrn, flowId);
        if (res.statusCode === HttpStatusCode.CREATED) {
            return await this.sendNotifyMessage(context, modify, ':white_check_mark: O Fluxo foi iniciado com sucesso');
        } else { // the response from push can be 201, but flow room creation can still fail at the middle of a flow
            throw new AppError(`Não foi possível iniciar o fluxo para o contato: ${contactUrn}`, res.statusCode);
        }

    }

    private getContactUrnFromArgs(args: Array<string>): string {
        if (args.length !== 2) {
            throw new CommandError(StartFlowCommand.ERR_INVALID_COMMAND);
        }

        return args[1];
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

    private async onInvalidUsage(context: SlashCommandContext, modify: IModify) {
        await this.sendNotifyMessage(context, modify, StartFlowCommand.TXT_INVALID_COMMAND);
    }

}
