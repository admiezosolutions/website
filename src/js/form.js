/* Contact form validation and Google Forms submission */

const GOOGLE_FORM_ENDPOINT = 'https://docs.google.com/forms/d/e/1FAIpQLSekDtLIS4GZyXuyxxGFBnWCLnA06liW6k2f0RABDjF6I3Yjuw/formResponse';

const GOOGLE_FORM_FIELDS = {
  name: 'entry.271253109',
  email: 'entry.1854067002',
  phone: 'entry.813452232',
  institution: 'entry.1538424567',
  requirement: 'entry.1099192852',
  message: 'entry.1739064673',
};

const REQUIREMENT_LABELS = {
  'digital-evaluation': 'Digital Evaluation',
  'erp-full': 'College ERP',
  'evaluation-and-erp': 'Digital Evaluation & ERP',
  'custom-consultation': 'Consultation & Needs Assessment',
};

export function buildGoogleFormPayload(values) {
  return new URLSearchParams({
    [GOOGLE_FORM_FIELDS.name]: values.name || '',
    [GOOGLE_FORM_FIELDS.email]: values.email || '',
    [GOOGLE_FORM_FIELDS.phone]: values.phone || '',
    [GOOGLE_FORM_FIELDS.institution]: values.institution || '',
    [GOOGLE_FORM_FIELDS.requirement]: REQUIREMENT_LABELS[values.requirement] || values.requirement || '',
    [GOOGLE_FORM_FIELDS.message]: values.message || '',
  });
}

function getStatusElement(form) {
  let status = form.querySelector('.form-status');
  if (status) return status;

  status = document.createElement('p');
  status.className = 'form-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  form.appendChild(status);
  return status;
}

function validateForm(form) {
  let isValid = true;

  form.querySelectorAll('[required]').forEach((field) => {
    field.parentElement.querySelector('.form-error')?.remove();
    field.style.borderColor = '';

    if (!field.value.trim()) {
      isValid = false;
      field.style.borderColor = 'var(--color-error)';
      const error = document.createElement('span');
      error.className = 'form-error';
      error.textContent = 'This field is required';
      field.parentElement.appendChild(error);
    }
  });

  const emailField = form.querySelector('[type="email"]');
  if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
    isValid = false;
    emailField.style.borderColor = 'var(--color-error)';
    emailField.parentElement.querySelector('.form-error')?.remove();

    const error = document.createElement('span');
    error.className = 'form-error';
    error.textContent = 'Please enter a valid email address';
    emailField.parentElement.appendChild(error);
  }

  return isValid;
}

export function initForm() {
  const form = document.getElementById('contact-form');
  if (!form || form.dataset.initialized === 'true') return;

  form.dataset.initialized = 'true';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const status = getStatusElement(form);
    status.className = 'form-status';
    status.textContent = '';

    if (!validateForm(form)) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    const originalHtml = submitBtn.innerHTML;
    const values = Object.fromEntries(new FormData(form).entries());
    const payload = buildGoogleFormPayload(values);

    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
      await fetch(GOOGLE_FORM_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        credentials: 'omit',
        body: payload,
      });

      form.reset();
      status.classList.add('form-status--success');
      status.textContent = 'Request sent. Our team will contact you shortly.';
      submitBtn.textContent = 'Request Sent';
    } catch {
      status.classList.add('form-status--error');
      status.textContent = 'Unable to send your request. Please try again.';
      submitBtn.innerHTML = originalHtml;
      submitBtn.disabled = false;
      return;
    }

    window.setTimeout(() => {
      submitBtn.innerHTML = originalHtml;
      submitBtn.disabled = false;
    }, 3000);
  });

  form.querySelectorAll('input, textarea, select').forEach((field) => {
    const clearError = () => {
      field.style.borderColor = '';
      field.parentElement.querySelector('.form-error')?.remove();

      const status = form.querySelector('.form-status');
      if (status) {
        status.className = 'form-status';
        status.textContent = '';
      }
    };

    field.addEventListener('input', clearError);
    field.addEventListener('change', clearError);
  });
}
