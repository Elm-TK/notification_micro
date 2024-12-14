import {TelegramService} from "./services/telegram.service";
import {startKafkaConsumer} from "./services/kafka.service";

const telegramService = new TelegramService();
const kafka = startKafkaConsumer();
console.log(kafka);
telegramService.sendMessage("2026620172","Hello");