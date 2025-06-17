import { getProducts, getServices } from "@/actions/marketplace.action";
import MarketplaceClient from "./MarketplaceClient";

export default async function MarketplacePage() {
  const [products, services] = await Promise.all([
    getProducts(),
    getServices(),
  ]);

  return (
    <MarketplaceClient products={products} services={services} />
  );
} 