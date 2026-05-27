export type UUID = string;
export type ISODateTime = string;
export type Phone = string;

export type SalonStatus = "pending" | "active" | "suspended";
export type SalonType = "mens" | "ladies" | "unisex";

export type PartnerRole = "owner" | "receptionist" | "stylist";
export type StylistStatus = "available" | "busy" | "break" | "off";

export type ServiceCategory = "hair" | "beard" | "colour" | "facial";
export type Gender = "male" | "female" | "all";

export type QueueStatus =
  | "waiting"
  | "arrived"
  | "serving"
  | "completed"
  | "no_show"
  | "cancelled";

export type QueueSource = "app" | "whatsapp" | "walk_in_manual";

export type InvoiceStatus = "pending" | "paid" | "disputed" | "overdue";
export type PaymentStatus = "pending" | "paid" | "refunded";
export type NotificationChannel = "whatsapp" | "sms" | "push";

export type AcquisitionSource = "skipq" | "walk_in" | "salon_existing";
