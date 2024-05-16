import React from "react";
import PageHeader from "../../_components/PageHeader";
import CouponForm from "../_components/CouponForm";
import db from "@/db/db";

const CreateCouponPage = async () => {
  const products = await db.product.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader>Add Coupon</PageHeader>
      <CouponForm products={products} />
    </>
  );
};

export default CreateCouponPage;
