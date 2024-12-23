import "reflect-metadata";
import {TelegramService} from "./infrastructure/services/telegram.service";
import {startKafkaConsumer} from "./infrastructure/services/kafka.service";
import {DatabaseService} from "./infrastructure/services/db.service";

const db = new DatabaseService();

const initializeServices = async () => {
    await db.initialize(); // Ожидание инициализации БД
    console.log('Database initialized');

    // // Ожидание 30 секунд
    // await new Promise(resolve => setTimeout(resolve, 30000));
    // console.log('Waited for 30 seconds');
    // db.saveUser('temirlan200370@gmail.com', 2026620172)

    const telegramService = new TelegramService();
    const kafka = startKafkaConsumer(db);
    telegramService.sendMessage(2026620172, "Hello", "Hello f");
};

initializeServices().catch(console.error);
