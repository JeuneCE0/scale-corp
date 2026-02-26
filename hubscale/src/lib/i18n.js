// HubScale — Internationalization (i18n)

const FR = {
  'nav.overview': 'Overview', 'nav.crm': 'CRM', 'nav.data': 'Data', 'nav.agenda': 'Agenda', 'nav.analytics': 'Analytics', 'nav.settings': 'Paramètres',
  'dash.welcome': 'Bienvenue sur votre Dashboard',
  'dash.subtitle': "Vue d'ensemble de votre activité et performances",
  'crm.title': 'CRM', 'crm.subtitle': 'Gestion des contacts et pipeline commercial',
  'crm.addContact': '+ Contact', 'crm.newContact': 'Nouveau contact', 'crm.editContact': 'Modifier le contact',
  'crm.staleAlert': 'Relance {days}j',
  'data.title': 'Data', 'data.subtitle': 'Vos données financières, commerciales et publicitaires',
  'common.save': 'Enregistrer', 'common.cancel': 'Annuler', 'common.delete': 'Supprimer',
  'common.search': 'Rechercher...', 'common.noData': 'Aucune donnée',
  'tour.step1': 'Votre Dashboard affiche un résumé de toute votre activité.',
  'tour.step2': 'Le CRM vous permet de gérer vos contacts et votre pipeline.',
  'tour.step3': 'Data centralise vos données financières avec graphiques et exports.',
  'tour.step4': "L'Agenda organise vos événements et réunions.",
  'tour.step5': 'Les Paramètres personnalisent votre espace.',
  'tour.next': 'Suivant', 'tour.prev': 'Précédent', 'tour.finish': 'Terminer', 'tour.skip': 'Passer',
  'lang.label': 'Langue',
  'greeting.morning': 'Bonjour', 'greeting.afternoon': 'Bon après-midi', 'greeting.evening': 'Bonsoir',
};

const EN = {
  'nav.overview': 'Overview', 'nav.crm': 'CRM', 'nav.data': 'Data', 'nav.agenda': 'Agenda', 'nav.analytics': 'Analytics', 'nav.settings': 'Settings',
  'dash.welcome': 'Welcome to your Dashboard',
  'dash.subtitle': 'Overview of your activity and performance',
  'crm.title': 'CRM', 'crm.subtitle': 'Contact management and sales pipeline',
  'crm.addContact': '+ Contact', 'crm.newContact': 'New contact', 'crm.editContact': 'Edit contact',
  'crm.staleAlert': 'Follow-up {days}d',
  'data.title': 'Data', 'data.subtitle': 'Your financial, commercial and advertising data',
  'common.save': 'Save', 'common.cancel': 'Cancel', 'common.delete': 'Delete',
  'common.search': 'Search...', 'common.noData': 'No data',
  'tour.step1': 'Your Dashboard shows a summary of all your activity.',
  'tour.step2': 'The CRM lets you manage contacts and your sales pipeline.',
  'tour.step3': 'Data centralizes your financial data with charts and exports.',
  'tour.step4': 'The Agenda organizes your events and meetings.',
  'tour.step5': 'Settings let you customize your workspace.',
  'tour.next': 'Next', 'tour.prev': 'Previous', 'tour.finish': 'Finish', 'tour.skip': 'Skip',
  'lang.label': 'Language',
  'greeting.morning': 'Good morning', 'greeting.afternoon': 'Good afternoon', 'greeting.evening': 'Good evening',
};

const LANGS = { fr: FR, en: EN };
let currentLang = 'fr';
try { const s = localStorage.getItem('hs_lang'); if (s && LANGS[s]) currentLang = s; } catch {}

const listeners = new Set();

export function t(key, params) {
  let str = (LANGS[currentLang] || FR)[key] || FR[key] || key;
  if (params) Object.entries(params).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
  return str;
}

export function setLang(lang) {
  if (!LANGS[lang]) return;
  currentLang = lang;
  try { localStorage.setItem('hs_lang', lang); } catch {}
  listeners.forEach((fn) => fn(lang));
}

export function getLang() { return currentLang; }

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const AVAILABLE_LANGS = [{ id: 'fr', label: 'Français' }, { id: 'en', label: 'English' }];
