import {Kafka} from "kafkajs";
import {kafkaConfig} from "../config";
import {TelegramService} from "./telegram.service";
import {DatabaseService} from "./db.service";
import {MessageDTO} from "../../core/dtos/MessageDTO";

const kafka = new Kafka({clientId: kafkaConfig.clientId, brokers: kafkaConfig.brokers});
const consumer = kafka.consumer({groupId: kafkaConfig.groupId});
const telegram = new TelegramService();

export const startKafkaConsumer = async (db: DatabaseService) => {
    try {
        await consumer.connect();
        console.log("Connected to Kafka");

        await consumer.subscribe({topic: kafkaConfig.topic, fromBeginning: false});
        console.log("Subscribing to Kafka");

        await consumer.run({
            eachMessage: async ({message}) => {
                try {
                    const {type, address, title, message: text} = JSON.parse(message.value?.toString() || '');
                    const messageDTO = new MessageDTO(type, address, title, text);

                    console.log(`Получено сообщение из Kafka: Type: ${messageDTO.type}, Address: ${messageDTO.address}, Title: ${messageDTO.title}, Message: ${messageDTO.message}`);

                    if (messageDTO.type === 'tg') {
                        const user = await db.getUserByEmail(messageDTO.address);
                        const chatId = user ? user.chatId : null;

                        if (chatId) {
                            const result = await telegram.sendMessage(chatId, messageDTO.title, messageDTO.message);
                            if (result) {
                                await db.saveNotification(address, title, text, 'OK')
                            } else {
                                await db.saveNotification(address, title, text, 'ERROR', 1);
                            }
                        } else {
                            console.warn("Некорректный тип сообщения или адрес для отправки в Telegram");
                        }
                    }
                } catch (error) {
                    console.error('Ошибка при обработке сообщения из Kafka:', error);
                }
            }
        });
    } catch (error) {
        console.error('Ошибка при подключении Kafka Consumer:', error);
    }
}
