const logger = {
  isEnabled: true,
  log: (...args) => {
    if (!logger.isEnabled) {
      return;
    }

    console.log(new Date().toISOString(), '[LOG]', ...args);
  },
  debug: (...args) => {
    if (!logger.isEnabled) {
      return;
    }

    console.debug(new Date().toISOString(), '[DEBUG]', ...args);
  },
  info: (...args) => {
    if (!logger.isEnabled) {
      return;
    }

    console.info(new Date().toISOString(), '[INFO]', ...args);
  },
  notice: (...args) => {
    if (!logger.isEnabled) {
      return;
    }

    console.info(new Date().toISOString(), '[NOTICE]', ...args);
  },
  warning: (...args) => {
    if (!logger.isEnabled) {
      return;
    }

    console.warn(new Date().toISOString(), '[WARNING]', ...args);
  },
  error: (...args) => {
    if (!logger.isEnabled) {
      return;
    }

    console.error(new Date().toISOString(), '[ERROR]', ...args);
  },
  critical: (...args) => {
    if (!logger.isEnabled) {
      return;
    }

    console.error(new Date().toISOString(), '[CRITICAL]', ...args);
  },
  alert: (...args) => {
    if (!logger.isEnabled) {
      return;
    }

    console.error(new Date().toISOString(), '[ALERT]', ...args);
  },
  emergency: (...args) => {
    if (!logger.isEnabled) {
      return;
    }

    console.error(new Date().toISOString(), '[EMERGENCY]', ...args);
  },
};

export default logger;
