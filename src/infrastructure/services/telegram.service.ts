import {Telegraf, Markup} from 'telegraf';
import {telegramConfig} from '../config';
import {MessageDTO} from '../../core/dtos/MessageDTO';
import {GatewayService} from "./gateway.service";
import {DatabaseService} from "./db.service";
import {Notification} from "../../core/entities/Notification";
import {logger} from "./logger";

export class TelegramService {
    private bot: Telegraf;
    private gatewayService: GatewayService;
    private db: DatabaseService;
    private readonly retryInterval: number;
    private users: Map<number, {
        emails: string[];
        notificationData?: Partial<MessageDTO>;
        editingField?: keyof MessageDTO
    }>;

    constructor(gateway: GatewayService, db: DatabaseService, retryInterval: number = 300000) {
        this.gatewayService = gateway;
        this.db = db
        this.bot = new Telegraf(telegramConfig.botToken);
        this.users = new Map();
        this.retryInterval = retryInterval;

        this.bot.start((ctx) => this.handleStart(ctx));
        this.bot.on('text', (ctx) => this.handleTextInput(ctx));
        this.bot.on('callback_query', (ctx) => this.handleCallback(ctx));

        this.initRetry();
    }

    private async handleStart(ctx: any) {
        const chatId = ctx.chat.id;
        this.users.set(chatId, {emails: []});
        await ctx.reply('Добро пожаловать! Выберите действие:', this.renderMenu());
    }

    private async handleTextInput(ctx: any) {
        const chatId = ctx.chat.id;
        const userState = this.users.get(chatId);

        if (!userState) return;

        const text = ctx.message.text;

        if (userState.editingField) {
            const editingField = userState.editingField;
            if (!userState.notificationData) {
                userState.notificationData = {};
            }
            userState.notificationData[editingField] = text;
            userState.editingField = undefined;

            await ctx.reply(
                `Поле "${editingField}" обновлено. Уведомление:\n\nТип: ${userState.notificationData.type}\nАдрес: ${userState.notificationData.address}\nЗаголовок: ${userState.notificationData.title}\nТекст: ${userState.notificationData.message}`,
                this.renderEditOptions()
            );
            return;
        }

        if (userState.notificationData) {
            const {notificationData} = userState;

            if (!notificationData.type) {
                notificationData.type = text as 'email' | 'tg' | 'push';
                await ctx.reply('Введите адрес (email):');
                return;
            }

            if (!notificationData.address) {
                notificationData.address = text;
                await ctx.reply('Введите заголовок уведомления:');
                return;
            }

            if (!notificationData.title) {
                notificationData.title = text;
                await ctx.reply('Введите текст уведомления:');
                return;
            }

            if (!notificationData.message) {
                notificationData.message = text;
                await ctx.reply(
                    `Ваше уведомление готово:\n\nТип: ${notificationData.type}\nАдрес: ${notificationData.address}\nЗаголовок: ${notificationData.title}\nТекст: ${notificationData.message}`,
                    this.renderEditOptions()
                );
                return;
            }
        } else {
            userState.emails.push(text);
            await this.db.saveUser(text, chatId)
            ctx.reply(`Email "${text}" зарегистрирован. Выберите действие:`, this.renderMenu());
        }
    }

    private async handleCallback(ctx: any) {
        const chatId = ctx.chat.id;
        const userState = this.users.get(chatId);

        if (!userState) return;

        const data = ctx.callbackQuery.data;

        if (data === 'register_email') {
            await ctx.reply('Введите свой email:');
            return;
        }

        if (data === 'create_notification') {
            userState.notificationData = {};
            await ctx.reply('Введите тип уведомления (email, tg, push):');
            return;
        }

        if (data.startsWith('edit_')) {
            const field = data.split('_')[1] as keyof MessageDTO;
            userState.editingField = field;
            await ctx.reply(`Введите новое значение для поля "${field}":`);
            return;
        }

        if (data === 'confirm') {
            const {notificationData} = userState;

            if (notificationData) {
                const notification = new Notification(notificationData.address!, notificationData.title!, notificationData.message!)
                notification.type = notificationData.type!;
                await this.gatewayService.sendNotification(notification);
                await ctx.reply('Уведомление отправлено.');
                await ctx.reply('Что вы хотите сделать?', this.renderMenu());
            }
            return;
        }
    }

    private renderMenu() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('Зарегистрировать email', 'register_email')],
            [Markup.button.callback('Отправить уведомление', 'create_notification')],
        ]);
    }

    private renderEditOptions() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('Редактировать тип', 'edit_type')],
            [Markup.button.callback('Редактировать адрес', 'edit_address')],
            [Markup.button.callback('Редактировать заголовок', 'edit_title')],
            [Markup.button.callback('Редактировать текст', 'edit_message')],
            [Markup.button.callback('Подтвердить', 'confirm')],
        ]);
    }

    async sendMessage(messageDTO: MessageDTO, retry: boolean = false, retryCount = 0) {
        const user = await this.db.getUserByEmail(messageDTO.address);
        const chatId = user ? user.chatId : null;
        if (chatId) {
            const formattedText = `Получено уведомление на адрес <i>${messageDTO.address}</i>\n\n<b>${messageDTO.title.toUpperCase()}</b>\n\n${messageDTO.message}`;
            const result = await this.bot.telegram.sendMessage(chatId, formattedText, {parse_mode: 'HTML'});
            if (result) {
                const notification = new Notification(messageDTO.address, messageDTO.title, messageDTO.message, 'OK')
                if (retry) {
                    notification.status = "FAILED"
                    await this.db.updateNotification(notification, {
                        status: 'OK',
                        retryCount: notification.retryCount! + 1
                    });
                } else {
                    await this.db.saveNotification(notification);
                }
                logger.info('Уведомление отправлено пользователю из Kafka получено', messageDTO);
            }
        } else {
            const notification = new Notification(messageDTO.address, messageDTO.title, messageDTO.message, 'ERROR', 1)
            if (retry) {
                notification.retryCount = retryCount + 1
            }
            await this.db.saveNotification(notification);
            console.warn("Пользователь не найден: ", messageDTO.address);
            logger.error("Ошибка при отправке уведомления: \nПользователь не найден: ", messageDTO.address);
        }
    }

    async retrySending() {
        const notifications = await this.db.getNotificationsByStatus("FAILED")
        for (const notification of notifications) {
            await this.sendMessage(new MessageDTO(
                    notification.type,
                    notification.address,
                    notification.title,
                    notification.message)
                , true, notification.retryCount);
        }
    }

    async initRetry() {
        await this.retrySending()

        setInterval(async () => {
            await this.retrySending()
        }, this.retryInterval)
    }

    async launch() {
        await this.bot.launch();
        console.log('Telegram bot started.');
    }
}
