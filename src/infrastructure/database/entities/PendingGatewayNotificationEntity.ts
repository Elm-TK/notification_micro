import {Entity} from 'typeorm';
import {NotificationEntity} from './NotificationEntity';

@Entity('pending_gateway_notifications')
export class PendingGatewayNotificationEntity extends NotificationEntity {
}

