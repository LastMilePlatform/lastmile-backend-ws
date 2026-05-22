import { ConfigService } from '@nestjs/config';
export type AuthUser = {
    userId: number;
    role: string;
};
export declare class RealtimeAuthService {
    private readonly configService;
    constructor(configService: ConfigService);
    verifyToken(rawToken: string): AuthUser;
    private parsePayload;
    private base64UrlToBase64;
    private base64UrlEncode;
    private constantTimeEqual;
}
