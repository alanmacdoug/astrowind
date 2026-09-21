// aw-header.js — custom element behaviour for the site header.
// Lives in public/ and is referenced as an external module script so it is
// always served as a same-origin file, satisfying script-src 'self'.
class AwHeader extends HTMLElement {
  onScroll = null;
  mql = null;
  onMqlChange = null;
  onPageLoad = () => {
    this.updateActiveLinks();
    this.closeOpenDropdown();
  };

  connectedCallback() {
    const header = this.querySelector('#header');
    const toggle = this.querySelector('[data-aw-toggle-menu]');
    const nav = this.querySelector('#header nav');
    const lastChild = this.querySelector('#header > div > div:last-child');

    // The header persists across view transitions (transition:persist), so
    // the server-rendered `aw-link-active` class would go stale. Re-compute it
    // on every navigation (astro:page-load fires on load and after each swap).
    this.updateActiveLinks();
    document.addEventListener('astro:page-load', this.onPageLoad);

    const closeMenu = () => {
      toggle?.classList.remove('expanded');
      toggle?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('overflow-hidden');
      header?.classList.remove('h-screen', 'expanded', 'bg-page');
      nav?.classList.add('hidden');
      lastChild?.classList.add('hidden');
    };

    // Mobile menu toggle.
    toggle?.addEventListener('click', () => {
      const expanded = toggle.classList.toggle('expanded');
      toggle.setAttribute('aria-expanded', String(expanded));
      document.body.classList.toggle('overflow-hidden');
      header?.classList.toggle('h-screen');
      header?.classList.toggle('expanded');
      header?.classList.toggle('bg-page');
      nav?.classList.toggle('hidden');
      lastChild?.classList.toggle('hidden');
    });

    // Close the mobile menu when a nav link is clicked.
    nav?.addEventListener('click', closeMenu);

    // Desktop dropdowns open on hover/:focus-within. Blur a clicked dropdown
    // link so the menu closes after client-side navigation.
    nav?.addEventListener('click', (e) => {
      const link = e.target?.closest?.('.dropdown-menu a');
      if (link) link.blur();
    });

    // Close the menu when leaving the mobile/tablet breakpoint (nav starts at lg).
    this.mql = window.matchMedia('(max-width: 1023px)');
    this.onMqlChange = () => closeMenu();
    this.mql.addEventListener('change', this.onMqlChange);

    // Sticky header: toggle the `scroll` class past a small threshold.
    if (header?.hasAttribute('data-aw-sticky-header')) {
      let ticking = false;
      const applyStyles = () => {
        if (window.scrollY > 60) header.classList.add('scroll');
        else header.classList.remove('scroll');
        ticking = false;
      };
      this.onScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(applyStyles);
          ticking = true;
        }
      };
      applyStyles();
      document.addEventListener('scroll', this.onScroll, { passive: true });
    }

    document.documentElement.classList.add('motion-safe:scroll-behavior');
  }

  disconnectedCallback() {
    if (this.onScroll) document.removeEventListener('scroll', this.onScroll);
    if (this.mql && this.onMqlChange) this.mql.removeEventListener('change', this.onMqlChange);
    document.removeEventListener('astro:page-load', this.onPageLoad);
  }

  // With transition:persist the header's focus survives client-side
  // navigations, so a clicked dropdown link keeps :focus-within and its menu
  // would stay open on the next page. Drop the focus so the CSS closes it.
  closeOpenDropdown() {
    const active = document.activeElement;
    if (active && this.contains(active) && active.closest('.dropdown')) active.blur();
  }

  updateActiveLinks() {
    const norm = (p) => '/' + p.replace(/^\/+|\/+$/g, '');
    const current = norm(window.location.pathname);
    this.querySelectorAll('nav a[href]').forEach((a) => {
      const url = new URL(a.href, window.location.href);
      // Anchor-only links resolve to the current page and would light up
      // everywhere; only path links can be "the current page".
      const isPathLink =
        url.origin === window.location.origin && !url.hash && !a.getAttribute('href')?.startsWith('#');
      a.classList.toggle('aw-link-active', isPathLink && norm(url.pathname) === current);
    });
  }
}

if (!customElements.get('aw-header')) {
  customElements.define('aw-header', AwHeader);
}
