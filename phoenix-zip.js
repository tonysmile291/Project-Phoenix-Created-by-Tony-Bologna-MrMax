/* Project Phoenix shared ZIP locator — all nine assistance categories.
   Preserves the ZIP-to-city/state lookup and shared browser storage.
   Adds broad and free-focused searches without editing any service page.
*/
(function () {
  'use strict';

  const KEY = 'phoenixZip';
  const CITY = 'phoenixZipCity';
  const STATE = 'phoenixZipState';

  const categories = {
    'recovery-resources.html': {
      label: 'Addiction Recovery',
      all: 'addiction treatment recovery support',
      free: 'free addiction recovery meetings no cost treatment support'
    },
    'health-services.html': {
      label: 'Healthcare',
      all: 'affordable healthcare community health centers',
      free: 'free clinics charity care no cost healthcare'
    },
    'ai-services.html': {
      label: 'AI Training',
      all: 'AI training digital literacy classes',
      free: 'free beginner AI lessons tutorials no cost artificial intelligence courses'
    },
    'education.html': {
      label: 'Education',
      all: 'adult education GED classes',
      free: 'free adult education GED classes'
    },
    'job-skills.html': {
      label: 'Job Training',
      all: 'job training workforce development',
      free: 'free job training workforce development programs'
    },
    'housing-help.html': {
      label: 'Housing',
      all: 'housing assistance emergency shelter',
      free: 'free housing assistance emergency shelter rent help'
    },
    'financial-literacy.html': {
      label: 'Financial Counseling',
      all: 'financial counseling budgeting classes',
      free: 'free financial counseling budgeting classes'
    },
    'veteran-support.html': {
      label: 'Veteran Support',
      all: 'veteran benefits local support services',
      free: 'free veteran support services benefits assistance'
    },
    'community-programs.html': {
      label: 'Food & Community',
      all: 'community food assistance support programs',
      free: 'free food pantries food banks community meals'
    }
  };

  const page = location.pathname.split('/').pop().toLowerCase();
  const category = categories[page] || {
    label: 'Community',
    all: 'local community assistance',
    free: 'free local community assistance'
  };
  const google = 'https://www.google.com/search?q=';

  function init() {
    document.querySelectorAll('.phoenix-zip-widget').forEach(function (widget) {
      const form = widget.querySelector('form');
      const input = widget.querySelector('input');
      const status = widget.querySelector('.phoenix-zip-status');
      const broadLink = widget.querySelector('.phoenix-local-search');
      if (!form || !input || !status || !broadLink) return;

      const freeLink = document.createElement('a');
      freeLink.className = 'phoenix-free-search';
      freeLink.target = '_blank';
      freeLink.rel = 'noopener noreferrer';
      freeLink.hidden = true;
      broadLink.insertAdjacentElement('afterend', freeLink);

      const note = document.createElement('p');
      note.className = 'phoenix-search-note';
      note.textContent = 'Project Phoenix searches are free. Outside providers may charge; free-focused results are not verified as free.';
      note.hidden = true;
      freeLink.insertAdjacentElement('afterend', note);

      let lookupNumber = 0;
      let confirmedZip = '';

      function hideSearches() {
        broadLink.hidden = true;
        freeLink.hidden = true;
        note.hidden = true;
      }

      function show(zip, city, state) {
        const cityState = city + ', ' + state;
        const area = city + ' ' + state + ' ' + zip;

        confirmedZip = zip;
        input.value = zip;
        status.textContent = '✓ Search area: ' + cityState + ' ' + zip;

        broadLink.href = google + encodeURIComponent(category.all + ' near ' + area);
        broadLink.textContent = '🔎 Search ' + category.label + ' Help Near ' + cityState;
        broadLink.hidden = false;

        freeLink.href = google + encodeURIComponent(category.free + ' near ' + area);
        freeLink.textContent = '❤️ Search Free ' + category.label + ' Help Near ' + cityState;
        freeLink.hidden = false;
        note.hidden = false;
      }

      async function lookup(zip) {
        const thisLookup = ++lookupNumber;
        confirmedZip = '';
        hideSearches();
        status.textContent = 'Checking ZIP code…';

        try {
          const response = await fetch('https://api.zippopotam.us/us/' + encodeURIComponent(zip));
          if (!response.ok) throw Error('ZIP not found');

          const data = await response.json();
          if (thisLookup !== lookupNumber) return;

          const place = data.places && data.places[0];
          if (!place) throw Error('ZIP not found');

          const city = place['place name'];
          const state = place['state abbreviation'];
          if (!city || !state) throw Error('Missing city or state');

          try {
            localStorage.setItem(KEY, zip);
            localStorage.setItem(CITY, city);
            localStorage.setItem(STATE, state);
          } catch (e) {
            // Search works even if local storage is unavailable.
          }

          show(zip, city, state);
        } catch (e) {
          if (thisLookup !== lookupNumber) return;
          status.textContent = 'Could not verify ZIP. Check the ZIP and internet connection.';
        }
      }

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        const zip = input.value.trim();

        if (!/^\d{5}$/.test(zip)) {
          ++lookupNumber;
          confirmedZip = '';
          hideSearches();
          status.textContent = 'Enter a valid five-digit ZIP.';
          return;
        }
        lookup(zip);
      });

      input.addEventListener('input', function () {
        if (input.value.trim() !== confirmedZip) {
          ++lookupNumber;
          hideSearches();
          status.textContent = 'Set location to update local searches.';
        }
      });

      function restore() {
        try {
          const zip = localStorage.getItem(KEY);
          const city = localStorage.getItem(CITY);
          const state = localStorage.getItem(STATE);
          if (zip && /^\d{5}$/.test(zip)) {
            ++lookupNumber;
            if (city && state) show(zip, city, state);
            else lookup(zip);
          }
        } catch (e) {
          // Manual ZIP search still works.
        }
      }

      restore();
      window.addEventListener('storage', function (event) {
        if ([KEY, CITY, STATE].includes(event.key)) restore();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
