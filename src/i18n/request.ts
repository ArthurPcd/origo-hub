import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/lib/i18n/config';
import { messages } from '@/lib/i18n/messages';

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically this is configured in middleware
  const locale = await requestLocale;

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) {
    notFound();
  }

  return {
    locale,
    messages: messages[locale as keyof typeof messages],
  };
});
