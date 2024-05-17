"use server";

import db from "@/db/db";
import { DiscountCodeType } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

const addSchema = z
  .object({
    code: z.string().min(1),
    discountType: z.nativeEnum(DiscountCodeType),
    discountAmount: z.coerce.number().int().min(1),
    allProducts: z.coerce.boolean(),
    limit: z
      .preprocess(
        (value) => (value === "" ? undefined : value),
        z.coerce.number().int().min(0).optional(),
      )
      .optional(),
    discountedProductIds: z.array(z.string()).optional(),
    expiresAt: z
      .preprocess(
        (value) => (value === "" ? undefined : value),
        z.coerce.date().min(new Date()).optional(),
      )
      .optional(),
  })
  .refine((data) => !data.allProducts || data.discountedProductIds == null, {
    message:
      "All products cannot be selected when specific products are selected.", // BUG: doesn't trigger
    path: ["allProducts"],
  })
  .refine((data) => data.allProducts || data.discountedProductIds != null, {
    message: "At least one product must be selected.",
    path: ["discountedProductIds"],
  })
  .refine(
    (data) =>
      data.discountAmount <= 100 ||
      data.discountType !== DiscountCodeType.PERCENTAGE,
    {
      message: "Percentage discount must be less than or equal to 100%.",
      path: ["discountAmount"],
    },
  );

export const addCoupon = async (prevState: unknown, formData: FormData) => {
  const discountedProductIds = formData.getAll("discountedProductIds");
  const result = addSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    discountedProductIds: discountedProductIds.length
      ? discountedProductIds
      : undefined,
  });

  if (!result.success) {
    return result.error.formErrors.fieldErrors;
  }

  const data = result.data;
  
  await db.discountCode.create({
    data: {
      code: data.code,
      discountType: data.discountType,
      discountAmount: data.discountAmount,
      limit: data.limit,
      expiresAt: data.expiresAt,
      allProducts: data.allProducts,
      products:
        data.discountedProductIds != null
          ? {
              connect: data.discountedProductIds.map((id) => ({ id })),
            }
          : undefined,
    },
  });

  redirect("/admin/coupons");
};

export const deleteCoupon = async (id: string) => {
  const coupon = await db.discountCode.delete({ where: { id } });

  if (!coupon) {
    return notFound();
  }
};

export const setCouponAvailability = async (id: string, isActive: boolean) => {
  await db.discountCode.update({
    where: { id },
    data: { isActive },
  });
};
