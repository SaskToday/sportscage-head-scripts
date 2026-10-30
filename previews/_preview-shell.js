/**
 * Shared chrome for individual newsletter preview pages.
 * Expects window.PREVIEW_NEWSLETTER_KEY and a #newsletter_signup_inject_container.
 */
(function () {
  var key = window.PREVIEW_NEWSLETTER_KEY;
  var meta = {
    'regina-today': {
      label: 'ReginaToday',
      paths: '/regina-today/* · /southwest/regina-news/*'
    },
    'saskatoon-today': {
      label: 'SaskatoonToday',
      paths: '/saskatoon-today/* · /north/saskatoon/*'
    },
    'estevan-today': {
      label: 'EstevanToday',
      paths: '/estevan-today/* · /southeast/estevan-mercury/* · /southeast/estevanmercury/*'
    },
    sasktoday: {
      label: 'SaskToday (default)',
      paths: 'All unmatched paths'
    },
    'saskag-today': {
      label: 'SaskAgToday',
      paths: '/agriculture/*'
    },
    sportscage: {
      label: 'SportsCage',
      paths: '/sports/*'
    },
    'crime-cops-court': {
      label: 'Crime, Cops & Court',
      paths: '/crime-cops-court/*'
    }
  };

  var info = meta[key] || { label: key, paths: '' };
  document.title = info.label + ' — newsletter preview';

  var bar = document.createElement('div');
  bar.className = 'preview-bar';
  bar.innerHTML =
    '<a href="index.html">← All previews</a>' +
    '<div>' +
    '<strong>' +
    info.label +
    '</strong>' +
    '<span>' +
    info.paths +
    '</span>' +
    '</div>' +
    '<span class="preview-bar__hint">Submit uses the live Mailchimp form (new tab)</span>';
  document.body.insertBefore(bar, document.body.firstChild);
})();
