import winston from 'winston';
import moment from 'moment';

export interface LoggerOptions {
  level?: 'error' | 'warn' | 'info' | 'debug';
}

export default class Logger {
  public logger: winston.Logger;

  constructor(options?: LoggerOptions) {
    let logLevel = 'info';

    if (options?.level) {
      logLevel = options.level;
    }

    // imported from `lto/indexer`
    const formats = [
      winston.format.timestamp(),
      winston.format.printf((info) => {
        const msg = [`[${moment(info.timestamp).format()}] - ${info.level}: ${info.message}`];

        for (const key in info) {
          if (['timestamp', 'message', 'level'].indexOf(key) > -1) {
            continue;
          }

          const value = typeof info[key] === 'string' ? info[key] : JSON.stringify(info[key], null, 2);
          msg.push(`\n${key}:\n${value}\n`);
        }

        return msg.join('\n');
      }),
    ];

    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console({
          level: logLevel,
          format: winston.format.combine(...[winston.format.colorize()], ...formats),
        }),
      ],
    });
  }

  public info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  public warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  public error(message: string, meta?: any) {
    this.logger.error(message, meta);
  }

  public debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }
}
