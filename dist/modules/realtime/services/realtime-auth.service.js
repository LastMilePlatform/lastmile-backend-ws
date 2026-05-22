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
exports.RealtimeAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
let RealtimeAuthService = class RealtimeAuthService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    verifyToken(rawToken) {
        const secret = this.configService.get('JWT_SECRET') ?? 'dev-jwt-secret';
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
        const payload = this.parsePayload(encodedPayload);
        const userId = Number(payload.sub ?? payload.userId ?? payload.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            throw new common_1.UnauthorizedException('Token does not include a valid user id');
        }
        const roleRaw = payload.role;
        const role = typeof roleRaw === 'string' ? roleRaw : 'donor';
        const exp = payload.exp;
        if (typeof exp === 'number') {
            const nowInSeconds = Math.floor(Date.now() / 1000);
            if (exp <= nowInSeconds) {
                throw new common_1.UnauthorizedException('Token expired');
            }
        }
        return { userId, role };
    }
    parsePayload(encodedPayload) {
        try {
            const decoded = Buffer.from(this.base64UrlToBase64(encodedPayload), 'base64').toString('utf8');
            return JSON.parse(decoded);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid token payload');
        }
    }
    base64UrlToBase64(input) {
        let output = input.replace(/-/g, '+').replace(/_/g, '/');
        while (output.length % 4 !== 0) {
            output += '=';
        }
        return output;
    }
    base64UrlEncode(buffer) {
        return buffer
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/g, '');
    }
    constantTimeEqual(a, b) {
        const aBuffer = Buffer.from(a);
        const bBuffer = Buffer.from(b);
        if (aBuffer.length !== bBuffer.length) {
            return false;
        }
        return (0, crypto_1.timingSafeEqual)(aBuffer, bBuffer);
    }
};
exports.RealtimeAuthService = RealtimeAuthService;
exports.RealtimeAuthService = RealtimeAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RealtimeAuthService);
//# sourceMappingURL=realtime-auth.service.js.map