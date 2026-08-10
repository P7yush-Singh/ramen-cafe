import { notFound } from "next/navigation";
import { products } from "@/data/products";
import ProductDetails from "@/components/ProductDetails";

export default async function ProductPage({ params }) {
  const { id } = await params;

  const product = products.find(
    (item) => item.id === id
  );

  if (!product) {
    notFound();
  }

  return <ProductDetails product={product} />;
}