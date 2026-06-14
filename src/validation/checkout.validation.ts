import { z } from 'zod';

export const checkoutSchema = z.object({
  cartId: z
    .string({
      message: "Field 'cartId' is required and must be a string.",
    })
    .min(1, "Field 'cartId' cannot be empty."),
  couponCode: z
    .string({
      message: "Field 'couponCode' must be a string.",
    })
    .min(1, "Field 'couponCode' cannot be empty.")
    .optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
