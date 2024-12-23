import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';
import {User} from "../../../core/entities/User";

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({type: 'varchar'})
    email!: string;

    @Column({type: 'int'})
    chatId!: number;

    static fromUser(user: User): UserEntity {
        const entity = new UserEntity();
        entity.email = user.email;
        entity.chatId = user.chatId;
        return entity;
    }

    toUser(): User {
        return new User(this.email, this.chatId);
    }
}
