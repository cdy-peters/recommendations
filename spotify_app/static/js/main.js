function _calculateScrollbarWidth() {
    document.documentElement.style.setProperty('--scrollbar-width', (window.innerWidth - document.documentElement.clientWidth) + "px");
  }
  // recalculate on resize
  window.addEventListener('resize', _calculateScrollbarWidth, false);
  // recalculate on dom load
  document.addEventListener('DOMContentLoaded', _calculateScrollbarWidth, false); 
  // recalculate on load (assets loaded as well)
  window.addEventListener('load', _calculateScrollbarWidth);

// Scroll Top button
$(document).ready(function() {
    $(window).scroll(function() {
      if ($(this).scrollTop() > 100) {
        $('#scrollTopBtn').fadeIn();
      } else {
        $('#scrollTopBtn').fadeOut();
      }
    });
    $('#scrollTopBtn').click(function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    });
  });