/* Tabs — Smooth tab switching with fade transitions */
import { refreshAccordions } from './accordion.js';

export function initTabs() {
  document.querySelectorAll('.tabs').forEach((tabsContainer) => {
    const buttons = tabsContainer.querySelectorAll('.tabs__btn');
    const panels = tabsContainer.querySelectorAll('.tabs__panel');

    buttons.forEach((btn) => {
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-selected', String(btn.classList.contains('active')));

      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;

        // Update buttons
        buttons.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        // Update panels
        panels.forEach((panel) => {
          panel.classList.remove('active');
          if (panel.dataset.tab === target) {
            panel.classList.add('active');
            requestAnimationFrame(() => refreshAccordions(panel));
          }
        });
      });
    });
  });
}
