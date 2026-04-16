import { redirect } from 'next/navigation';

export default function CreatePhoneNumberRedirect() {
  redirect('/dashboard/phonenumbers');
}
