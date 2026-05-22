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
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const typeorm_1 = require("@nestjs/typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const event_emitter_2 = require("@nestjs/event-emitter");
const typeorm_2 = require("typeorm");
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("redis");
const crypto_1 = require("crypto");
const message_entity_1 = require("../chat/entities/message.entity");
const campaign_entity_1 = require("../campaigns/entities/campaign.entity");
const user_entity_1 = require("../users/entities/user.entity");
const shipment_entity_1 = require("../logistics/entities/shipment.entity");
const shipment_entity_2 = require("../logistics/entities/shipment.entity");
const shipment_location_history_entity_1 = require("../logistics/entities/shipment-location-history.entity");
const realtime_auth_service_1 = require("./services/realtime-auth.service");
const room_authorization_service_1 = require("./services/room-authorization.service");
const volunteer_location_service_1 = require("./services/volunteer-location.service");
const volunteer_presence_service_1 = require("./services/volunteer-presence.service");
const volunteer_location_ws_dto_1 = require("./dto/volunteer-location-ws.dto");
const defaultCorsOrigins = [
    'http://localhost:8081',
    'http://localhost:19006',
    'http://127.0.0.1:19006',
    'https://chasmic-lavada-pneumatically.ngrok-free.dev',
];
const expoTunnelOriginPattern = /^https:\/\/[a-z0-9-]+-8081\.exp\.direct$/;
const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0) ?? defaultCorsOrigins;
const allowedCorsOrigins = new Set(corsOrigins);
const isAllowedCorsOrigin = (origin) => {
    if (!origin) {
        return true;
    }
    return allowedCorsOrigins.has(origin) || expoTunnelOriginPattern.test(origin);
};
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    messagesRepository;
    campaignsRepository;
    usersRepository;
    shipmentsRepository;
    shipmentLocationsRepository;
    realtimeAuthService;
    roomAuthorizationService;
    volunteerPresenceService;
    volunteerLocationService;
    eventEmitter;
    server;
    logger = new common_1.Logger(RealtimeGateway_1.name);
    staleThresholdMs = 60_000;
    maxImpliedSpeedMetersPerSecond = 70;
    constructor(messagesRepository, campaignsRepository, usersRepository, shipmentsRepository, shipmentLocationsRepository, realtimeAuthService, roomAuthorizationService, volunteerPresenceService, volunteerLocationService, eventEmitter) {
        this.messagesRepository = messagesRepository;
        this.campaignsRepository = campaignsRepository;
        this.usersRepository = usersRepository;
        this.shipmentsRepository = shipmentsRepository;
        this.shipmentLocationsRepository = shipmentLocationsRepository;
        this.realtimeAuthService = realtimeAuthService;
        this.roomAuthorizationService = roomAuthorizationService;
        this.volunteerPresenceService = volunteerPresenceService;
        this.volunteerLocationService = volunteerLocationService;
        this.eventEmitter = eventEmitter;
    }
    async afterInit(server) {
        if (process.env.REDIS_URL) {
            try {
                const pubClient = (0, redis_1.createClient)({ url: process.env.REDIS_URL });
                const subClient = pubClient.duplicate();
                await pubClient.connect();
                await subClient.connect();
                server.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
                this.logger.log('Socket.IO Redis adapter configured');
            }
            catch (err) {
                this.logger.warn(`Failed to configure Redis adapter: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    }
    async handleConnection(client) {
        const socket = client;
        const token = this.tryExtractToken(client);
        if (!token) {
            client.emit('system.error', {
                code: 'AUTH_REQUIRED',
                message: 'Authentication token is required',
            });
            client.disconnect(true);
            return;
        }
        try {
            const authUser = this.realtimeAuthService.verifyToken(token);
            const user = await this.usersRepository.findOne({
                where: { id: authUser.userId },
                select: { id: true, name: true, role: true },
            });
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            socket.data.userId = authUser.userId;
            socket.data.userName = user.name;
            socket.data.role = user.role;
            socket.data.rateLimit = {};
            socket.data.isAuthenticated = true;
            this.volunteerPresenceService.registerConnection(client.id, user.id, user.role);
            await socket.join(`user:${authUser.userId}`);
            if (user.role === user_entity_1.UserRole.ORGANIZER) {
                await socket.join('volunteers:locations');
                await socket.join('volunteers:tracking');
                this.emitGlobalVolunteersSnapshot(socket);
            }
            this.logger.log(`WS connected user=${authUser.userId} socket=${client.id}`);
        }
        catch (error) {
            const reason = error instanceof Error ? error.message : 'unknown';
            this.logger.warn(`WS auth rejected socket=${client.id} reason=${reason}`);
            client.emit('system.error', {
                code: 'AUTH_INVALID',
                message: 'Invalid authentication token',
            });
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        const disconnected = this.volunteerPresenceService.unregisterConnection(client.id);
        if (disconnected &&
            disconnected.role === user_entity_1.UserRole.VOLUNTEER &&
            !disconnected.stillConnected) {
            this.volunteerLocationService.removeLocation(disconnected.userId);
            const payload = {
                volunteerId: disconnected.userId,
            };
            this.server
                .to('volunteers:locations')
                .emit('volunteer.disconnected', payload);
            this.server.to('volunteers:tracking').emit('volunteer.offline', payload);
            this.server
                .to('volunteers:tracking')
                .emit('volunteer.disconnected', payload);
        }
        this.logger.log(`WS disconnected socket=${client.id}`);
    }
    async joinRoom(client, payload) {
        try {
            const room = payload?.room?.trim();
            if (!room) {
                throw new common_1.BadRequestException('room is required');
            }
            const normalizedRoom = await this.roomAuthorizationService.validateAndNormalizeRoom(room, {
                userId: client.data.userId,
                role: client.data.role,
            });
            await client.join(normalizedRoom);
            this.logger.log(`room joined user=${client.data.userId} room=${normalizedRoom}`);
            client.emit('system.joined', {
                room: normalizedRoom,
                serverTime: new Date().toISOString(),
            });
            if (normalizedRoom === 'volunteers:locations' ||
                normalizedRoom === 'volunteers:tracking') {
                this.emitGlobalVolunteersSnapshot(client);
            }
            const campaignVolunteers = normalizedRoom.match(/^campaign:(\d+):volunteers:tracking$/);
            if (campaignVolunteers) {
                const campaignId = Number(campaignVolunteers[1]);
                this.emitCampaignVolunteersSnapshot(client, campaignId);
            }
            const isChatRoom = normalizedRoom.includes(':chat');
            if (isChatRoom && client.data.isAuthenticated) {
                const campaignIdMatch = normalizedRoom.match(/campaign:(\d+):chat/);
                if (campaignIdMatch) {
                    const campaignId = Number(campaignIdMatch[1]);
                    const user = await this.usersRepository.findOne({
                        where: { id: client.data.userId },
                        select: { id: true, name: true },
                    });
                    if (user) {
                        this.eventEmitter.emit('chat.join', {
                            campaignId,
                            userId: user.id,
                            userName: user.name,
                        });
                    }
                }
            }
        }
        catch (error) {
            this.logger.warn(`room join denied user=${client.data.userId} room=${payload?.room ?? 'unknown'} reason=${error instanceof Error ? error.message : 'unknown'}`);
            this.emitSystemError(client, error, 'FORBIDDEN_ROOM');
        }
    }
    async leaveRoom(client, payload) {
        const room = payload?.room?.trim();
        if (!room) {
            this.emitSystemError(client, new common_1.BadRequestException('room is required'), 'BAD_REQUEST');
            return;
        }
        await client.leave(room);
        client.emit('system.left', {
            room,
            serverTime: new Date().toISOString(),
        });
    }
    async sendChatMessage(client, payload) {
        try {
            this.ensureAuthenticated(client);
            this.enforceRateLimit(client, 'chat.send', 5, 10_000);
            const campaignId = Number(payload?.campaignId);
            const text = payload?.message?.trim();
            if (!Number.isInteger(campaignId) || campaignId <= 0) {
                throw new common_1.BadRequestException('campaignId must be a valid integer');
            }
            if (!text || text.length < 1 || text.length > 500) {
                throw new common_1.BadRequestException('message must have between 1 and 500 characters');
            }
            await this.roomAuthorizationService.validateAndNormalizeRoom(`campaign:${campaignId}:chat`, {
                userId: client.data.userId,
                role: client.data.role,
            });
            const campaign = await this.campaignsRepository.findOne({
                where: { id: campaignId },
                select: { id: true },
            });
            if (!campaign) {
                throw new common_1.BadRequestException('Campaign does not exist');
            }
            const author = await this.usersRepository.findOne({
                where: { id: client.data.userId },
                select: { id: true, name: true },
            });
            if (!author) {
                throw new common_1.BadRequestException('User does not exist');
            }
            const created = await this.messagesRepository.save(this.messagesRepository.create({
                campaignId,
                userId: author.id,
                message: text,
            }));
            const sentEvent = {
                messageId: created.id,
                campaignId,
                userId: author.id,
            };
            this.eventEmitter.emit('message.sent', sentEvent);
            this.logger.log(`chat.send ok user=${author.id} campaign=${campaignId} messageId=${created.id}`);
            this.server
                .to(`campaign:${campaignId}:chat`)
                .emit('chat.message.created', {
                id: created.id,
                campaignId,
                authorId: author.id,
                authorName: author.name,
                message: created.message,
                createdAt: created.createdAt.toISOString(),
            });
        }
        catch (error) {
            this.logger.warn(`chat.send failed user=${client.data.userId} campaign=${payload?.campaignId ?? 'unknown'} reason=${error instanceof Error ? error.message : 'unknown'}`);
            client.emit('chat.message.error', {
                campaignId: payload?.campaignId,
                message: error instanceof Error
                    ? error.message
                    : 'No fue posible enviar el mensaje.',
            });
        }
    }
    async chatTyping(client, payload) {
        const campaignId = Number(payload?.campaignId);
        if (!Number.isInteger(campaignId) || campaignId <= 0) {
            return;
        }
        await this.roomAuthorizationService.validateAndNormalizeRoom(`campaign:${campaignId}:chat`, {
            userId: client.data.userId,
            role: client.data.role,
        });
        client.to(`campaign:${campaignId}:chat`).emit('chat.typing.updated', {
            campaignId,
            userId: client.data.userId,
            isTyping: Boolean(payload?.isTyping),
        });
    }
    async subscribeShipment(client, payload) {
        const shipmentId = Number(payload?.shipmentId);
        if (!Number.isInteger(shipmentId) || shipmentId <= 0) {
            this.emitSystemError(client, new common_1.BadRequestException('shipmentId is invalid'), 'BAD_REQUEST');
            return;
        }
        try {
            const room = await this.roomAuthorizationService.validateAndNormalizeRoom(`shipment:${shipmentId}:tracking`, {
                userId: client.data.userId,
                role: client.data.role,
            });
            await client.join(room);
            client.emit('system.joined', {
                room,
                serverTime: new Date().toISOString(),
            });
            const latestLocation = await this.shipmentLocationsRepository.findOne({
                where: { shipmentId },
                order: { recordedAt: 'DESC', id: 'DESC' },
            });
            if (latestLocation) {
                client.emit('shipment.location.snapshot', {
                    shipmentId,
                    lat: latestLocation.lat,
                    lng: latestLocation.lng,
                    speed: latestLocation.speed,
                    heading: latestLocation.heading,
                    recordedAt: latestLocation.recordedAt.toISOString(),
                });
            }
        }
        catch (error) {
            this.emitSystemError(client, error, 'FORBIDDEN_ROOM');
        }
    }
    async subscribeCampaignVolunteers(client, payload) {
        const campaignId = Number(payload?.campaignId);
        if (!Number.isInteger(campaignId) || campaignId <= 0) {
            this.emitSystemError(client, new common_1.BadRequestException('campaignId is invalid'), 'BAD_REQUEST');
            return;
        }
        try {
            const room = await this.roomAuthorizationService.validateAndNormalizeRoom(`campaign:${campaignId}:volunteers:tracking`, {
                userId: client.data.userId,
                role: client.data.role,
            });
            await client.join(room);
            client.emit('system.joined', {
                room,
                serverTime: new Date().toISOString(),
            });
            this.emitCampaignVolunteersSnapshot(client, campaignId);
        }
        catch (error) {
            this.emitSystemError(client, error, 'FORBIDDEN_ROOM');
        }
    }
    handleVolunteerSnapshotRequest(client) {
        if (client.data.role === user_entity_1.UserRole.ORGANIZER) {
            this.emitGlobalVolunteersSnapshot(client);
        }
    }
    async volunteerLocationUpdate(client, payload) {
        try {
            const serverReceivedAt = new Date();
            const correlationId = this.resolveCorrelationId(payload?.correlationId);
            this.ensureAuthenticated(client);
            this.ensureVolunteerRole(client);
            this.enforceRateLimit(client, 'volunteer.location.update', 1, 2000);
            const linkedPresence = this.volunteerPresenceService.getLinkedUser(client.id);
            if (linkedPresence && linkedPresence.userId !== client.data.userId) {
                this.logger.warn(`[tracking] correlationId=${correlationId} socket-user mismatch socket=${client.id} socketUser=${linkedPresence.userId} requestUser=${client.data.userId}`);
            }
            const extracted = this.extractAndNormalizeCoordinates(payload);
            const lat = extracted.lat;
            const lng = extracted.lng;
            const normalizedCoordinates = extracted.normalizedCoordinates;
            const recordedAt = this.parseRecordedAt(payload?.recordedAt);
            const validatedPayload = this.validateVolunteerLocationDto({
                lat,
                lng,
                recordedAt: recordedAt.toISOString(),
                campaignId: payload?.campaignId === undefined
                    ? undefined
                    : Number(payload.campaignId),
                shipmentId: payload?.shipmentId === undefined
                    ? undefined
                    : Number(payload.shipmentId),
                correlationId,
            });
            const stale = serverReceivedAt.getTime() - recordedAt.getTime() >
                this.staleThresholdMs;
            this.logger.log(`[tracking] received correlationId=${correlationId} userId=${client.data.userId} role=${client.data.role} lat=${lat} lng=${lng} recordedAt=${recordedAt.toISOString()} serverReceivedAt=${serverReceivedAt.toISOString()} normalized=${normalizedCoordinates} stale=${stale}`);
            if (stale) {
                this.logger.warn(`[tracking] correlationId=${correlationId} stale location userId=${client.data.userId} ageMs=${serverReceivedAt.getTime() - recordedAt.getTime()}`);
            }
            const previousLocation = this.volunteerLocationService.getByVolunteerId(client.data.userId);
            if (previousLocation &&
                this.isImplausibleJump(previousLocation, {
                    lat,
                    lng,
                    recordedAt,
                })) {
                throw new common_1.BadRequestException('Location discarded due to implausible speed/jump');
            }
            let campaignId = undefined;
            let shipmentId = undefined;
            if (payload?.campaignId !== undefined) {
                campaignId = validatedPayload.campaignId;
            }
            if (payload?.shipmentId !== undefined) {
                shipmentId = validatedPayload.shipmentId;
                const shipment = await this.shipmentsRepository.findOne({
                    where: { id: shipmentId },
                    select: { id: true, campaignId: true, assignedVolunteerId: true },
                });
                if (!shipment) {
                    throw new common_1.BadRequestException('Shipment does not exist');
                }
                if (shipment.assignedVolunteerId !== client.data.userId) {
                    throw new common_1.BadRequestException('Volunteer is not assigned to the shipment');
                }
                campaignId = campaignId ?? shipment.campaignId;
                const locationRow = this.shipmentLocationsRepository.create({
                    shipmentId,
                    campaignId: shipment.campaignId,
                    lat,
                    lng,
                    speed: null,
                    heading: null,
                    recordedAt,
                    updatedBy: client.data.userId,
                });
                await this.shipmentLocationsRepository.save(locationRow);
                this.logger.log(`[tracking] saved correlationId=${correlationId} shipmentId=${shipmentId} userId=${client.data.userId} lat=${lat} lng=${lng}`);
            }
            if (!shipmentId || !campaignId) {
                const inferred = await this.resolveVolunteerActiveShipment(client.data.userId);
                if (inferred) {
                    shipmentId = shipmentId ?? inferred.shipmentId;
                    campaignId = campaignId ?? inferred.campaignId;
                }
            }
            const location = {
                volunteerId: client.data.userId,
                lat,
                lng,
                recordedAt: recordedAt.toISOString(),
                correlationId,
                normalizedCoordinates,
                stale,
                serverReceivedAt: serverReceivedAt.toISOString(),
                name: client.data.userName,
                campaignId,
                shipmentId,
            };
            this.volunteerLocationService.upsertLocation(location);
            this.emitVolunteerLocationUpdates(location);
            this.logger.log(`[tracking] broadcast correlationId=${correlationId} userId=${client.data.userId} room=volunteers:locations lat=${lat} lng=${lng}`);
            client.emit('volunteer.location.ack', {
                correlationId,
                volunteerId: location.volunteerId,
                lat,
                lng,
                normalizedCoordinates,
                stale,
                recordedAt: location.recordedAt,
                serverReceivedAt: serverReceivedAt.toISOString(),
            });
        }
        catch (error) {
            this.emitSystemError(client, error, 'VOLUNTEER_LOCATION_ERROR');
        }
    }
    async shipmentLocationUpdate(client, payload) {
        try {
            this.ensureAuthenticated(client);
            this.ensureVolunteerRole(client);
            this.enforceRateLimit(client, 'shipment.location.update', 1, 2000);
            const shipmentId = Number(payload?.shipmentId);
            const extracted = this.extractAndNormalizeCoordinates(payload);
            const lat = extracted.lat;
            const lng = extracted.lng;
            if (!Number.isInteger(shipmentId) || shipmentId <= 0) {
                throw new common_1.BadRequestException('shipmentId is invalid');
            }
            await this.roomAuthorizationService.validateAndNormalizeRoom(`shipment:${shipmentId}:tracking`, {
                userId: client.data.userId,
                role: client.data.role,
            });
            const shipment = await this.shipmentsRepository.findOne({
                where: { id: shipmentId },
                select: { id: true, campaignId: true, assignedVolunteerId: true },
            });
            if (!shipment) {
                throw new common_1.BadRequestException('Shipment does not exist');
            }
            if (shipment.assignedVolunteerId !== client.data.userId) {
                throw new common_1.BadRequestException('Volunteer is not assigned to the shipment');
            }
            const recordedAt = this.parseRecordedAt(payload?.recordedAt);
            const row = this.shipmentLocationsRepository.create({
                shipmentId,
                campaignId: shipment.campaignId,
                lat,
                lng,
                speed: Number.isFinite(Number(payload?.speed))
                    ? Number(payload?.speed)
                    : null,
                heading: Number.isFinite(Number(payload?.heading))
                    ? Number(payload?.heading)
                    : null,
                recordedAt,
                updatedBy: client.data.userId,
            });
            await this.shipmentLocationsRepository.save(row);
            const volunteerLocation = {
                volunteerId: client.data.userId,
                lat,
                lng,
                recordedAt: row.recordedAt.toISOString(),
                name: client.data.userName,
                campaignId: shipment.campaignId,
                shipmentId,
            };
            this.volunteerLocationService.upsertLocation(volunteerLocation);
            this.emitVolunteerLocationUpdates(volunteerLocation);
            this.server
                .to(`shipment:${shipmentId}:tracking`)
                .emit('shipment.location.changed', {
                shipmentId,
                lat,
                lng,
                speed: row.speed,
                heading: row.heading,
                recordedAt: row.recordedAt.toISOString(),
            });
            client.emit('shipment.location.ack', {
                shipmentId,
                recordedAt: row.recordedAt.toISOString(),
            });
        }
        catch (error) {
            this.emitSystemError(client, error, 'SHIPMENT_LOCATION_ERROR');
        }
    }
    async shipmentStatusUpdate(client, payload) {
        try {
            const shipmentId = Number(payload?.shipmentId);
            if (!Number.isInteger(shipmentId) || shipmentId <= 0) {
                throw new common_1.BadRequestException('shipmentId is invalid');
            }
            if (!payload?.status ||
                !Object.values(shipment_entity_2.ShipmentStatus).includes(payload.status)) {
                throw new common_1.BadRequestException('status is invalid');
            }
            await this.roomAuthorizationService.validateAndNormalizeRoom(`shipment:${shipmentId}:tracking`, {
                userId: client.data.userId,
                role: client.data.role,
            });
            const shipment = await this.shipmentsRepository.findOne({
                where: { id: shipmentId },
            });
            if (!shipment) {
                throw new common_1.BadRequestException('Shipment does not exist');
            }
            const previousStatus = shipment.status;
            if (previousStatus === payload.status) {
                return;
            }
            shipment.status = payload.status;
            await this.shipmentsRepository.save(shipment);
            this.server
                .to(`shipment:${shipmentId}:tracking`)
                .emit('shipment.status.changed', {
                shipmentId,
                previousStatus,
                status: shipment.status,
                updatedBy: client.data.userId,
                updatedAt: new Date().toISOString(),
            });
        }
        catch (error) {
            this.emitSystemError(client, error, 'SHIPMENT_STATUS_ERROR');
        }
    }
    async onMessageSent(event) {
        const message = await this.messagesRepository.findOne({
            where: { id: event.messageId },
        });
        if (!message) {
            return;
        }
        const author = await this.usersRepository.findOne({
            where: { id: message.userId },
            select: { id: true, name: true },
        });
        this.server
            .to(`campaign:${message.campaignId}:chat`)
            .emit('chat.message.created', {
            id: message.id,
            campaignId: message.campaignId,
            authorId: message.userId,
            authorName: author?.name ?? 'Usuario',
            message: message.message,
            createdAt: message.createdAt.toISOString(),
        });
    }
    onShipmentStatusChanged(event) {
        this.server
            .to(`shipment:${event.shipmentId}:tracking`)
            .emit('shipment.status.changed', {
            shipmentId: event.shipmentId,
            previousStatus: event.previousStatus,
            status: event.status,
            updatedBy: event.updatedBy,
            updatedAt: event.updatedAt.toISOString(),
        });
    }
    onShipmentAssigned(event) {
        this.server
            .to(`shipment:${event.shipmentId}:tracking`)
            .emit('shipment.assignment.changed', {
            shipmentId: event.shipmentId,
            volunteerId: event.volunteerId,
            assignedAt: new Date().toISOString(),
        });
    }
    onShipmentDelivered(event) {
        this.server
            .to(`shipment:${event.shipmentId}:tracking`)
            .emit('shipment.status.changed', {
            shipmentId: event.shipmentId,
            previousStatus: 'in_transit',
            status: 'delivered',
            updatedBy: null,
            updatedAt: event.deliveredAt.toISOString(),
        });
    }
    onShipmentLocationChanged(event) {
        this.server
            .to(`shipment:${event.shipmentId}:tracking`)
            .emit('shipment.location.changed', {
            shipmentId: event.shipmentId,
            lat: event.lat,
            lng: event.lng,
            speed: event.speed,
            heading: event.heading,
            recordedAt: event.recordedAt.toISOString(),
        });
        const location = {
            volunteerId: event.updatedBy,
            lat: event.lat,
            lng: event.lng,
            recordedAt: event.recordedAt.toISOString(),
            campaignId: event.campaignId,
            shipmentId: event.shipmentId,
        };
        this.volunteerLocationService.upsertLocation(location);
        this.emitVolunteerLocationUpdates(location);
    }
    onAuctionCreated(event) {
        this.server
            .to(`campaign:${event.campaignId}:auctions`)
            .emit('auction.created', {
            auctionId: event.auctionId,
            campaignId: event.campaignId,
            sellerId: event.sellerId,
            price: event.price,
            currency: event.currency,
            createdAt: new Date().toISOString(),
        });
    }
    onAuctionSold(event) {
        this.server
            .to(`campaign:${event.campaignId}:auctions`)
            .emit('auction.sold', {
            auctionId: event.auctionId,
            campaignId: event.campaignId,
            buyerId: event.buyerId,
            soldAt: event.soldAt.toISOString(),
            price: event.price,
            currency: event.currency,
        });
    }
    onBidPlaced(event) {
        this.server
            .to(`auction:${event.auctionId}:bids`)
            .emit('auction.bid.placed', {
            bidId: event.bidId,
            auctionId: event.auctionId,
            userId: event.userId,
            amount: event.amount,
            currentPrice: event.amount,
            placedAt: new Date().toISOString(),
        });
    }
    onAuctionClosed(event) {
        this.server.to(`auction:${event.auctionId}:bids`).emit('auction.closed', {
            auctionId: event.auctionId,
            winnerId: event.winnerId,
            winningAmount: event.winningAmount,
            currency: event.currency,
            closedAt: event.closedAt.toISOString(),
        });
    }
    onCampaignInventoryUpdated(event) {
        this.server
            .to(`campaign:${event.campaignId}:inventory`)
            .emit('campaign.inventory.updated', {
            campaignId: event.campaignId,
            itemType: event.itemType,
            quantity: event.quantity,
            updatedAt: new Date().toISOString(),
        });
    }
    onNotificationCreated(event) {
        this.server.to(`user:${event.userId}`).emit('notification.new', {
            notificationId: event.notificationId,
            message: event.message,
            auctionId: event.auctionId,
            createdAt: event.createdAt.toISOString(),
        });
    }
    tryExtractToken(client) {
        const authHeader = client.handshake.headers.authorization;
        if (typeof authHeader === 'string' &&
            authHeader.toLowerCase().startsWith('bearer ')) {
            return authHeader.slice(7);
        }
        const authToken = client.handshake.auth
            ?.token;
        if (typeof authToken === 'string' && authToken.trim().length > 0) {
            return authToken;
        }
        return null;
    }
    extractAndNormalizeCoordinates(payload) {
        const rawLat = payload?.lat ??
            payload?.latitude ??
            payload?.coords?.lat ??
            payload?.coords?.latitude;
        const rawLng = payload?.lng ??
            payload?.longitude ??
            payload?.coords?.lng ??
            payload?.coords?.longitude;
        const latCandidate = Number(rawLat);
        const lngCandidate = Number(rawLng);
        if (!Number.isFinite(latCandidate) || !Number.isFinite(lngCandidate)) {
            throw new common_1.BadRequestException('Coordinates are required (lat/lng or latitude/longitude)');
        }
        const shouldSwap = Math.abs(latCandidate) > 90 &&
            Math.abs(latCandidate) <= 180 &&
            Math.abs(lngCandidate) <= 90;
        const lat = shouldSwap ? lngCandidate : latCandidate;
        const lng = shouldSwap ? latCandidate : lngCandidate;
        if (shouldSwap) {
            this.logger.warn(`[tracking] coordinates normalized by swap rawLat=${latCandidate} rawLng=${lngCandidate} finalLat=${lat} finalLng=${lng}`);
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new common_1.BadRequestException('lat/lng are out of range');
        }
        return { lat, lng, normalizedCoordinates: shouldSwap };
    }
    validateVolunteerLocationDto(payload) {
        const dto = (0, class_transformer_1.plainToInstance)(volunteer_location_ws_dto_1.VolunteerLocationWsDto, payload, {
            enableImplicitConversion: false,
        });
        const errors = (0, class_validator_1.validateSync)(dto, {
            whitelist: true,
            forbidNonWhitelisted: true,
        });
        if (errors.length > 0) {
            throw new common_1.BadRequestException('Invalid volunteer location payload');
        }
        return dto;
    }
    parseRecordedAt(value) {
        if (value === undefined || value === null || value === '') {
            return new Date();
        }
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            throw new common_1.BadRequestException('recordedAt is invalid');
        }
        return parsed;
    }
    resolveCorrelationId(candidate) {
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
            return candidate.trim();
        }
        return (0, crypto_1.randomUUID)();
    }
    isImplausibleJump(previous, current) {
        const previousRecordedAt = new Date(previous.recordedAt);
        if (Number.isNaN(previousRecordedAt.getTime())) {
            return false;
        }
        const deltaSeconds = (current.recordedAt.getTime() - previousRecordedAt.getTime()) / 1000;
        if (deltaSeconds < -5) {
            return true;
        }
        if (deltaSeconds <= 0) {
            return false;
        }
        const distanceMeters = this.distanceInMeters(previous.lat, previous.lng, current.lat, current.lng);
        const impliedSpeed = distanceMeters / deltaSeconds;
        if (impliedSpeed > this.maxImpliedSpeedMetersPerSecond) {
            this.logger.warn(`[tracking] implausible jump volunteerId=${previous.volunteerId} distanceMeters=${distanceMeters.toFixed(2)} deltaSeconds=${deltaSeconds.toFixed(2)} impliedSpeed=${impliedSpeed.toFixed(2)}`);
            return true;
        }
        return false;
    }
    async resolveVolunteerActiveShipment(volunteerId) {
        const shipment = await this.shipmentsRepository.findOne({
            where: {
                assignedVolunteerId: volunteerId,
                status: (0, typeorm_2.In)([shipment_entity_2.ShipmentStatus.ASSIGNED, shipment_entity_2.ShipmentStatus.IN_TRANSIT]),
            },
            select: { id: true, campaignId: true },
            order: { id: 'DESC' },
        });
        if (!shipment) {
            return null;
        }
        return {
            shipmentId: shipment.id,
            campaignId: shipment.campaignId,
        };
    }
    distanceInMeters(lat1, lng1, lat2, lng2) {
        const toRadians = (value) => (value * Math.PI) / 180;
        const earthRadiusMeters = 6371000;
        const dLat = toRadians(lat2 - lat1);
        const dLng = toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) *
                Math.cos(toRadians(lat2)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusMeters * c;
    }
    emitGlobalVolunteersSnapshot(client) {
        const snapshot = {
            volunteers: this.volunteerLocationService.getAllLocations(),
        };
        client.emit('volunteers.locations.snapshot', snapshot);
        client.emit('volunteer.location.snapshot', snapshot);
    }
    emitCampaignVolunteersSnapshot(client, campaignId) {
        void this.emitCampaignVolunteersSnapshotAsync(client, campaignId);
    }
    async emitCampaignVolunteersSnapshotAsync(client, campaignId) {
        const memoryLocations = this.volunteerLocationService.getCampaignLocations(campaignId);
        const rows = await this.shipmentLocationsRepository
            .createQueryBuilder('l')
            .where('l.campaignId = :campaignId', { campaignId })
            .orderBy('l.recordedAt', 'DESC')
            .addOrderBy('l.id', 'DESC')
            .take(500)
            .getMany();
        const shipments = await this.shipmentsRepository.find({
            where: { campaignId },
            select: { id: true, assignedVolunteerId: true },
        });
        const assignedMap = new Map();
        for (const shipment of shipments) {
            assignedMap.set(shipment.id, shipment.assignedVolunteerId ?? null);
        }
        const byVolunteerId = new Map();
        for (const location of memoryLocations) {
            byVolunteerId.set(location.volunteerId, location);
        }
        for (const row of rows) {
            const volunteerId = assignedMap.get(row.shipmentId) ?? row.updatedBy ?? undefined;
            if (!volunteerId || byVolunteerId.has(volunteerId)) {
                continue;
            }
            if (!this.volunteerPresenceService.isConnected(volunteerId)) {
                continue;
            }
            byVolunteerId.set(volunteerId, {
                volunteerId,
                lat: row.lat,
                lng: row.lng,
                recordedAt: row.recordedAt.toISOString(),
                campaignId,
                shipmentId: row.shipmentId,
            });
        }
        const volunteers = Array.from(byVolunteerId.values());
        const snapshot = {
            volunteers,
        };
        client.emit('campaign.volunteers.snapshot', {
            campaignId,
            volunteers,
        });
        client.emit('volunteers.locations.snapshot', snapshot);
    }
    emitVolunteerLocationUpdates(location) {
        const payload = {
            volunteerId: location.volunteerId,
            lat: location.lat,
            lng: location.lng,
            recordedAt: location.recordedAt,
            campaignId: location.campaignId,
            shipmentId: location.shipmentId,
            name: location.name,
            correlationId: location.correlationId,
            normalizedCoordinates: location.normalizedCoordinates,
            stale: location.stale,
            serverReceivedAt: location.serverReceivedAt,
        };
        this.server
            .to('volunteers:locations')
            .emit('volunteer.location.updated', payload);
        this.server
            .to('volunteers:locations')
            .emit('volunteer.location.changed', payload);
        this.server
            .to('volunteers:locations')
            .emit('volunteer.location.update', payload);
        this.server
            .to('volunteers:tracking')
            .emit('volunteer.location.updated', payload);
        this.server
            .to('volunteers:tracking')
            .emit('volunteer.location.changed', payload);
        this.server
            .to('volunteers:tracking')
            .emit('volunteer.location.update', payload);
        if (location.campaignId) {
            this.server
                .to(`campaign:${location.campaignId}:volunteers:tracking`)
                .emit('volunteer.location.updated', payload);
            this.server
                .to(`campaign:${location.campaignId}:volunteers:tracking`)
                .emit('volunteer.location.changed', payload);
            this.server
                .to(`campaign:${location.campaignId}:volunteers:tracking`)
                .emit('volunteer.location.update', payload);
        }
    }
    ensureAuthenticated(client) {
        if (!client.data.isAuthenticated) {
            throw new common_1.BadRequestException('Authenticated user is required');
        }
    }
    ensureVolunteerRole(client) {
        if (client.data.role !== user_entity_1.UserRole.VOLUNTEER) {
            throw new common_1.BadRequestException('Only volunteers can report location updates');
        }
    }
    emitSystemError(client, error, code) {
        client.emit('system.error', {
            code,
            message: error instanceof Error ? error.message : 'Unexpected error',
        });
    }
    enforceRateLimit(client, eventName, maxEvents, intervalMs) {
        const now = Date.now();
        const bucket = client.data.rateLimit[eventName] ?? [];
        const filtered = bucket.filter((timestamp) => now - timestamp < intervalMs);
        if (filtered.length >= maxEvents) {
            throw new common_1.BadRequestException(`Rate limit exceeded for ${eventName}. Please retry later.`);
        }
        filtered.push(now);
        client.data.rateLimit[eventName] = filtered;
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('system.join_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "joinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('system.leave_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "leaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat.send'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "sendChatMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat.typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "chatTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('shipment.subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "subscribeShipment", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('campaign.volunteers.subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "subscribeCampaignVolunteers", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('volunteers.locations.snapshot.request'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleVolunteerSnapshotRequest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('volunteer.location.update'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "volunteerLocationUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('shipment.location.update'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "shipmentLocationUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('shipment.status.update'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "shipmentStatusUpdate", null);
__decorate([
    (0, event_emitter_1.OnEvent)('message.sent'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "onMessageSent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('shipment.status.changed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "onShipmentStatusChanged", null);
__decorate([
    (0, event_emitter_1.OnEvent)('shipment.assigned'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "onShipmentAssigned", null);
__decorate([
    (0, event_emitter_1.OnEvent)('shipment.delivered'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "onShipmentDelivered", null);
__decorate([
    (0, event_emitter_1.OnEvent)('shipment.location.changed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "onShipmentLocationChanged", null);
__decorate([
    (0, event_emitter_1.OnEvent)('auction.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "onAuctionCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('auction.sold'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "onAuctionSold", null);
__decorate([
    (0, event_emitter_1.OnEvent)('bid.placed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "onBidPlaced", null);
__decorate([
    (0, event_emitter_1.OnEvent)('auction.closed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "onAuctionClosed", null);
__decorate([
    (0, event_emitter_1.OnEvent)('campaign.inventory.updated'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "onCampaignInventoryUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('notification.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "onNotificationCreated", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/ws',
        cors: {
            origin: (origin, callback) => {
                callback(null, isAllowedCorsOrigin(origin));
            },
            credentials: true,
            methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'ngrok-skip-browser-warning',
            ],
        },
    }),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(1, (0, typeorm_1.InjectRepository)(campaign_entity_1.Campaign)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(shipment_entity_1.Shipment)),
    __param(4, (0, typeorm_1.InjectRepository)(shipment_location_history_entity_1.ShipmentLocationHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        realtime_auth_service_1.RealtimeAuthService,
        room_authorization_service_1.RoomAuthorizationService,
        volunteer_presence_service_1.VolunteerPresenceService,
        volunteer_location_service_1.VolunteerLocationService,
        event_emitter_2.EventEmitter2])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map