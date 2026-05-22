"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
let TokenService = class TokenService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    generate(payload) {
        const secret = this.getSecret();
        const header = this.base64UrlEncode(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
        const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
        const body = this.base64UrlEncode(Buffer.from(JSON.stringify({ sub: payload.userId, role: payload.role, exp })));
        const signature = this.base64UrlEncode((0, crypto_1.createHmac)('sha256', secret).update(`${header}.${body}`).digest());
        return `${header}.${body}.${signature}`;
    }
    verify(rawToken) {
        const secret = this.getSecret();
        const token = rawToken.trim();
        const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
        if (!encodedHeader || !encodedPayload || !encodedSignature) {
            throw new common_1.UnauthorizedException('Invalid token format');
        }
        const expectedSignature = this.base64UrlEncode((0, crypto_1.createHmac)('sha256', secret)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest());
        if (!this.constantTimeEqual(expectedSignature, encodedSignature)) {
            throw new common_1.UnauthorizedException('Invalid token signature');
        }
        const parsed = this.parsePayload(encodedPayload);
        const userId = Number(parsed.sub ?? parsed.userId);
        if (!Number.isInteger(userId) || userId <= 0) {
            throw new common_1.UnauthorizedException('Token does not include a valid user id');
        }
        const role = typeof parsed.role === 'string' ? parsed.role : 'donor';
        const exp = parsed.exp;
        if (typeof exp === 'number' && exp <= Math.floor(Date.now() / 1000)) {
            throw new common_1.UnauthorizedException('Token expired');
        }
        return { userId, role };
    }
    getSecret() {
        return this.configService.get('JWT_SECRET') ?? 'dev-jwt-secret';
    }
    parsePayload(encoded) {
        try {
            const decoded = Buffer.from(this.base64UrlToBase64(encoded), 'base64').toString('utf8');
            return JSON.parse(decoded);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid token payload');
        }
    }
    base64UrlEncode(buffer) {
        return buffer
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/g, '');
    }
    base64UrlToBase64(input) {
        let output = input.replace(/-/g, '+').replace(/_/g, '/');
        while (output.length % 4 !== 0)
            output += '=';
        return output;
    }
    constantTimeEqual(a, b) {
        const aBuffer = Buffer.from(a);
        const bBuffer = Buffer.from(b);
        if (aBuffer.length !== bBuffer.length)
            return false;
        return (0, crypto_1.timingSafeEqual)(aBuffer, bBuffer);
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TokenService);
//# sourceMappingURL=token.service.js.map