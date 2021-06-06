const logger = {
  log: (...args) => {
    console.log(new Date().toISOString(), '[LOG]', ...args);
  },
  debug: (...args) => {
    console.log(new Date().toISOString(), '[DEBUG]', ...args);
  },
  info: (...args) => {
    console.info(new Date().toISOString(), '[INFO]', ...args);
  },
  notice: (...args) => {
    console.info(new Date().toISOString(), '[NOTICE]', ...args);
  },
  warning: (...args) => {
    console.info(new Date().toISOString(), '[WARNING]', ...args);
  },
  error: (...args) => {
    console.error(new Date().toISOString(), '[ERROR]', ...args);
  },
  critical: (...args) => {
    console.error(new Date().toISOString(), '[CRITICAL]', ...args);
  },
  alert: (...args) => {
    console.error(new Date().toISOString(), '[ALERT]', ...args);
  },
  emergency: (...args) => {
    console.error(new Date().toISOString(), '[EMERGENCY]', ...args);
  },
};

export default logger;
