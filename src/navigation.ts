import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Services',
      links: [
        { text: 'Services', href: getPermalink('/services') },
        { text: 'Pricing', href: getPermalink('/services-pricing') },
      ],
    },
    { text: 'About', href: getPermalink('/about') },
    { text: 'Contact', href: getPermalink('/contact') },
    {
      text: 'Tools',
      links: [
        { text: 'All tools', href: getPermalink('/tools') },
        { text: 'Authentication checker', href: getPermalink('/tools/auth-checker') },
        { text: 'DMARC report viewer', href: getPermalink('/tools/dmarc-report-viewer') },
        { text: 'Preflight checklist', href: getPermalink('/tools/preflight-checklist') },
        { text: 'ROI calculator', href: getPermalink('/tools/roi-calculator') },
        { text: 'Mautic vs ESP comparison', href: getPermalink('/tools/mautic-cost-comparison') },
        { text: 'SPF generator', href: getPermalink('/tools/spf-generator') },
      ],
    },
    { text: 'Blog', href: getBlogPermalink() },
    { text: 'The Brief', href: getPermalink('/brief') },
  ],
  actions: [
  {
    text: 'Free Consultation',
    href: getPermalink('/contact'),
    variant: 'primary',
  },
],
};

export const footerData = {
  links: [
    {
      title: 'Site',
      links: [
        { text: 'Services', href: getPermalink('/services') },
        { text: 'Pricing', href: getPermalink('/services-pricing') },
        { text: 'About', href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact') },
        { text: 'Blog', href: getBlogPermalink() },
        { text: 'The Brief', href: getPermalink('/brief') },
      ],
    },
    {
      title: 'Tools',
      links: [
        { text: 'Authentication checker', href: getPermalink('/tools/auth-checker') },
        { text: 'DMARC report viewer', href: getPermalink('/tools/dmarc-report-viewer') },
        { text: 'Preflight checklist', href: getPermalink('/tools/preflight-checklist') },
        { text: 'ROI calculator', href: getPermalink('/tools/roi-calculator') },
        { text: 'Mautic vs ESP comparison', href: getPermalink('/tools/mautic-cost-comparison') },
        { text: 'SPF generator', href: getPermalink('/tools/spf-generator') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [],
  footNote: `
    MacDougall Email — Email Infrastructure & Deliverability · © ${new Date().getFullYear()} · All rights reserved.
  `,
};
