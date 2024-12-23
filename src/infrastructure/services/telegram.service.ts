import axios from 'axios';
import {telegramConfig} from '../config';

export class TelegramService {
    async sendMessage(chatId: number, title: string, text: string): Promise<{ success: boolean; error?: string }> {
        const url = `https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`;

        // Форматируем сообщение
        const formattedText = `<b>${title}</b>\n\n${text}`;

        try {
            await axios.post(url, {
                chat_id: chatId,
                text: formattedText,
                parse_mode: 'HTML', // Указываем HTML режим для поддержки форматирования
            });
            return {success: true};
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Unknown error',
            };
        }
    }
}
