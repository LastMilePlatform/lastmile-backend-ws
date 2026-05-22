type HealthCheckResponse = {
    status: 'ok';
    service: 'lastmile-backend';
};
export declare class AppService {
    getHealthCheck(): HealthCheckResponse;
}
export {};
