export type PresenceRole = string;
export type DisconnectedPresence = {
    userId: number;
    role: PresenceRole;
    stillConnected: boolean;
};
export declare class VolunteerPresenceService {
    private readonly socketsByUserId;
    private readonly userBySocketId;
    registerConnection(socketId: string, userId: number, role: PresenceRole): void;
    unregisterConnection(socketId: string): DisconnectedPresence | null;
    isConnected(userId: number): boolean;
    getLinkedUser(socketId: string): {
        userId: number;
        role: PresenceRole;
    } | null;
}
