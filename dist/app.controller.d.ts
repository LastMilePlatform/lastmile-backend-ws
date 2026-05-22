import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHealthCheck(): {
        status: 'ok';
        service: 'lastmile-backend';
    };
}
