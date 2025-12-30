(function(){
  function ensureFooter(){
    try {
      if (document.getElementById('novaFooter')) return;

      var footer = document.createElement('footer');
      footer.id = 'novaFooter';
      footer.className = 'nova-footer';

      var year = new Date().getFullYear();
      footer.innerHTML = `
        <div class="inner">
          <div class="center">© ${year} <strong>NOVA</strong> • <a href="mailto:novateam@nova.com">novateam@nova.com</a></div>
        </div>
      `;

      document.body.appendChild(footer);
      document.body.classList.add('nova-has-footer');
    } catch (e) {
      // silent
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureFooter);
  } else {
    ensureFooter();
  }
})();
