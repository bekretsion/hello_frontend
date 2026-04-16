import { redirect } from 'next/navigation';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export default async function DocumentsInvoicesDetailRedirect({ params }: Params) {
  const { id } = await params;
  redirect(`/dashboard/documents/invoices/${id}`);
}


