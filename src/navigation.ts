import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'Services', href: getPermalink('/services') },
    { text: 'About', href: getPermalink('/about') },
    { text: 'Contact', href: getPermalink('/contact') },
    {
      text: 'Tools',
      items: [
        { text: 'Authentication checker', href: getPermalink('/tools') },
        { text: 'Cost calculator', href: getPermalink('/roi-calculator') },
        { text: 'Mautic vs ESP comparison', href: getPermalink('/mautic-cost-comparison') },
      ],
    },
    { text: 'Blog', href: getBlogPermalink() },
  ],
  actions: [
    {
      text: 'Free Consultation',
      href: getPermalink('/contact'),
    },
  ],
};

export const footerData = {
  links: [
    {
      title: 'Site',
      links: [
        { text: 'Services', href: getPermalink('/services') },
        { text: 'About', href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact') },
        { text: 'Blog', href: getBlogPermalink() },
      ],
    },
    {
      title: 'Tools',
      links: [
        { text: 'Authentication checker', href: getPermalink('/tools') },
        { text: 'Cost calculator', href: getPermalink('/roi-calculator') },
        { text: 'Mautic vs ESP comparison', href: getPermalink('/mautic-cost-comparison') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [],
  footNote: `
    MacDougall Systems — Email Infrastructure & Deliverability · © ${new Date().getFullYear()} · All rights reserved.
  `,
};
