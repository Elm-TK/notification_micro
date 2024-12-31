import "reflect-metadata";
import {TelegramService} from "./infrastructure/services/telegram.service";
import {startKafkaConsumer} from "./infrastructure/services/kafka.service";
import {DatabaseService} from "./infrastructure/services/db.service";
import {GatewayService} from "./infrastructure/services/gateway.service";

const db = new DatabaseService();

const initializeServices = async () => {
    await db.initialize();
    const gatewayService = new GatewayService(db);

    const telegramService = new TelegramService(gatewayService, db);
    telegramService.launch()
    const kafka = startKafkaConsumer(telegramService);
};

initializeServices().catch(console.error);
