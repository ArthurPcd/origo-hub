import { SignUp } from '@clerk/nextjs'
import {
  frFR, deDE, esES, itIT, ruRU, zhCN,
} from '@clerk/localizations'

const localeMap: Record<string, typeof frFR> = {
  fr: frFR, de: deDE, es: esES, it: itIT, ru: ruRU, zh: zhCN,
}

const clerkAppearance = {
  variables: {
    colorPrimary: '#00D9FF',
    colorBackground: '#0d0d14',
    colorInputBackground: '#111117',
    colorText: '#ffffff',
    colorTextSecondary: '#a0a0a0',
    colorNeutral: '#ffffff',
    borderRadius: '8px',
  },
  elements: {
    card: 'shadow-2xl border border-white/10',
    socialButtonsBlockButton: 'bg-white! text-gray-900! border border-gray-300 hover:bg-gray-100! font-medium',
    socialButtonsBlockButtonText: 'text-gray-900! font-medium',
    formButtonPrimary: 'bg-[#00D9FF]! hover:bg-[#00B8D9]! text-black! font-semibold shadow-none',
    footerActionLink: 'text-[#00D9FF]! hover:text-[#00B8D9]!',
    formFieldInput: 'bg-[#111117]! border-white/10! text-white! placeholder-gray-500',
    formFieldLabel: 'text-gray-300!',
    dividerLine: 'bg-white/10!',
    dividerText: 'text-gray-500!',
  },
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const localization = localeMap[locale]

  return (
    <div className="min-h-screen flex items-center justify-center bg-base">
      <SignUp
        appearance={clerkAppearance}
        {...(localization ? { localization } : {})}
      />
    </div>
  )
}
