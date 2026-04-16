import { redirect } from 'next/navigation';

export default function Page() {
  // Always redirect to the dashboard no (auth) check needed.
  redirect('/dashboard/analytics');
}
