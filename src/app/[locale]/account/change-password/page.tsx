import { UserProfile } from '@clerk/nextjs'

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base py-8">
      <UserProfile routing="hash" />
    </div>
  )
}
