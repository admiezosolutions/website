/* Accordion — Smooth expand/collapse */

function setItemState(item, isActive) {
  const header = item.querySelector('.accordion__header');
  const body = item.querySelector('.accordion__body');
  const content = item.querySelector('.accordion__content');

  item.classList.toggle('active', isActive);
  if (header) header.setAttribute('aria-expanded', String(isActive));
  if (body) body.style.maxHeight = isActive && content ? `${content.scrollHeight}px` : '0';
}

export function refreshAccordions(root = document) {
  root.querySelectorAll('.accordion__item.active').forEach((item) => {
    setItemState(item, true);
  });
}

export function initAccordion() {
  document.querySelectorAll('.accordion__header').forEach((header, index) => {
    const item = header.parentElement;
    const body = item?.querySelector('.accordion__body');

    if (body && !body.id) {
      body.id = `accordion-panel-${index}`;
    }

    header.setAttribute('aria-expanded', 'false');
    if (body?.id) header.setAttribute('aria-controls', body.id);

    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close siblings
      const accordion = item.closest('.accordion');
      if (accordion) {
        accordion.querySelectorAll('.accordion__item.active').forEach((activeItem) => {
          if (activeItem !== item) {
            setItemState(activeItem, false);
          }
        });
      }

      setItemState(item, !isActive);
    });
  });

  // Open first item by default
  document.querySelectorAll('.accordion').forEach((accordion) => {
    const firstItem = accordion.querySelector('.accordion__item');
    if (firstItem) {
      setItemState(firstItem, true);
    }
  });
}
