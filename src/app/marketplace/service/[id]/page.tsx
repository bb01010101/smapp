import { getServiceById } from "@/actions/marketplace.action";
import { notFound } from "next/navigation";
import ServiceDetail from "./ServiceDetail";

interface ServicePageProps {
  params: {
    id: string;
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const service = await getServiceById(params.id);
  
  if (!service) {
    notFound();
  }

  return <ServiceDetail service={service} />;
} 