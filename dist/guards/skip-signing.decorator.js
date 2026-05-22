"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkipSigning = void 0;
const common_1 = require("@nestjs/common");
const request_signing_guard_1 = require("./request-signing.guard");
const SkipSigning = () => (0, common_1.SetMetadata)(request_signing_guard_1.SKIP_SIGNING_KEY, true);
exports.SkipSigning = SkipSigning;
//# sourceMappingURL=skip-signing.decorator.js.map