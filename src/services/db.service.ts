import {databaseConfig} from "../config";
import {DataSource} from "typeorm";
import {Notification} from "../entities/Notification";

export class DatabaseService {
    private dataSource: DataSource;

    constructor() {
        this.dataSource = new DataSource({
            type: 'postgres',
            host: databaseConfig.host,
            port: databaseConfig.port,
            username: databaseConfig.username,
            password: databaseConfig.password,
            database: databaseConfig.database,
            entities: databaseConfig.entities,
        })
    }

    async initialize() {
        await this.dataSource.initialize();
        console.log('Database connected');
    }

    async saveNotification(chatId: string, text: string, status: string, retry_count?: number): Promise<Notification> {
        const notification = new Notification(chatId, text, status, retry_count);

        const notificationRepository = this.dataSource.getRepository(Notification);
        return await notificationRepository.save(notification);
    }

    async getNotifications(): Promise<Notification[]> {
        const notificationRepository = this.dataSource.getRepository(Notification);
        return await notificationRepository.find();
    }
}