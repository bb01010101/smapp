import { getProductById } from "@/actions/marketplace.action";
import { notFound } from "next/navigation";
import ProductDetail from "./ProductDetail";

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductById(params.id);
  
  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
} 