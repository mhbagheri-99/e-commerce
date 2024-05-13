import db from "@/db/db";

const ProductPurchasePage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const product = await db.product.findUnique({
    where: { id },
  });
  return <div>page</div>;
};

export default ProductPurchasePage;
