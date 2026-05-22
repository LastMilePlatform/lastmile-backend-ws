export declare enum CampaignType {
    MONEY = "money",
    PHYSICAL_ITEMS = "physical_items",
    MIXED = "mixed"
}
export declare class Campaign {
    id: number;
    name: string;
    description: string;
    campaignType: CampaignType;
    goalMoney: number;
    collectedMoney: number;
    eventId: number;
    createdBy: number;
    createdAt: Date;
}
