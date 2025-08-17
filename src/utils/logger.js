import winston from 'winston';

export const logger = winston.createLogger({
    level: (process.env.LOG_LEVEL || 'INFO').toLowerCase(),
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => 
            `[${timestamp}] ${level.toUpperCase()}: ${message}`)
    ),
    transports: [new winston.transports.Console()]
});

export function requestLogger(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
        const reqUrl = req.originalUrl;
        const resStatus = res.statusCode;
        const resSize = res.getHeader('Content-Length') || 0;
        const durationMs = Date.now() - start;
        logger.info(`${req.method} ${reqUrl} ${resStatus} ${resSize}B ${durationMs}ms`);
    });

    next();
}
