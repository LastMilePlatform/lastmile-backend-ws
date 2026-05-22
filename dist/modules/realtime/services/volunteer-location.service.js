"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VolunteerLocationService = void 0;
const common_1 = require("@nestjs/common");
let VolunteerLocationService = class VolunteerLocationService {
    latestLocationByVolunteerId = new Map();
    upsertLocation(location) {
        this.latestLocationByVolunteerId.set(location.volunteerId, location);
        return location;
    }
    getByVolunteerId(volunteerId) {
        return this.latestLocationByVolunteerId.get(volunteerId);
    }
    removeLocation(volunteerId) {
        return this.latestLocationByVolunteerId.delete(volunteerId);
    }
    getAllLocations() {
        return Array.from(this.latestLocationByVolunteerId.values()).sort((a, b) => a.volunteerId - b.volunteerId);
    }
    getCampaignLocations(campaignId) {
        return this.getAllLocations().filter((location) => location.campaignId === campaignId);
    }
};
exports.VolunteerLocationService = VolunteerLocationService;
exports.VolunteerLocationService = VolunteerLocationService = __decorate([
    (0, common_1.Injectable)()
], VolunteerLocationService);
//# sourceMappingURL=volunteer-location.service.js.map