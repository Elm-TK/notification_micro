import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@Entity()
export class Notification {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    chatId: string;

    @Column()
    text: string;

    @Column()
    status: string;

    @Column({ nullable: true })
    retry_count?: number;

    constructor(chatId: string, text: string, status: string, retry_count?: number) {
        this.chatId = chatId;
        this.text = text;
        this.status = status;
        this.retry_count = retry_count;
    }
}
