import { Injectable } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
} from 'prom-client';

@Injectable()
export class MetricsService {
  readonly registry: Registry;

  // === MÉTRICAS DE NEGOCIO ===
  readonly sessionsStarted: Counter<string>;
  readonly realtimeEvents: Counter<string>;
  readonly activeUsers: Gauge<string>;

  // === MÉTRICAS TÉCNICAS ===
  readonly wsConnectedUsers: Gauge<string>;
  readonly wsEventsEmitted: Counter<string>;
  readonly httpDuration: Histogram<string>;
  readonly httpErrors: Counter<string>;
  readonly httpRequests: Counter<string>;

  constructor() {
    this.registry = new Registry();
    this.registry.setDefaultLabels({ app: 'lastmile-backend-ws' });
    collectDefaultMetrics({ register: this.registry });

    // Negocio
    this.sessionsStarted = new Counter({
      name: 'sessions_started_total',
      help: 'Total de sesiones iniciadas (logins WS)',
      registers: [this.registry],
    });

    this.realtimeEvents = new Counter({
      name: 'realtime_actions_total',
      help: 'Eventos en tiempo real emitidos a clientes WS',
      labelNames: ['event'] as const,
      registers: [this.registry],
    });

    this.activeUsers = new Gauge({
      name: 'active_users_total',
      help: 'Usuarios activos con conexión WebSocket autenticada',
      registers: [this.registry],
    });

    // Técnicas
    this.wsConnectedUsers = new Gauge({
      name: 'websocket_concurrent_users',
      help: 'Usuarios concurrentes conectados por WebSocket',
      registers: [this.registry],
    });

    this.wsEventsEmitted = new Counter({
      name: 'websocket_events_emitted_total',
      help: 'Total de eventos emitidos por el servidor WS',
      labelNames: ['event'] as const,
      registers: [this.registry],
    });

    this.httpDuration = new Histogram({
      name: 'http_request_duration_ms',
      help: 'Duración de requests HTTP en milisegundos',
      labelNames: ['method', 'route', 'status'] as const,
      buckets: [10, 25, 50, 100, 250, 500, 1000],
      registers: [this.registry],
    });

    this.httpRequests = new Counter({
      name: 'http_requests_total',
      help: 'Total de requests HTTP',
      labelNames: ['method', 'route', 'status'] as const,
      registers: [this.registry],
    });

    this.httpErrors = new Counter({
      name: 'http_errors_total',
      help: 'Total de errores HTTP (4xx y 5xx)',
      labelNames: ['status'] as const,
      registers: [this.registry],
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  contentType(): string {
    return this.registry.contentType;
  }
}
