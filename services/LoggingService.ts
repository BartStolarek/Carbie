// services/LoggingService.ts

export interface LogMessage {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

type LogListener = (log: LogMessage) => void;

class LoggingService {
  private logs: LogMessage[] = [];
  private maxLogs = 100; // Keep only last 100 logs
  private listeners: LogListener[] = [];

  // Add a log message
  log(level: LogMessage['level'], message: string, data?: any) {
    const logMessage: LogMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level,
      message,
      data,
    };

    this.logs.push(logMessage);

    // Keep only the last maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify all listeners
    this.listeners.forEach(listener => listener(logMessage));

    // Also log to console for development
    if (__DEV__) {
      const consoleMethod = level === 'error' ? 'error' : 
                           level === 'warn' ? 'warn' : 
                           level === 'info' ? 'info' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data || '');
    }
  }

  // Convenience methods
  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  // Get all logs
  getLogs(): LogMessage[] {
    return [...this.logs];
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.listeners.forEach(listener => listener({
      id: 'clear',
      timestamp: new Date(),
      level: 'info',
      message: 'Logs cleared',
    }));
  }

  // Get logs by level
  getLogsByLevel(level: LogMessage['level']): LogMessage[] {
    return this.logs.filter(log => log.level === level);
  }

  // Get recent logs (last N)
  getRecentLogs(count: number): LogMessage[] {
    return this.logs.slice(-count);
  }

  // Add listener
  addListener(listener: LogListener) {
    this.listeners.push(listener);
  }

  // Remove listener
  removeListener(listener: LogListener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
}

// Export singleton instance
export const loggingService = new LoggingService(); 