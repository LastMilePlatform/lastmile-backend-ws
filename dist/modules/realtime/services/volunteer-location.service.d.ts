export type VolunteerLocationDto = {
    volunteerId: number;
    lat: number;
    lng: number;
    recordedAt: string;
    correlationId?: string;
    normalizedCoordinates?: boolean;
    stale?: boolean;
    serverReceivedAt?: string;
    name?: string;
    campaignId?: number;
    shipmentId?: number;
};
export type VolunteerLocationsSnapshotDto = {
    volunteers: VolunteerLocationDto[];
};
export type VolunteerDisconnectedDto = {
    volunteerId: number;
};
export declare class VolunteerLocationService {
    private readonly latestLocationByVolunteerId;
    upsertLocation(location: VolunteerLocationDto): VolunteerLocationDto;
    getByVolunteerId(volunteerId: number): VolunteerLocationDto | undefined;
    removeLocation(volunteerId: number): boolean;
    getAllLocations(): VolunteerLocationDto[];
    getCampaignLocations(campaignId: number): VolunteerLocationDto[];
}
