/* Shared site footer */

const footerMarkup = `
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        <div class="footer__logo"><span class="footer__logo-icon">A</span>Admiezo</div>
        <p class="footer__tagline">Revolutionizing Academic Management and Evaluation with Technology.</p>
        <div class="footer__social">
          <a href="#" class="footer__social-link" aria-label="LinkedIn">in</a>
          <a href="#" class="footer__social-link" aria-label="X">&#x1D54F;</a>
          <a href="#" class="footer__social-link" aria-label="Facebook">f</a>
          <a href="#" class="footer__social-link" aria-label="YouTube">&#9654;</a>
        </div>
      </div>
      <div>
        <h4 class="footer__col-title">Products</h4>
        <a href="products.html" class="footer__link">Digital Evaluation</a>
        <a href="products.html" class="footer__link">College ERP</a>
        <a href="products.html" class="footer__link">Analytics</a>
      </div>
      <div>
        <h4 class="footer__col-title">Company</h4>
        <a href="about.html" class="footer__link">About Us</a>
        <a href="solutions.html" class="footer__link">Solutions</a>
        <a href="contact.html" class="footer__link">Contact Us</a>
        <a href="#" class="footer__link">Careers</a>
      </div>
      <div>
        <h4 class="footer__col-title">Support</h4>
        <a href="#" class="footer__link">Help Center</a>
        <a href="#" class="footer__link">Documentation</a>
        <a href="#" class="footer__link">Privacy Policy</a>
        <a href="#" class="footer__link">Terms &amp; Conditions</a>
      </div>
    </div>
    <div class="footer__bottom">
      <p class="footer__copyright">&copy; ${new Date().getFullYear()} Admiezo Private Limited. All rights reserved.</p>
      <div class="footer__legal">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
      </div>
    </div>
  </div>
`;

export function initFooter() {
  const footer = document.querySelector('[data-site-footer]');
  if (!footer || footer.dataset.rendered) return;

  footer.innerHTML = footerMarkup;
  footer.dataset.rendered = 'true';
}
