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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const token_service_1 = require("./services/token.service");
let AuthService = class AuthService {
    usersRepository;
    tokenService;
    constructor(usersRepository, tokenService) {
        this.usersRepository = usersRepository;
        this.tokenService = tokenService;
    }
    async login(dto) {
        const user = await this.usersRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email: dto.email })
            .getOne();
        if (!user || user.password !== dto.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const accessToken = this.tokenService.generate({
            userId: user.id,
            role: user.role,
        });
        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }
    async verifyGoogleToken(token) {
        const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
        if (tokenInfoRes.ok) {
            return tokenInfoRes.json();
        }
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!userInfoRes.ok) {
            throw new common_1.UnauthorizedException('Invalid Google token');
        }
        return userInfoRes.json();
    }
    async loginWithGoogle(googleAccessToken, role) {
        const info = await this.verifyGoogleToken(googleAccessToken);
        if (!info.email || !(info.email_verified === true || info.email_verified === 'true')) {
            throw new common_1.UnauthorizedException('Google account email not verified');
        }
        let user = await this.usersRepository.findOne({
            where: { email: info.email },
        });
        if (!user) {
            if (!role) {
                return { requiresRoleSelection: true };
            }
            user = this.usersRepository.create({
                name: info.name ?? info.email,
                email: info.email,
                googleId: info.sub,
                role,
            });
            await this.usersRepository.save(user);
        }
        else if (!user.googleId) {
            user.googleId = info.sub;
            await this.usersRepository.save(user);
        }
        const accessToken = this.tokenService.generate({
            userId: user.id,
            role: user.role,
        });
        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        token_service_1.TokenService])
], AuthService);
//# sourceMappingURL=auth.service.js.map