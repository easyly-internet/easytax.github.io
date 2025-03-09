"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = exports.PaymentStatus = exports.PaymentType = exports.SubscriptionStatus = exports.SubscriptionPlan = void 0;
var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["BASIC"] = "BASIC";
    SubscriptionPlan["STANDARD"] = "STANDARD";
    SubscriptionPlan["PREMIUM"] = "PREMIUM";
})(SubscriptionPlan || (exports.SubscriptionPlan = SubscriptionPlan = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["PENDING"] = "PENDING";
    SubscriptionStatus["CANCELED"] = "CANCELED";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var PaymentType;
(function (PaymentType) {
    PaymentType["SUBSCRIPTION"] = "SUBSCRIPTION";
    PaymentType["ONE_TIME"] = "ONE_TIME";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["UPI"] = "UPI";
    PaymentMethod["NETBANKING"] = "NETBANKING";
    PaymentMethod["WALLET"] = "WALLET";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
//# sourceMappingURL=payment.js.map