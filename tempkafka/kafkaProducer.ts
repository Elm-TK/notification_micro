import {Kafka} from 'kafkajs';
import {kafkaConfig} from '../src/infrastructure/config';
import {MessageDTO} from "../src/core/dtos/MessageDTO";

const kafka = new Kafka({
    clientId: kafkaConfig.clientId,
    brokers: kafkaConfig.brokers,
});

const producer = kafka.producer();

const sendMessage = async (message: MessageDTO) => {
    try {
        // Отправляем сообщение
        await producer.send({
            topic: kafkaConfig.topic,
            messages: [
                {
                    value: JSON.stringify(message),
                },
            ],
        });

        console.log(`Message sent: ${JSON.stringify(message)}`);
    } catch (error) {
        console.error('Error sending message:', error);
    }
};

// Инициализация продюсера и подключение
const run = async () => {
    await producer.connect();
    console.log('Producer connected');

    // Пример отправки сообщения
    const message = new MessageDTO('tg', 'temirlan200370@gmail.com', 'Молоко убежало', 'У тебя убежало молоко');
    await sendMessage(message);

    // Отключение продюсера после отправки
    await producer.disconnect();
    console.log('Producer disconnected');
};

run().catch(console.error);
