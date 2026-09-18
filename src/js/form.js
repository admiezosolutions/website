/* Form — Contact form validation and submission */

export function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Collect values
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Basic validation
    let isValid = true;
    const required = form.querySelectorAll('[required]');
    
    required.forEach((field) => {
      const errorEl = field.parentElement.querySelector('.form-error');
      if (errorEl) errorEl.remove();
      
      field.style.borderColor = '';
      
      if (!field.value.trim()) {
        isValid = false;
        field.style.borderColor = 'var(--color-error)';
        const error = document.createElement('span');
        error.className = 'form-error';
        error.style.cssText = 'color: var(--color-error); font-size: 0.75rem; margin-top: 4px;';
        error.textContent = 'This field is required';
        field.parentElement.appendChild(error);
      }
    });

    // Email validation
    const emailField = form.querySelector('[type="email"]');
    if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
      isValid = false;
      emailField.style.borderColor = 'var(--color-error)';
      const existingError = emailField.parentElement.querySelector('.form-error');
      if (existingError) existingError.remove();
      const error = document.createElement('span');
      error.className = 'form-error';
      error.style.cssText = 'color: var(--color-error); font-size: 0.75rem; margin-top: 4px;';
      error.textContent = 'Please enter a valid email address';
      emailField.parentElement.appendChild(error);
    }

    if (isValid) {
      // Show success state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Message Sent! ✓';
      submitBtn.style.background = 'var(--color-primary)';
      submitBtn.disabled = true;
      
      setTimeout(() => {
        form.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 3000);
    }
  });

  // Clear error on input
  form.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('input', () => {
      field.style.borderColor = '';
      const errorEl = field.parentElement.querySelector('.form-error');
      if (errorEl) errorEl.remove();
    });
  });
}
