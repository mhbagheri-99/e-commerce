import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import db from "@/db/db";
import { cache } from "@/lib/cache";
import { Suspense } from "react";

const ProductsPage = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Suspense
        fallback={
          <>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </>
        }
      >
        <ProductsSuspense />
      </Suspense>
    </div>
  );
};

export default ProductsPage;

const getProducts = cache(
  async () => {
    const products = await db.product.findMany({
      where: { isAvailable: true },
      orderBy: { name: "asc" },
    });
    return products;
  },
  ["/products", "all-products"],
  { revalidate: 60 * 60 * 24 },
);

const ProductsSuspense = async () => {
  const products = await getProducts();
  return products.map((product) => (
    <ProductCard key={product.id} {...product} />
  ));
};
