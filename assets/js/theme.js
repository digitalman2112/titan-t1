(function () {
  // Theme toggle
  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    function getTheme() {
      return document.documentElement.getAttribute('data-theme') || 'light';
    }
    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
    themeBtn.addEventListener('click', function () {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // Hamburger nav toggle
  var navBtn = document.getElementById('nav-toggle');
  if (navBtn) {
    navBtn.addEventListener('click', function () {
      var isOpen = document.body.classList.toggle('nav-open');
      navBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.querySelectorAll('.site-nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        navBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();
