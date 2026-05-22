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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShipmentLocationHistory = void 0;
const typeorm_1 = require("typeorm");
let ShipmentLocationHistory = class ShipmentLocationHistory {
    id;
    shipmentId;
    campaignId;
    lat;
    lng;
    speed;
    heading;
    recordedAt;
    updatedBy;
    createdAt;
};
exports.ShipmentLocationHistory = ShipmentLocationHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ShipmentLocationHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ShipmentLocationHistory.prototype, "shipmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ShipmentLocationHistory.prototype, "campaignId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], ShipmentLocationHistory.prototype, "lat", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], ShipmentLocationHistory.prototype, "lng", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Object)
], ShipmentLocationHistory.prototype, "speed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Object)
], ShipmentLocationHistory.prototype, "heading", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ShipmentLocationHistory.prototype, "recordedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ShipmentLocationHistory.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ShipmentLocationHistory.prototype, "createdAt", void 0);
exports.ShipmentLocationHistory = ShipmentLocationHistory = __decorate([
    (0, typeorm_1.Entity)('shipment_location_history'),
    (0, typeorm_1.Index)('idx_shipment_location_history_shipment_recorded_at', [
        'shipmentId',
        'recordedAt',
    ])
], ShipmentLocationHistory);
//# sourceMappingURL=shipment-location-history.entity.js.map