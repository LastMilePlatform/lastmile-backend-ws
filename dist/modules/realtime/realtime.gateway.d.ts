import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { Message } from '../chat/entities/message.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { User } from '../users/entities/user.entity';
import { Shipment } from '../logistics/entities/shipment.entity';
import { ShipmentStatus } from '../logistics/entities/shipment.entity';
import { ShipmentLocationHistory } from '../logistics/entities/shipment-location-history.entity';
import type { AuctionClosedEvent } from '../../events/auction-closed.event';
import type { AuctionCreatedEvent } from '../../events/auction-created.event';
import type { AuctionSoldEvent } from '../../events/auction-sold.event';
import type { BidPlacedEvent } from '../../events/bid-placed.event';
import type { CampaignInventoryUpdatedEvent } from '../../events/campaign-inventory-updated.event';
import type { ShipmentAssignedEvent } from '../../events/shipment-assigned.event';
import type { ShipmentDeliveredEvent } from '../../events/shipment-delivered.event';
import type { ShipmentLocationChangedEvent } from '../../events/shipment-location-changed.event';
import type { ShipmentStatusChangedEvent } from '../../events/shipment-status-changed.event';
import type { MessageSentEvent } from '../../events/message-sent.event';
import { RealtimeAuthService } from './services/realtime-auth.service';
import { RoomAuthorizationService } from './services/room-authorization.service';
import { VolunteerLocationService } from './services/volunteer-location.service';
import { VolunteerPresenceService } from './services/volunteer-presence.service';
type AuthenticatedSocket = Socket & {
    data: {
        userId: number;
        userName: string;
        role: string;
        rateLimit: Record<string, number[]>;
        isAuthenticated: boolean;
    };
};
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    private readonly messagesRepository;
    private readonly campaignsRepository;
    private readonly usersRepository;
    private readonly shipmentsRepository;
    private readonly shipmentLocationsRepository;
    private readonly realtimeAuthService;
    private readonly roomAuthorizationService;
    private readonly volunteerPresenceService;
    private readonly volunteerLocationService;
    private readonly eventEmitter;
    server: Server;
    private readonly logger;
    private readonly staleThresholdMs;
    private readonly maxImpliedSpeedMetersPerSecond;
    constructor(messagesRepository: Repository<Message>, campaignsRepository: Repository<Campaign>, usersRepository: Repository<User>, shipmentsRepository: Repository<Shipment>, shipmentLocationsRepository: Repository<ShipmentLocationHistory>, realtimeAuthService: RealtimeAuthService, roomAuthorizationService: RoomAuthorizationService, volunteerPresenceService: VolunteerPresenceService, volunteerLocationService: VolunteerLocationService, eventEmitter: EventEmitter2);
    afterInit(server: Server): Promise<void>;
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    joinRoom(client: AuthenticatedSocket, payload: {
        room?: string;
    }): Promise<void>;
    leaveRoom(client: AuthenticatedSocket, payload: {
        room?: string;
    }): Promise<void>;
    sendChatMessage(client: AuthenticatedSocket, payload: {
        campaignId?: number;
        message?: string;
    }): Promise<void>;
    chatTyping(client: AuthenticatedSocket, payload: {
        campaignId?: number;
        isTyping?: boolean;
    }): Promise<void>;
    subscribeShipment(client: AuthenticatedSocket, payload: {
        shipmentId?: number;
    }): Promise<void>;
    subscribeCampaignVolunteers(client: AuthenticatedSocket, payload: {
        campaignId?: number;
    }): Promise<void>;
    handleVolunteerSnapshotRequest(client: AuthenticatedSocket): void;
    volunteerLocationUpdate(client: AuthenticatedSocket, payload: {
        lat?: number;
        lng?: number;
        latitude?: number;
        longitude?: number;
        coords?: {
            lat?: number;
            lng?: number;
            latitude?: number;
            longitude?: number;
        };
        recordedAt?: string | number;
        campaignId?: number;
        shipmentId?: number;
        correlationId?: string;
    }): Promise<void>;
    shipmentLocationUpdate(client: AuthenticatedSocket, payload: {
        shipmentId?: number;
        lat?: number;
        lng?: number;
        latitude?: number;
        longitude?: number;
        coords?: {
            lat?: number;
            lng?: number;
            latitude?: number;
            longitude?: number;
        };
        speed?: number;
        heading?: number;
        recordedAt?: string | number;
    }): Promise<void>;
    shipmentStatusUpdate(client: AuthenticatedSocket, payload: {
        shipmentId?: number;
        status?: ShipmentStatus;
    }): Promise<void>;
    onMessageSent(event: MessageSentEvent): Promise<void>;
    onShipmentStatusChanged(event: ShipmentStatusChangedEvent): void;
    onShipmentAssigned(event: ShipmentAssignedEvent): void;
    onShipmentDelivered(event: ShipmentDeliveredEvent): void;
    onShipmentLocationChanged(event: ShipmentLocationChangedEvent): void;
    onAuctionCreated(event: AuctionCreatedEvent): void;
    onAuctionSold(event: AuctionSoldEvent): void;
    onBidPlaced(event: BidPlacedEvent): void;
    onAuctionClosed(event: AuctionClosedEvent): void;
    onCampaignInventoryUpdated(event: CampaignInventoryUpdatedEvent): void;
    onNotificationCreated(event: any): void;
    private tryExtractToken;
    private extractAndNormalizeCoordinates;
    private validateVolunteerLocationDto;
    private parseRecordedAt;
    private resolveCorrelationId;
    private isImplausibleJump;
    private resolveVolunteerActiveShipment;
    private distanceInMeters;
    private emitGlobalVolunteersSnapshot;
    private emitCampaignVolunteersSnapshot;
    private emitCampaignVolunteersSnapshotAsync;
    private emitVolunteerLocationUpdates;
    private ensureAuthenticated;
    private ensureVolunteerRole;
    private emitSystemError;
    private enforceRateLimit;
}
export {};
