import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z
    .string({
      message: "Field 'productId' is required and must be a string.",
    })
    .min(1, "Field 'productId' cannot be empty."),
  quantity: z
    .number({
      message: "Field 'quantity' is required and must be a number.",
    })
    .int("Field 'quantity' must be an integer.")
    .min(1, "Field 'quantity' must be a positive integer greater than or equal to 1."),
  cartId: z
    .string({
      message: "Field 'cartId' must be a string.",
    })
    .min(1, "Field 'cartId' cannot be empty.")
    .optional(),
});
export type AddToCartInput = z.infer<typeof addToCartSchema>;
