export class Notification {
    email: string;
    title: string;
    message: string;
    status: string;
    retryCount: number;


    constructor(email: string, title: string, message: string, status: string, retryCount: number = 0) {
        this.email = email;
        this.title = title;
        this.message = message;
        this.status = status;
        this.retryCount = retryCount;
    }
}
