/** Bind a demo's static HTML to explicit English and Vietnamese dictionaries.
 * Mark text with data-i18n, and optional attributes with data-i18n-attr="attribute:key".
 * The document contains readable default-language text before JavaScript runs.
 */
export function setupLanguage(dictionaries, initial = 'en') {
  const available = ['en', 'vi'];
  if (!available.every(code => dictionaries[code])) throw new Error('Both en and vi dictionaries are required');
  function setLanguage(language) {
    if (!available.includes(language)) return;
    const dictionary = dictionaries[language];
    document.documentElement.lang = language;
    const title = document.querySelector('title[data-en][data-vi]');
    if (title) document.title = language === 'vi' ? title.dataset.vi : title.dataset.en;
    const meta = document.querySelector('meta[name="description"][data-en][data-vi]');
    if (meta) meta.content = language === 'vi' ? meta.dataset.vi : meta.dataset.en;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      if (typeof dictionary[key] !== 'string') throw new Error(`Missing ${language} translation: ${key}`);
      element.textContent = dictionary[key];
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(element => {
      const [attribute, key] = element.dataset.i18nAttr.split(':');
      if (typeof dictionary[key] !== 'string') throw new Error(`Missing ${language} translation: ${key}`);
      element.setAttribute(attribute, dictionary[key]);
    });
    document.querySelectorAll('[data-text-en][data-text-vi]').forEach(element => { element.textContent = language === 'vi' ? element.dataset.textVi : element.dataset.textEn; });
    document.querySelectorAll('[data-alt-en][data-alt-vi]').forEach(element => { element.alt = language === 'vi' ? element.dataset.altVi : element.dataset.altEn; });
    document.querySelectorAll('[data-aria-en][data-aria-vi]').forEach(element => { element.setAttribute('aria-label', language === 'vi' ? element.dataset.ariaVi : element.dataset.ariaEn); });
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
  }
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });
  document.querySelectorAll('[data-demo-form]').forEach(container => {
    const button = container.querySelector('button[data-demo-action]');
    const fields = [...container.querySelectorAll('input, textarea')];
    if (!button || !fields.length) return;
    button.disabled = false;
    button.addEventListener('click', () => {
      const invalid = fields.find(field => !field.checkValidity());
      if (invalid) { invalid.reportValidity(); return; }
      container.querySelector('[role=status]').hidden = false;
    });
  });
  setLanguage(initial);
  return setLanguage;
}
