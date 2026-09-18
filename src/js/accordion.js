/* Accordion — Smooth expand/collapse */

export function initAccordion() {
  document.querySelectorAll('.accordion__header').forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const body = item.querySelector('.accordion__body');
      const content = item.querySelector('.accordion__content');
      const isActive = item.classList.contains('active');

      // Close siblings
      const accordion = item.closest('.accordion');
      if (accordion) {
        accordion.querySelectorAll('.accordion__item.active').forEach((activeItem) => {
          if (activeItem !== item) {
            activeItem.classList.remove('active');
            activeItem.querySelector('.accordion__body').style.maxHeight = '0';
          }
        });
      }

      // Toggle
      if (isActive) {
        item.classList.remove('active');
        body.style.maxHeight = '0';
      } else {
        item.classList.add('active');
        body.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });

  // Open first item by default
  document.querySelectorAll('.accordion').forEach((accordion) => {
    const firstItem = accordion.querySelector('.accordion__item');
    if (firstItem) {
      firstItem.classList.add('active');
      const body = firstItem.querySelector('.accordion__body');
      const content = firstItem.querySelector('.accordion__content');
      if (body && content) {
        body.style.maxHeight = content.scrollHeight + 'px';
      }
    }
  });
}
