"use server";

import db from "@/db/db";

export const userOrderExists = async (email: string, productId: string) => {
  const order = await db.order.findFirst({
    where: {
      user: { email },
      productId,
    },
    select: {
      id: true,
    },
  });
  if (order) {
    return true;
  }
  return false;
};
