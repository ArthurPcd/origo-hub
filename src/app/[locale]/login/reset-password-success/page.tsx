import { redirect } from 'next/navigation';

// Clerk redirects here after a successful password reset + session creation.
// We simply bounce the user to their dashboard.
export default function ResetPasswordSuccessPage() {
  redirect('/history');
}
