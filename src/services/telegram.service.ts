import axios from 'axios';
import { telegramConfig } from '../config';

export class TelegramService {
    async sendMessage(chatId: string, text: string) {
        try {
            const url = `https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`;
            await axios.post(url, { chat_id: chatId, text });
        }
        catch (error) {
            await db.saveNotification(chatId, text, "OK");
        }
    }
}
