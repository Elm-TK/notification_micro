import {createLogger, format, transports} from 'winston';

const {combine, timestamp, printf, colorize} = format;


const logFormat = printf(({level, message, timestamp}) => {
    return `[${timestamp}] ${level}: ${message}`;
});

export const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        colorize(),
        logFormat
    ),
    transports: [
        new transports.Console()
    ],
});
