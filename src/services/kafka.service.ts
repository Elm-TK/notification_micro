import {Kafka} from "kafkajs";
import {kafkaConfig} from "../config";
import {TelegramService} from "./telegram.service";
import {DatabaseService} from "./db.service";

const kafka = new Kafka({clientId: kafkaConfig.clientId, brokers: kafkaConfig.brokers});
const consumer = kafka.consumer({groupId: kafkaConfig.groupId});
const telegram = new TelegramService();
const db = new DatabaseService();

export const startKafkaConsumer = async () => {
    try {
        await consumer.connect();
        console.log("Connected to Kafka");

        await consumer.subscribe({topic: kafkaConfig.topic, fromBeginning: false});
        console.log("Subscribing to Kafka");

        await consumer.run({
            eachMessage: async ({message}) => {
                try {
                    const {chatId, text} = JSON.parse(message.value?.toString() || '');
                    console.log(`Получено сообщение из Kafka: ChatID: ${chatId}, Текст: ${text}`);
                    await telegram.sendMessage(chatId, text);
                } catch (error) {
                    console.error('Ошибка при обработке сообщения из Kafka:', error);
                }
            }
        })
    } catch (error) {
        console.error('Ошибка при подключении Kafka Consumer:', error);
    }
}


