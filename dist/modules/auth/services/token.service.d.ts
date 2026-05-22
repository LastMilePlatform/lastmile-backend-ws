import { ConfigService } from '@nestjs/config';
export type TokenPayload = {
    userId: number;
    role: string;
};
export declare class TokenService {
    private readonly configService;
    constructor(configService: ConfigService);
    generate(payload: TokenPayload): string;
    verify(rawToken: string): TokenPayload;
    private getSecret;
    private parsePayload;
    private base64UrlEncode;
    private base64UrlToBase64;
    private constantTimeEqual;
}
