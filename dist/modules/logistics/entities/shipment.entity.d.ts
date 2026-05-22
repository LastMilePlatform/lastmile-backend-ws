export declare enum ShipmentStatus {
    PENDING = "pending",
    ASSIGNED = "assigned",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered"
}
export declare class Shipment {
    id: number;
    campaignId: number;
    pickupPointId: number;
    assignedVolunteerId: number | null;
    status: ShipmentStatus;
    createdAt: Date;
}
