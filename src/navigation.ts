import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'Services', href: getPermalink('/services') },
    { text: 'About', href: getPermalink('/about') },
    { text: 'Contact', href: getPermalink('/contact') },
    { text: 'Tools', href: getPermalink('/tools') },
    { text: 'Blog', href: getBlogPermalink() },
  ],
  actions: [
    {
      text: 'Hire me on Upwork',
      href: 'https://www.upwork.com/freelancers/YOUR_PROFILE_ID',
      target: '_blank',
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
        { text: 'Tools', href: getPermalink('/tools') },
        { text: 'Blog', href: getBlogPermalink() },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
  ],
  footNote: `
    MacDougall Systems — Email Infrastructure & Deliverability · © ${new Date().getFullYear()} · All rights reserved.
  `,
};
