import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const route = req.path.replace(/\/\d+/g, '/:id');

    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode.toString();
      const labels = { method: req.method, route, status };

      this.metricsService.httpDuration.observe(labels, duration);
      this.metricsService.httpRequests.inc(labels);

      if (res.statusCode >= 400) {
        this.metricsService.httpErrors.inc({ status });
      }
    });

    next();
  }
}
