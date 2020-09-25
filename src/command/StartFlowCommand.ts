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

const PATTERN_UUID = `^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`;

export class StartFlowCommand implements ISlashCommand {

    private static readonly ERR_INVALID_COMMAND = 'Invalid command format.';
    private static readonly TXT_INVALID_COMMAND = ':x: Invalid command format! Type `/start-flow help` to see instructions.';
    private static readonly TXT_USAGE_INFO = 'StartPushLivechat is a Rocket.Chat app to start a Flow on Push to an specific agent and contact.\n' +
        'Available operations:\n\n' +
        'To see this help:         `/start-flow help`\n' +
        'To start the flow for a contact: `/start-flow start contact_uuid           (e.g. /start-flow start 8c5a2b94-0b20-413b-bfe2-d68a4119abba)`\n';

    public command: string;
    public i18nParamsExample: string;
    public i18nDescription: string;
    public providesPreview: boolean;

    constructor(private readonly app: StartPushLivechatApp) {
        this.command = 'start-flow';
        this.i18nParamsExample = 'start_flow_message_param_example';
        this.i18nDescription = 'start-flow_message_decription';
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

        try {
            switch (operation) {
                case 'help':
                    return this.sendNotifyMessage(context, modify, StartFlowCommand.TXT_USAGE_INFO);
                case 'start':
                    await this.onRunningCommand(context, modify);
                    const contactUuid = this.getContactUuidFromArgs(context.getArguments());
                    return await this.startFlow(context, read, modify, http, contactUuid);
                default:
                    return await this.onInvalidUsage(context, modify);
            }
        } catch (error) {
            if (error instanceof CommandError) {
                return await this.onInvalidUsage(context, modify);
            }
            this.app.getLogger().error(error);
            const errorMessage = ':x: An error occurred';

            return await this.sendNotifyMessage(context, modify, errorMessage);
        }
    }

    private async startFlow(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, contactUuid: string) {
        console.log('context: ', context);

        // only accept command when it's used on the bot direct message
        if (context.getRoom().type !== RoomType.DIRECT_MESSAGE) {
            return await this.sendNotifyMessage(context, modify, ':exclamation: This command is available only when chatting with the App\'s bot user.');
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
            return await this.sendNotifyMessage(context, modify, ':exclamation: This command is available only when chatting with the App\'s bot user.');
        }
        // only accept commands from livechat agents
        if (!context.getSender().roles.includes('livechat-agent')) {
            return await this.sendNotifyMessage(context, modify, ':exclamation: This command is available only for livechat agents.');
        }

        const flowId = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_FLOW_ID);
        const rapidproUrl = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_RAPIDPRO_URL);
        const secret = await read.getEnvironmentReader().getSettings().getValueById(CONFIG_RAPIDPRO_AUTH_TOKEN);
        const appRepo = new AppRepositoryImpl(
            new AppInternalDataSource(read),
            new AppRemoteDataSource(http, rapidproUrl, secret),
        );

        const res = await appRepo.startFlow(context.getSender().username, contactUuid, flowId);
        if (res.statusCode === HttpStatusCode.CREATED) {
            return await this.sendNotifyMessage(context, modify, ':white_check_mark: The flow was successfully started');
        } else { // the response from push can be 201, but flow room creation can still fail at the middle of a flow
            throw new AppError(`Could not start flow for contact: ${contactUuid}`, res.statusCode);
        }

    }

    private getContactUuidFromArgs(args: Array<string>): string {
        if (args.length !== 2 || !args[1].match(PATTERN_UUID)) {
            throw new CommandError(StartFlowCommand.ERR_INVALID_COMMAND);
        }

        return args[1];
    }

    private async sendNotifyMessage(context: SlashCommandContext, modify: IModify, text: string) {
        const message = modify.getCreator().startMessage()
            .setUsernameAlias('QuickMessage')
            .setEmojiAvatar(':speech_balloon:')
            .setText(text)
            .setRoom(context.getRoom())
            .setSender(context.getSender())
            .getMessage();

        await modify.getNotifier().notifyUser(context.getSender(), message);
    }

    private async sendMessage(context: SlashCommandContext, modify: IModify, text: string) {
        const messageBuilder = modify.getCreator().startMessage()
            .setRoom(context.getRoom())
            .setSender(context.getSender())
            .setText(text);

        await modify.getCreator().finish(messageBuilder);
    }

    private async onRunningCommand(context: SlashCommandContext, modify: IModify) {
        await this.sendNotifyMessage(context, modify, `:desktop: /start-flow ${context.getArguments().join(' ')}`);
    }

    private async onInvalidUsage(context: SlashCommandContext, modify: IModify) {
        await this.sendNotifyMessage(context, modify, StartFlowCommand.TXT_INVALID_COMMAND);
    }

}
