import {MessageDTO} from '../../core/dtos/MessageDTO';
import {gatewayConfig} from "../config";
import {DatabaseService} from "./db.service";
import {Notification} from "../../core/entities/Notification";
import {logger} from "./logger";

export class GatewayService {
    private readonly gatewayUrl: string;
    private db: DatabaseService;
    private readonly retryInterval: number;

    constructor(db: DatabaseService, retryInterval: number = 300000) {
        this.gatewayUrl = gatewayConfig.url;
        this.db = db;
        this.retryInterval = retryInterval;

        this.initRetry();
    }

    async sendNotification(notification: Notification, retry?: boolean): Promise<void> {
        try {
            const messageDTO = new MessageDTO(notification.type, notification.address, notification.title, notification.message)
            const response = await fetch(`${this.gatewayUrl}/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageDTO),
            });

            if (!response.ok) {
                if (retry) {
                    await this.db.deletePendingGatewayNotification(notification);
                }
                throw new Error(`Failed to send notification: ${response.statusText}`);
            }

            console.log(`Notification ${retry ? 're' : ''}sent successfully`);
            logger.info("Уведомление от пользователя отправлено", notification);
        } catch (error) {
            if (retry) {
                await this.db.updatePendingGatewayNotificationRetryCount(notification, notification.retryCount! + 1)
            } else {
                notification.status = "FAILED";
                notification.retryCount = 0;
                await this.db.savePendingGatewayNotification(notification);
            }
            console.error('Error sending notification:', error);

            logger.error("Уведомление от пользователя не отправлено", notification);
        }
    }

    async retryPendingNotifications(): Promise<void> {
        const notifications = await this.db.getPendingGatewayNotifications()
        for (const notification of notifications) {
            await this.sendNotification(notification, true);
        }
    }

    async initRetry() {
        await this.retryPendingNotifications()

        setInterval(async () => {
            await this.retryPendingNotifications()
        }, this.retryInterval)
    }
}
