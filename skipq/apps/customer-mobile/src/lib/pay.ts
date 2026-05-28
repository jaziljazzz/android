/**
 * Razorpay wrapper.
 *
 * react-native-razorpay needs native modules and won't load under Expo
 * Go (use a dev build). All calls here detect a missing module and
 * throw a friendly error so the caller can show "Open the dev build to pay".
 */
import { supabase } from "./supabase";

type RazorpayShape = {
  open: (options: Record<string, unknown>) => Promise<{ razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }>;
};

let RazorpayCheckout: RazorpayShape | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("react-native-razorpay");
  RazorpayCheckout = mod.default ?? mod;
} catch {
  RazorpayCheckout = null;
}

export interface PayResult {
  paymentId: string;
  orderId: string;
}

export interface PayParams {
  queueEntryId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  salonName: string;
}

/**
 * Calls the create-payment-order edge function to get a Razorpay order,
 * opens the checkout sheet, returns the payment result.
 */
export async function payForQueueEntry(params: PayParams): Promise<PayResult> {
  if (!RazorpayCheckout) {
    throw new Error(
      "Payments require the dev/preview build of SkipQ. Open the installed app instead of Expo Go.",
    );
  }

  // 1. Create the order server-side
  const { data, error } = await supabase.functions.invoke("create-payment-order", {
    body: { queue_entry_id: params.queueEntryId },
  });

  if (error) {
    throw new Error(error.message || "Couldn't create payment order");
  }

  const order = data as {
    order_id: string;
    amount: number;
    currency: string;
    key_id: string;
    payment_id: string;
  };

  if (!order?.order_id || !order?.key_id) {
    throw new Error("Server didn't return a valid Razorpay order");
  }

  // 2. Open Razorpay checkout
  const result = await RazorpayCheckout.open({
    description: `Booking at ${params.salonName}`,
    image: undefined,
    currency: order.currency,
    key: order.key_id,
    amount: order.amount,
    name: "SkipQ",
    order_id: order.order_id,
    prefill: {
      email: params.customerEmail ?? "",
      contact: params.customerPhone.replace(/^\+/, ""),
      name: params.customerName,
    },
    theme: { color: "#FF5454" },
  });

  return {
    paymentId: result.razorpay_payment_id,
    orderId: result.razorpay_order_id,
  };
}

export function isPayAvailable(): boolean {
  return RazorpayCheckout !== null;
}
