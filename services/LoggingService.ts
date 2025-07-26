// services/LoggingService.ts
import { EventEmitter } from 'events';

export interface LogMessage {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

class LoggingService extends EventEmitter {
  private logs: LogMessage[] = [];
  private maxLogs = 100; // Keep only last 100 logs

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

    // Emit event for components to listen to
    this.emit('logAdded', logMessage);

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
    this.emit('logsCleared');
  }

  // Get logs by level
  getLogsByLevel(level: LogMessage['level']): LogMessage[] {
    return this.logs.filter(log => log.level === level);
  }

  // Get recent logs (last N)
  getRecentLogs(count: number): LogMessage[] {
    return this.logs.slice(-count);
  }
}

// Export singleton instance
export const loggingService = new LoggingService(); 