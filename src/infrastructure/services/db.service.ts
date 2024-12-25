import {databaseConfig} from "../config";
import {DataSource} from "typeorm";
import {NotificationEntity} from "../database/entities/NotificationEntity";
import {UserEntity} from "../database/entities/UserEntity";
import {Notification} from "../../core/entities/Notification";
import {User} from "../../core/entities/User";

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
            entities: [NotificationEntity, UserEntity],
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
            SELECT 1 FROM pg_database WHERE datname = \$1
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

    async saveNotification(email: string, title: string, message: string, status: string, retryCount?: number): Promise<Notification> {
        const notification = new Notification(email, title, message, status, retryCount);
        const notificationEntity = NotificationEntity.fromNotification(notification);

        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        const savedEntity = await notificationRepository.save(notificationEntity);
        return savedEntity.toNotification();
    }

    async getNotifications(): Promise<Notification[]> {
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        const entities = await notificationRepository.find();
        return entities.map(entity => entity.toNotification());
    }

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

    async getNotificationsByEmail(email: string): Promise<Notification[]> {
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        const entities = await notificationRepository.findBy({email});
        return entities.map(entity => entity.toNotification());
    }

    async getNotificationsByStatus(status: string): Promise<Notification[]> {
        const notificationRepository = this.dataSource.getRepository(NotificationEntity);
        const entities = await notificationRepository.findBy({status});
        return entities.map(entity => entity.toNotification());
    }
}
