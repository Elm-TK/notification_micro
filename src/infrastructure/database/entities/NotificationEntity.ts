import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';
import {Notification} from "../../../core/entities/Notification";

@Entity('notifications')
export class NotificationEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({type: 'varchar'})
    type!: "email" | "tg" | "push";

    @Column({type: 'varchar'})
    email!: string;

    @Column({type: 'varchar'})
    title!: string;

    @Column({type: 'text'})
    message!: string;

    @Column({type: 'varchar'})
    status!: string;

    @Column({type: 'int', nullable: true})
    retryCount: number = 0;


    static fromNotification(notification: Notification): NotificationEntity {
        const entity = new NotificationEntity();
        entity.type = notification.type;
        entity.email = notification.address;
        entity.title = notification.title;
        entity.message = notification.message;
        entity.status = notification.status!;
        entity.retryCount = notification.retryCount!;
        return entity;
    }

    toNotification(): Notification {
        return new Notification(this.email, this.title, this.message, this.status, this.retryCount, this.type);
    }
}
