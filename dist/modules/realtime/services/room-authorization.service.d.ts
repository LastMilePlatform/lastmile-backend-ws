import { Repository } from 'typeorm';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { Event } from '../../events/entities/event.entity';
import { Shipment } from '../../logistics/entities/shipment.entity';
import { AuthUser } from './realtime-auth.service';
export declare class RoomAuthorizationService {
    private readonly campaignsRepository;
    private readonly shipmentsRepository;
    private readonly eventsRepository;
    constructor(campaignsRepository: Repository<Campaign>, shipmentsRepository: Repository<Shipment>, eventsRepository: Repository<Event>);
    validateAndNormalizeRoom(room: string, user: AuthUser): Promise<string>;
    private ensureCampaignVisible;
    private ensureShipmentAllowed;
    private ensureEventOpsAllowed;
}
