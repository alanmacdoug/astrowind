import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'Services', href: getPermalink('/services') },
    { text: 'Blog', href: getBlogPermalink() },
    { text: 'About', href: getPermalink('/about') },
  ],
  actions: [
    {
      text: 'Hire me',
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
        { text: 'Blog', href: getBlogPermalink() },
        { text: 'About', href: getPermalink('/about') },
      ],
    },
    {
      title: 'Company',
      links: [
        { text: 'About', href: getPermalink('/about') },
        { text: 'Email: alan@macdougallsystems.com', href: 'mailto:alan@macdougallsystems.com' },
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
