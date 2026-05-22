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
exports.RequestSigningGuard = exports.SKIP_SIGNING_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const crypto_1 = require("crypto");
exports.SKIP_SIGNING_KEY = 'skipSigning';
const REPLAY_WINDOW_MS = 5 * 60 * 1000;
const SECRET = process.env.REQUEST_SIGNING_SECRET ?? '';
let RequestSigningGuard = class RequestSigningGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        if (context.getType() !== 'http')
            return true;
        if (!SECRET)
            return true;
        const skip = this.reflector.getAllAndOverride(exports.SKIP_SIGNING_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skip)
            return true;
        const request = context.switchToHttp().getRequest();
        if (request.method === 'OPTIONS')
            return true;
        const signature = request.headers['x-signature'];
        const timestamp = request.headers['x-timestamp'];
        if (!signature ||
            !timestamp ||
            Array.isArray(signature) ||
            Array.isArray(timestamp)) {
            throw new common_1.UnauthorizedException('Missing request signature');
        }
        const reqTime = Number(timestamp);
        if (Number.isNaN(reqTime) || Math.abs(Date.now() - reqTime) > REPLAY_WINDOW_MS) {
            throw new common_1.UnauthorizedException('Request signature expired');
        }
        const rawPath = request.path;
        const pathname = rawPath.startsWith('/api/v1')
            ? rawPath.slice('/api/v1'.length) || '/'
            : rawPath;
        const method = request.method.toUpperCase();
        const body = request.body;
        const bodyStr = body != null &&
            typeof body === 'object' &&
            Object.keys(body).length > 0
            ? JSON.stringify(body)
            : '';
        const message = [method, pathname, timestamp, bodyStr].join('\n');
        const expected = (0, crypto_1.createHmac)('sha256', SECRET).update(message).digest('hex');
        let valid;
        try {
            valid = (0, crypto_1.timingSafeEqual)(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid signature format');
        }
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid request signature');
        }
        return true;
    }
};
exports.RequestSigningGuard = RequestSigningGuard;
exports.RequestSigningGuard = RequestSigningGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RequestSigningGuard);
//# sourceMappingURL=request-signing.guard.js.map