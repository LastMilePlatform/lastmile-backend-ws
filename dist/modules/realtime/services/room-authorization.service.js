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
exports.RoomAuthorizationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const campaign_entity_1 = require("../../campaigns/entities/campaign.entity");
const event_entity_1 = require("../../events/entities/event.entity");
const shipment_entity_1 = require("../../logistics/entities/shipment.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let RoomAuthorizationService = class RoomAuthorizationService {
    campaignsRepository;
    shipmentsRepository;
    eventsRepository;
    constructor(campaignsRepository, shipmentsRepository, eventsRepository) {
        this.campaignsRepository = campaignsRepository;
        this.shipmentsRepository = shipmentsRepository;
        this.eventsRepository = eventsRepository;
    }
    async validateAndNormalizeRoom(room, user) {
        if (room === 'volunteers:locations' || room === 'volunteers:tracking') {
            if (user.role !== user_entity_1.UserRole.ORGANIZER) {
                throw new common_1.ForbiddenException('Only organizers are allowed to subscribe to volunteers tracking');
            }
            return room;
        }
        const campaignChat = room.match(/^campaign:(\d+):chat$/);
        if (campaignChat) {
            await this.ensureCampaignVisible(Number(campaignChat[1]), user);
            return room;
        }
        const campaignAuctions = room.match(/^campaign:(\d+):auctions$/);
        if (campaignAuctions) {
            await this.ensureCampaignVisible(Number(campaignAuctions[1]), user);
            return room;
        }
        const campaignInventory = room.match(/^campaign:(\d+):inventory$/);
        if (campaignInventory) {
            await this.ensureCampaignVisible(Number(campaignInventory[1]), user);
            return room;
        }
        const campaignVolunteers = room.match(/^campaign:(\d+):volunteers:tracking$/);
        if (campaignVolunteers) {
            await this.ensureCampaignVisible(Number(campaignVolunteers[1]), user);
            if (user.role !== user_entity_1.UserRole.ORGANIZER) {
                throw new common_1.ForbiddenException('Only organizers are allowed to subscribe to volunteers tracking');
            }
            return room;
        }
        const auctionBids = room.match(/^auction:(\d+):bids$/);
        if (auctionBids) {
            void user;
            return room;
        }
        const shipmentTracking = room.match(/^shipment:(\d+):tracking$/);
        if (shipmentTracking) {
            await this.ensureShipmentAllowed(Number(shipmentTracking[1]), user);
            return room;
        }
        const eventOps = room.match(/^event:(\d+):ops$/);
        if (eventOps) {
            await this.ensureEventOpsAllowed(Number(eventOps[1]), user);
            return room;
        }
        throw new common_1.ForbiddenException('Room format is invalid or unsupported');
    }
    async ensureCampaignVisible(campaignId, user) {
        const campaign = await this.campaignsRepository.findOne({
            where: { id: campaignId },
            select: { id: true },
        });
        if (!campaign) {
            throw new common_1.ForbiddenException('Campaign room does not exist');
        }
        void user;
    }
    async ensureShipmentAllowed(shipmentId, user) {
        const shipment = await this.shipmentsRepository.findOne({
            where: { id: shipmentId },
            select: { id: true, assignedVolunteerId: true },
        });
        if (!shipment) {
            throw new common_1.ForbiddenException('Shipment room does not exist');
        }
        if (user.role === user_entity_1.UserRole.ORGANIZER) {
            return;
        }
        if (user.role === user_entity_1.UserRole.VOLUNTEER &&
            shipment.assignedVolunteerId === user.userId) {
            return;
        }
        throw new common_1.ForbiddenException('You are not allowed to subscribe to this shipment');
    }
    async ensureEventOpsAllowed(eventId, user) {
        const event = await this.eventsRepository.findOne({
            where: { id: eventId },
            select: { id: true, createdBy: true },
        });
        if (!event) {
            throw new common_1.ForbiddenException('Event ops room does not exist');
        }
        if (user.role === user_entity_1.UserRole.ORGANIZER && event.createdBy === user.userId) {
            return;
        }
        throw new common_1.ForbiddenException('You are not allowed to subscribe to this event ops room');
    }
};
exports.RoomAuthorizationService = RoomAuthorizationService;
exports.RoomAuthorizationService = RoomAuthorizationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(campaign_entity_1.Campaign)),
    __param(1, (0, typeorm_1.InjectRepository)(shipment_entity_1.Shipment)),
    __param(2, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RoomAuthorizationService);
//# sourceMappingURL=room-authorization.service.js.map