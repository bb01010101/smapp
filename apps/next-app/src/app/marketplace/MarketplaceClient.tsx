"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import ProductList from "@/components/marketplace/ProductList";
import ServiceList from "@/components/marketplace/ServiceList";
import CreateProductDialog from "@/components/marketplace/CreateProductDialog";
import CreateServiceDialog from "@/components/marketplace/CreateServiceDialog";

type Product = {
  id: string;
  title: string | null;
  description: string | null;
  price: number | null;
  image: string | null;
  category: string | null;
  condition: string | null;
  location: string | null;
  isAffiliate: boolean | null;
  affiliateLink: string | null;
  affiliateCode: string | null;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    clerkId: string;
  };
  createdAt: Date;
};

type Service = {
  id: string;
  title: string | null;
  description: string | null;
  price: number | null;
  priceType: string | null;
  category: string | null;
  location: string | null;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    clerkId: string;
  };
  createdAt: Date;
};

interface MarketplaceClientProps {
  products: Product[];
  services: Service[];
}

export default function MarketplaceClient({ products, services }: MarketplaceClientProps) {
  const { user } = useUser();
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateService, setShowCreateService] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        {user ? (
          <div className="flex gap-4">
            <Button
              onClick={() => setShowCreateProduct(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="size-4" />
              List Product
            </Button>
            <Button
              onClick={() => setShowCreateService(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="size-4" />
              List Service
            </Button>
          </div>
        ) : (
          <SignInButton mode="modal">
            <Button>Sign in to list items</Button>
          </SignInButton>
        )}
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductList products={products} />
        </TabsContent>

        <TabsContent value="services">
          <ServiceList services={services} />
        </TabsContent>
      </Tabs>

      <CreateProductDialog
        open={showCreateProduct}
        onOpenChange={setShowCreateProduct}
      />

      <CreateServiceDialog
        open={showCreateService}
        onOpenChange={setShowCreateService}
      />
    </div>
  );
} 