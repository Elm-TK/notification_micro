import * as fs from 'fs';
import * as path from 'path';

// Читаем файл token.txt из текущей директории
const tokenFilePath = path.join(__dirname, 'token.txt');
const token = fs.existsSync(tokenFilePath)
    ? fs.readFileSync(tokenFilePath, 'utf-8').trim()
    : '';

// Конфигурация Telegram
export const telegramConfig = {
    botToken: process.env.TELEGRAM_BOT_TOKEN || token,
};
