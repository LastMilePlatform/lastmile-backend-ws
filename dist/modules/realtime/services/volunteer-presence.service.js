"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VolunteerPresenceService = void 0;
const common_1 = require("@nestjs/common");
let VolunteerPresenceService = class VolunteerPresenceService {
    socketsByUserId = new Map();
    userBySocketId = new Map();
    registerConnection(socketId, userId, role) {
        this.userBySocketId.set(socketId, { userId, role });
        const sockets = this.socketsByUserId.get(userId) ?? new Set();
        sockets.add(socketId);
        this.socketsByUserId.set(userId, sockets);
    }
    unregisterConnection(socketId) {
        const linkedUser = this.userBySocketId.get(socketId);
        if (!linkedUser) {
            return null;
        }
        this.userBySocketId.delete(socketId);
        const sockets = this.socketsByUserId.get(linkedUser.userId);
        if (sockets) {
            sockets.delete(socketId);
            if (sockets.size === 0) {
                this.socketsByUserId.delete(linkedUser.userId);
            }
        }
        return {
            userId: linkedUser.userId,
            role: linkedUser.role,
            stillConnected: this.socketsByUserId.has(linkedUser.userId),
        };
    }
    isConnected(userId) {
        return this.socketsByUserId.has(userId);
    }
    getLinkedUser(socketId) {
        return this.userBySocketId.get(socketId) ?? null;
    }
};
exports.VolunteerPresenceService = VolunteerPresenceService;
exports.VolunteerPresenceService = VolunteerPresenceService = __decorate([
    (0, common_1.Injectable)()
], VolunteerPresenceService);
//# sourceMappingURL=volunteer-presence.service.js.map