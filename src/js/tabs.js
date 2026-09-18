/* Tabs — Smooth tab switching with fade transitions */

export function initTabs() {
  document.querySelectorAll('.tabs').forEach((tabsContainer) => {
    const buttons = tabsContainer.querySelectorAll('.tabs__btn');
    const panels = tabsContainer.querySelectorAll('.tabs__panel');

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;

        // Update buttons
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Update panels
        panels.forEach((panel) => {
          panel.classList.remove('active');
          if (panel.dataset.tab === target) {
            panel.classList.add('active');
          }
        });
      });
    });
  });
}
