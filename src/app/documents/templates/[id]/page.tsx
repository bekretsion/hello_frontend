import { redirect } from 'next/navigation';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export default async function DocumentsTemplatesDetailRedirect({ params }: Params) {
  const { id } = await params;
  redirect(`/dashboard/documents/templates/${id}`);
}


