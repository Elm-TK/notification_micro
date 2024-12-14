import { Kafka } from 'kafkajs';
import { kafkaConfig } from '../src/config'

const kafka = new Kafka({
    clientId: kafkaConfig.clientId,
    brokers: kafkaConfig.brokers,
});

const producer = kafka.producer();

const sendMessage = async (chatId: string, text: string) => {
    try {
        // Подключаемся к продюсеру
        await producer.connect();
        console.log('Producer connected');

        // Формируем сообщение
        const message = {
            chatId,
            text,
        };

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
    } finally {
        await producer.disconnect();
        console.log('Producer disconnected');
    }
};

// Пример отправки сообщения
sendMessage('2026620172', 'САСАТЬ');
