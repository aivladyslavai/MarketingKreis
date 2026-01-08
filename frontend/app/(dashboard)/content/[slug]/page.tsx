import ClientCampaignDetail from "@/components/content/CampaignDetailClient"

export default function Page({ params }: { params: { slug: string } }) {
  return <ClientCampaignDetail slug={params.slug} />
}


