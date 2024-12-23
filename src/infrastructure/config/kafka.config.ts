export const kafkaConfig = {
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    clientId: 'notification-service',
    groupId: 'notification-group',
    topic: 'notifications',
};
