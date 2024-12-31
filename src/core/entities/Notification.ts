export class Notification {
    type!: "email" | "tg" | "push";
    address: string;
    title: string;
    message: string;
    status?: string;
    retryCount?: number;


    constructor(address: string, title: string, message: string, status?: string, retryCount: number = 0, type: "email" | "tg" | "push" = "tg") {
        this.type = type;
        this.address = address;
        this.title = title;
        this.message = message;
        this.status = status;
        this.retryCount = retryCount;
    }
}
