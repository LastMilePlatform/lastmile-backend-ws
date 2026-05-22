export declare enum UserRole {
    ORGANIZER = "organizer",
    VOLUNTEER = "volunteer",
    DONOR = "donor"
}
export declare class User {
    id: number;
    name: string;
    email: string;
    password?: string | null;
    googleId?: string | null;
    role: UserRole;
    createdAt: Date;
}
