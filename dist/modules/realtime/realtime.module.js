"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const campaign_entity_1 = require("../campaigns/entities/campaign.entity");
const message_entity_1 = require("../chat/entities/message.entity");
const event_entity_1 = require("../events/entities/event.entity");
const shipment_location_history_entity_1 = require("../logistics/entities/shipment-location-history.entity");
const shipment_entity_1 = require("../logistics/entities/shipment.entity");
const user_entity_1 = require("../users/entities/user.entity");
const realtime_gateway_1 = require("./realtime.gateway");
const realtime_auth_service_1 = require("./services/realtime-auth.service");
const room_authorization_service_1 = require("./services/room-authorization.service");
const volunteer_location_service_1 = require("./services/volunteer-location.service");
const volunteer_presence_service_1 = require("./services/volunteer-presence.service");
let RealtimeModule = class RealtimeModule {
};
exports.RealtimeModule = RealtimeModule;
exports.RealtimeModule = RealtimeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                campaign_entity_1.Campaign,
                event_entity_1.Event,
                message_entity_1.Message,
                shipment_entity_1.Shipment,
                shipment_location_history_entity_1.ShipmentLocationHistory,
                user_entity_1.User,
            ]),
        ],
        providers: [
            realtime_gateway_1.RealtimeGateway,
            realtime_auth_service_1.RealtimeAuthService,
            room_authorization_service_1.RoomAuthorizationService,
            volunteer_location_service_1.VolunteerLocationService,
            volunteer_presence_service_1.VolunteerPresenceService,
        ],
    })
], RealtimeModule);
//# sourceMappingURL=realtime.module.js.map