import {databaseConfig} from "../config";
import {DataSource} from "typeorm";
import {NotificationEntity} from "../database/entities/NotificationEntity";
import {UserEntity} from "../database/entities/UserEntity";
import {Notification} from "../../core/entities/Notification";
import {User} from "../../core/entities/User";
import {PendingGatewayNotificationEntity} from "../database/entities/PendingGatewayNotificationEntity";

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
            entities: [NotificationEntity, UserEntity, PendingGatewayNotificationEntity],
            synchronize: true,
        });
    }

    async initialize() {
        try {
            const dbExists = await this.checkDatabaseExists();

            if (!dbExists) {
                await this.createDatabase();
                console.log(`База данных ${databaseConfig.database} создана`);
            }

            await this.dataSource.initialize();
            console.log('Database connected');
            console.log('Registered entities:', this.dataSource.entityMetadatas.map(meta => meta.name));

        } catch (error) {
            console.error('Error during database initialization:', error);
        }
    }

    private async checkDatabaseExists(): Promise<boolean> {
        const connection = new DataSource({
            type: 'postgres',
            host: databaseConfig.host,
            port: databaseConfig.port,
            username: databaseConfig.username,
            password: databaseConfig.password,
            database: 'postgres',
        });

        await connection.initialize();

        const result = await connection.query(`
            SELECT 1 FROM pg_database WHERE datname = $1
        `, [databaseConfig.database]);

        await connection.destroy();
        return result.length > 0;
    }

    private async createDatabase(): Promise<void> {
        const connection = new DataSource({
            type: 'postgres',
            host: databaseConfig.host,
            port: databaseConfig.port,
            username: databaseConfig.username,
            password: databaseConfig.password,
            database: 'postgres',
        });

        await connection.initialize();

        await connection.query(`
            CREATE DATABASE "${databaseConfig.database}"
        `);
        await connection.destroy();
    }

    // Методы работы с уведомлениями
    async saveNotification(notification: Notification): Promise<void> {
        const notificationEntity = NotificationEntity.fromNotification(notification);

        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        const savedEntity = await notificationRepository.save(notificationEntity);
    }

    async getNotifications(): Promise<Notification[]> {
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        const entities = await notificationRepository.find();
        return entities.map(entity => entity.toNotification());
    }

    async getNotificationsByStatus(status: string): Promise<Notification[]> {
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        const entities = await notificationRepository.find({where: {status}});
        return entities.map(entity => entity.toNotification());
    }

    async updateNotification(
        notification: Notification,
        updates: { status?: string; retryCount?: number }
    ): Promise<void> {
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);

        await notificationRepository.update({
            type: notification.type,
            email: notification.address,
            title: notification.title,
            message: notification.message,
            status: notification.status,
            retryCount: notification.retryCount,
        }, updates);
    }


    async updateNotificationStatus(id: number, status: string): Promise<void> {
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        await notificationRepository.update(id, {status});
    }

    async updateRetryCount(id: number, retryCount: number): Promise<void> {
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        await notificationRepository.update(id, {retryCount});
    }

    async deleteNotificationById(id: number): Promise<void> {
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        await notificationRepository.delete(id);
    }

    // Методы работы с отложенными уведомлениями
    async getPendingGatewayNotifications(): Promise<Notification[]> {
        const pendingRepository = this.dataSource.getRepository(PendingGatewayNotificationEntity);
        const entities = await pendingRepository.find();
        return entities.map(entity => entity.toNotification());
    }

    async savePendingGatewayNotification(notification: Notification): Promise<void> {
        const pendingRepository = this.dataSource.getRepository(PendingGatewayNotificationEntity);
        const entity = PendingGatewayNotificationEntity.fromNotification(notification);
        await pendingRepository.save(entity);
    }

    async updatePendingGatewayNotificationRetryCount(notification: Notification, retryCount: number): Promise<void> {
        const pendingRepository = this.dataSource.getRepository(PendingGatewayNotificationEntity);
        await pendingRepository.update({
            type: notification.type,
            email: notification.address,
            title: notification.title,
            message: notification.message,
            status: notification.status,
            retryCount: notification.retryCount,
        }, {retryCount});
    }

    async deletePendingGatewayNotificationById(id: number): Promise<void> {
        const pendingRepository = this.dataSource.getRepository(PendingGatewayNotificationEntity);
        await pendingRepository.delete(id);
    }

    async deletePendingGatewayNotification(notification: Notification): Promise<void> {
        const notificationRepository = this.dataSource.getRepository(PendingGatewayNotificationEntity);
        await notificationRepository.delete({
            type: notification.type,
            email: notification.address,
            title: notification.title,
            message: notification.message,
            status: notification.status,
            retryCount: notification.retryCount,
        });
    }

    // Методы работы с пользователями
    async saveUser(email: string, chatId: number): Promise<void> {
        const userEntity = UserEntity.fromUser(new User(email, chatId));
        const userRepository = this.dataSource.getRepository(UserEntity);
        await userRepository.save(userEntity);
    }

    async getUsers(): Promise<User[]> {
        const userRepository = this.dataSource.getRepository(UserEntity);
        const entities = await userRepository.find();
        return entities.map(entity => entity.toUser());
    }

    async getUserByEmail(email: string): Promise<User | null> {
        const userRepository = this.dataSource.getRepository(UserEntity);
        const entity = await userRepository.findOneBy({email});
        return entity ? entity.toUser() : null;
    }

    async getUserByChatId(chatId: number): Promise<User | null> {
        const userRepository = this.dataSource.getRepository(UserEntity);
        const entity = await userRepository.findOneBy({chatId});
        return entity ? entity.toUser() : null;
    }
}
