/**
 * Observability Utilities
 * 
 * Provides distributed tracing, logging, and monitoring capabilities
 * for microservices architecture
 */

import { supabase } from "@/integrations/supabase/client";

export interface TraceContext {
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  service_name: string;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  trace_context?: TraceContext;
}

/**
 * Distributed Tracing
 */
export class Tracer {
  private static generateId(): string {
    return crypto.randomUUID();
  }

  static startTrace(serviceName: string): TraceContext {
    return {
      trace_id: this.generateId(),
      span_id: this.generateId(),
      service_name: serviceName
    };
  }

  static createSpan(parentContext: TraceContext, serviceName: string): TraceContext {
    return {
      trace_id: parentContext.trace_id,
      span_id: this.generateId(),
      parent_span_id: parentContext.span_id,
      service_name: serviceName
    };
  }

  static async recordSpan(
    context: TraceContext,
    operation: string,
    duration_ms: number,
    status: 'success' | 'error',
    metadata?: Record<string, any>
  ) {
    try {
      await supabase.from('microservice_traces').insert({
        trace_id: context.trace_id,
        span_id: context.span_id,
        parent_span_id: context.parent_span_id,
        service_name: context.service_name,
        operation,
        duration_ms,
        status,
        metadata,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Tracer] Failed to record span:', error);
    }
  }
}

/**
 * Structured Logging
 */
export class Logger {
  constructor(private serviceName: string, private traceContext?: TraceContext) {}

  private async log(entry: LogEntry) {
    const logEntry = {
      service_name: this.serviceName,
      ...entry,
      trace_id: this.traceContext?.trace_id,
      timestamp: new Date().toISOString()
    };

    // Console output
    const prefix = `[${this.serviceName}]`;
    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.context);
        break;
      case 'info':
        console.info(prefix, entry.message, entry.context);
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.context);
        break;
      case 'error':
        console.error(prefix, entry.message, entry.context);
        break;
    }

    // Persist to database for analysis
    try {
      await supabase.from('microservice_logs').insert(logEntry);
    } catch (error) {
      console.error('[Logger] Failed to persist log:', error);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log({ level: 'debug', message, context });
  }

  info(message: string, context?: Record<string, any>) {
    this.log({ level: 'info', message, context });
  }

  warn(message: string, context?: Record<string, any>) {
    this.log({ level: 'warn', message, context });
  }

  error(message: string, context?: Record<string, any>) {
    this.log({ level: 'error', message, context });
  }
}

/**
 * Performance Monitoring
 */
export class PerformanceMonitor {
  static async recordMetric(
    service: string,
    metric_name: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ) {
    try {
      await supabase.from('microservice_metrics').insert({
        service_name: service,
        metric_name,
        value,
        unit,
        tags,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to record metric:', error);
    }
  }

  static async recordResponseTime(service: string, endpoint: string, duration_ms: number) {
    await this.recordMetric(service, 'response_time', duration_ms, 'ms', { endpoint });
  }

  static async recordThroughput(service: string, requests_count: number) {
    await this.recordMetric(service, 'throughput', requests_count, 'requests');
  }

  static async recordErrorRate(service: string, error_count: number) {
    await this.recordMetric(service, 'errors', error_count, 'count');
  }
}

/**
 * Service Health Monitoring
 */
export class HealthCheck {
  static async recordHealth(
    service: string,
    status: 'healthy' | 'degraded' | 'unhealthy',
    checks: Record<string, boolean>,
    metadata?: Record<string, any>
  ) {
    try {
      await supabase.from('microservice_health').insert({
        service_name: service,
        status,
        checks,
        metadata,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[HealthCheck] Failed to record health:', error);
    }
  }
}

/**
 * Convenience wrapper for instrumented operations
 */
export async function traced<T>(
  serviceName: string,
  operation: string,
  fn: (context: TraceContext) => Promise<T>
): Promise<T> {
  const context = Tracer.startTrace(serviceName);
  const logger = new Logger(serviceName, context);
  const startTime = Date.now();

  try {
    logger.info(`Starting ${operation}`);
    const result = await fn(context);
    const duration = Date.now() - startTime;
    
    await Tracer.recordSpan(context, operation, duration, 'success');
    await PerformanceMonitor.recordResponseTime(serviceName, operation, duration);
    
    logger.info(`Completed ${operation}`, { duration_ms: duration });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    await Tracer.recordSpan(context, operation, duration, 'error', { error: error.message });
    await PerformanceMonitor.recordErrorRate(serviceName, 1);
    
    logger.error(`Failed ${operation}`, { error: error.message, duration_ms: duration });
    throw error;
  }
}
