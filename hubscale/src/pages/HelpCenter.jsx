import React, { useState, useEffect, useMemo } from 'react';
import { T } from '../lib/theme.js';
import { uid, ago, formatDateFR } from '../lib/utils.js';
import { storeDebounced, load } from '../lib/store.js';
import { broadcast, subscribe } from '../lib/sync.js';
import { Card, Btn, Inp, Badge, Modal, EmptyState, Sel, TabBar } from '../components/ui.jsx';
import { useConfirmDialog } from '../hooks/useConfirmDialog.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = ['FAQ', 'Tickets', 'Base de connaissances'];

const TICKET_STATUSES = [
  { id: 'open', label: 'Ouvert', color: T.blue, bg: T.blueBg },
  { id: 'in_progress', label: 'En cours', color: T.orange, bg: T.orangeBg },
  { id: 'waiting', label: 'En attente', color: T.purple, bg: T.purpleBg },
  { id: 'resolved', label: 'Résolu', color: T.green, bg: T.greenBg },
  { id: 'closed', label: 'Fermé', color: T.textMuted, bg: T.surface2 },
];

const TICKET_PRIORITIES = [
  { id: 'critical', label: 'Critique', color: T.red },
  { id: 'high', label: 'Haute', color: T.orange },
  { id: 'medium', label: 'Moyenne', color: '#eab308' },
  { id: 'low', label: 'Basse', color: T.green },
];

const TICKET_CATEGORIES = [
  { value: 'billing', label: 'Facturation' },
  { value: 'technical', label: 'Technique' },
  { value: 'feature', label: 'Demande de fonctionnalité' },
  { value: 'account', label: 'Compte' },
  { value: 'integration', label: 'Intégration' },
  { value: 'other', label: 'Autre' },
];

const DEFAULT_FAQ = [
  { id: 'faq1', question: 'Comment connecter mon compte Stripe ?', answer: 'Allez dans Paramètres → Intégrations → Stripe, puis cliquez sur "Connecter". Vous serez redirigé vers Stripe pour autoriser la connexion.', category: 'integration', helpful: 12, notHelpful: 1 },
  { id: 'faq2', question: 'Comment créer et envoyer une facture ?', answer: 'Dans l\'onglet Documents, cliquez sur "+ Facture", remplissez les informations client et les lignes de facturation, puis utilisez le bouton "Imprimer / PDF" pour générer le document.', category: 'billing', helpful: 8, notHelpful: 0 },
  { id: 'faq3', question: 'Comment importer mes contacts ?', answer: 'Depuis le CRM, utilisez le bouton d\'import CSV. Le fichier doit contenir les colonnes : nom, email, téléphone, entreprise, statut. Vous pouvez aussi ajouter des contacts manuellement.', category: 'technical', helpful: 15, notHelpful: 2 },
  { id: 'faq4', question: 'Comment changer de plan d\'abonnement ?', answer: 'Rendez-vous dans Paramètres → Abonnement pour voir les plans disponibles. Cliquez sur "Changer de plan" pour passer à un plan supérieur. Les changements prennent effet immédiatement.', category: 'billing', helpful: 6, notHelpful: 1 },
  { id: 'faq5', question: 'Comment exporter mes données en FEC ?', answer: 'Allez dans l\'onglet Data → Export. Sélectionnez le format FEC et la période souhaitée. Le fichier sera généré et téléchargé automatiquement.', category: 'technical', helpful: 4, notHelpful: 0 },
  { id: 'faq6', question: 'Comment gérer les accès de mon équipe ?', answer: 'Dans Paramètres → Équipe, invitez des membres par email. Vous pouvez attribuer les rôles Propriétaire, Admin, Membre ou Lecteur. Chaque rôle a des permissions différentes.', category: 'account', helpful: 10, notHelpful: 1 },
  { id: 'faq7', question: 'Comment fonctionne le lead scoring ?', answer: 'Le score est calculé automatiquement sur 100 points selon : l\'ancienneté du contact, la fréquence des interactions, le chiffre d\'affaires, et l\'email professionnel. Les leads sont classés en Hot (80+), Warm (60+), Tiède (40+), Froid (<40).', category: 'technical', helpful: 7, notHelpful: 0 },
  { id: 'faq8', question: 'Puis-je synchroniser Google Calendar ?', answer: 'Oui ! Allez dans Paramètres → Intégrations → Google Calendar. Après connexion, vos événements seront synchronisés automatiquement dans l\'onglet Agenda.', category: 'integration', helpful: 9, notHelpful: 0 },
];

const KB_CATEGORIES = [
  { id: 'getting-started', label: 'Premiers pas', icon: '🚀', color: T.green },
  { id: 'crm', label: 'CRM & Contacts', icon: '👥', color: T.blue },
  { id: 'finance', label: 'Finance & Facturation', icon: '💰', color: T.orange },
  { id: 'integrations', label: 'Intégrations', icon: '🔗', color: T.purple },
  { id: 'automation', label: 'Automatisations', icon: '⚡', color: '#eab308' },
  { id: 'security', label: 'Sécurité & RGPD', icon: '🔒', color: T.red },
];

const DEFAULT_KB = [
  { id: 'kb1', title: 'Guide de démarrage rapide', category: 'getting-started', content: 'Bienvenue sur HubScale ! Ce guide vous accompagne dans la configuration initiale de votre espace.\n\n**1. Complétez votre profil entreprise**\nAllez dans Paramètres et renseignez votre SIRET, adresse et coordonnées bancaires.\n\n**2. Importez vos contacts**\nUtilisez l\'import CSV dans le CRM ou ajoutez-les manuellement.\n\n**3. Connectez vos outils**\nLiez Stripe, Google Calendar et vos autres outils depuis les Intégrations.\n\n**4. Saisissez vos données financières**\nDans l\'onglet Data, entrez votre CA et charges mensuels.', views: 245 },
  { id: 'kb2', title: 'Gérer votre pipeline de vente', category: 'crm', content: 'Le pipeline vous permet de suivre vos opportunités commerciales à travers 6 étapes :\n\n- **Prospect** (10% de probabilité)\n- **Lead qualifié** (30%)\n- **Négociation** (60%)\n- **Proposition** (80%)\n- **Gagné** (100%)\n- **Perdu** (0%)\n\nChaque contact avance automatiquement selon vos interactions. Le lead scoring calcule un score de 0 à 100 basé sur l\'activité.', views: 189 },
  { id: 'kb3', title: 'Comprendre le tableau de bord financier', category: 'finance', content: 'Le tableau de bord affiche vos KPI financiers clés :\n\n- **CA mensuel** : Chiffre d\'affaires du mois en cours\n- **Marge nette** : (CA - Charges) / CA × 100\n- **Trésorerie** : Solde actuel estimé\n- **Prévision 3 mois** : Projection basée sur la tendance\n\nLes alertes automatiques vous préviennent si :\n- La marge passe sous 20%\n- Le CA baisse de plus de 15%\n- La trésorerie couvre moins de 2 mois de charges', views: 156 },
  { id: 'kb4', title: 'Configurer les intégrations', category: 'integrations', content: 'HubScale supporte 40+ intégrations réparties en catégories :\n\n**Paiements** : Stripe (live), PayPal, Shopify\n**Banque** : Revolut, Qonto, Shine, N26\n**CRM** : HubSpot (live), Salesforce, Zoho\n**Agenda** : Google Calendar (live)\n**Marketing** : Mailchimp, ActiveCampaign, Brevo\n\nLes intégrations "live" synchronisent les données en temps réel. Les autres fonctionnent en mode démo avec des données simulées.', views: 134 },
  { id: 'kb5', title: 'Automatisations et alertes', category: 'automation', content: 'Les règles d\'automatisation surveillent votre activité et déclenchent des alertes :\n\n- **Relance prospect** : Notification après 7j d\'inactivité\n- **Relance lead** : Notification après 14j d\'inactivité\n- **Facture impayée** : Alerte à +3j et +7j après échéance\n- **Objectif CA** : Célébration quand l\'objectif est atteint\n- **Hausse des charges** : Alerte si +15% vs mois précédent\n- **Trésorerie basse** : Alerte critique si < 2 mois\n\nActivez/désactivez chaque règle dans Paramètres → Automatisations.', views: 98 },
  { id: 'kb6', title: 'Conformité RGPD et sécurité', category: 'security', content: 'HubScale respecte le RGPD :\n\n**Vos droits** :\n- Export complet de vos données à tout moment\n- Suppression de compte et données sur demande\n- Portabilité des données (format CSV/JSON)\n\n**Sécurité** :\n- Chiffrement en transit (HTTPS/TLS)\n- Authentification sécurisée via Supabase\n- Tokens OAuth chiffrés\n- Rate limiting sur les API\n- Validation des entrées contre les injections\n\nAccédez aux options RGPD dans Paramètres → Données personnelles.', views: 76 },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function HelpCenter() {
  const [tab, setTab] = useState('FAQ');
  const [tickets, setTickets] = useState(() => load('support_tickets') || []);
  const [faq] = useState(DEFAULT_FAQ);
  const [kb] = useState(DEFAULT_KB);
  const [editingTicket, setEditingTicket] = useState(null);
  const [searchFAQ, setSearchFAQ] = useState('');
  const [searchKB, setSearchKB] = useState('');
  const [selectedKB, setSelectedKB] = useState(null);
  const confirm = useConfirmDialog();

  useEffect(() => {
    storeDebounced('support_tickets', tickets);
    broadcast('support_tickets', tickets);
  }, [tickets]);

  useEffect(() => {
    const unsub = subscribe('support_tickets', setTickets);
    return unsub;
  }, []);

  const ticketStats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    avgResponseTime: '< 2h',
  }), [tickets]);

  const addTicket = () => {
    setEditingTicket({
      id: uid(), subject: '', description: '', category: 'technical', priority: 'medium',
      status: 'open', messages: [], createdAt: new Date().toISOString(),
    });
  };

  const saveTicket = (ticket) => {
    const exists = tickets.find(t => t.id === ticket.id);
    if (exists) setTickets(prev => prev.map(t => t.id === ticket.id ? ticket : t));
    else setTickets(prev => [ticket, ...prev]);
    setEditingTicket(null);
  };

  const deleteTicket = async (id) => {
    const ok = await confirm.open('Supprimer ce ticket ?', 'Cette action est irréversible.');
    if (ok) { setTickets(prev => prev.filter(t => t.id !== id)); setEditingTicket(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="glass-static fade-up" style={{ padding: '24px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>💡</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4 }}>Centre d'aide</div>
        <div style={{ fontSize: 13, color: T.textSecondary }}>Trouvez des réponses, créez des tickets, explorez la documentation</div>
      </div>

      {/* Tabs */}
      <Card>
        <TabBar items={TABS} active={tab} onChange={setTab} />
      </Card>

      {/* FAQ */}
      {tab === 'FAQ' && <FAQSection faq={faq} search={searchFAQ} onSearch={setSearchFAQ} />}

      {/* Tickets */}
      {tab === 'Tickets' && (
        <TicketsSection tickets={tickets} stats={ticketStats} onAdd={addTicket}
          onEdit={setEditingTicket} />
      )}

      {/* Knowledge Base */}
      {tab === 'Base de connaissances' && (
        <KBSection articles={kb} search={searchKB} onSearch={setSearchKB}
          selected={selectedKB} onSelect={setSelectedKB} />
      )}

      {/* Ticket Editor */}
      {editingTicket && (
        <TicketEditor ticket={editingTicket} onSave={saveTicket} onClose={() => setEditingTicket(null)}
          onDelete={() => deleteTicket(editingTicket.id)} />
      )}

      {confirm.dialog}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FAQ Section
// ---------------------------------------------------------------------------

function FAQSection({ faq, search, onSearch }) {
  const [expanded, setExpanded] = useState(null);
  const [filterCat, setFilterCat] = useState('');

  const filtered = useMemo(() => {
    let list = faq;
    if (filterCat) list = list.filter(f => f.category === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
    }
    return list;
  }, [faq, filterCat, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Inp small placeholder="Rechercher dans la FAQ..." value={search} onChange={onSearch} />
        </div>
        <Sel small value={filterCat} onChange={setFilterCat}
          options={[{ value: '', label: 'Toutes catégories' }, ...TICKET_CATEGORIES]} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="❓" title="Aucun résultat" sub="Essayez avec d'autres mots-clés" />
      ) : (
        filtered.map(item => (
          <div key={item.id} className="glass-static" style={{ overflow: 'hidden' }}>
            <div onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, transition: 'transform .2s', transform: expanded === item.id ? 'rotate(90deg)' : 'none' }}>▸</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text }}>{item.question}</span>
              <Badge label={TICKET_CATEGORIES.find(c => c.value === item.category)?.label || item.category} color={T.textMuted} bg={T.surface2} />
            </div>
            {expanded === item.id && (
              <div style={{ padding: '0 18px 16px 44px' }}>
                <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{item.answer}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}>Cette réponse vous a aidé ?</span>
                  <button style={{ background: T.greenBg, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: T.green, cursor: 'pointer', fontWeight: 600 }}>
                    👍 {item.helpful}
                  </button>
                  <button style={{ background: T.redBg, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: T.red, cursor: 'pointer', fontWeight: 600 }}>
                    👎 {item.notHelpful}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tickets Section
// ---------------------------------------------------------------------------

function TicketsSection({ tickets, stats, onAdd, onEdit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: stats.total, icon: '🎫', color: T.accent },
          { label: 'Ouverts', value: stats.open, icon: '📬', color: T.blue },
          { label: 'Résolus', value: stats.resolved, icon: '✅', color: T.green },
          { label: 'Temps moyen', value: stats.avgResponseTime, icon: '⏱', color: T.orange },
        ].map((s, i) => (
          <div key={i} className="glass-static fade-up" style={{ flex: '1 1 130px', padding: '12px 14px', minWidth: 110 }}>
            <div style={{ fontSize: 10, color: T.textSecondary, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase', marginBottom: 4 }}>
              <span style={{ marginRight: 4 }}>{s.icon}</span>{s.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn small onClick={onAdd}>+ Nouveau ticket</Btn>
      </div>

      {tickets.length === 0 ? (
        <EmptyState icon="🎫" title="Aucun ticket" sub="Créez un ticket pour obtenir de l'aide" actionLabel="+ Nouveau ticket" onAction={onAdd} />
      ) : (
        tickets.map(ticket => {
          const status = TICKET_STATUSES.find(s => s.id === ticket.status) || TICKET_STATUSES[0];
          const prio = TICKET_PRIORITIES.find(p => p.id === ticket.priority) || TICKET_PRIORITIES[2];
          return (
            <div key={ticket.id} className="glass-static pressable" onClick={() => onEdit({ ...ticket, messages: [...(ticket.messages || [])] })}
              style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ fontSize: 20 }}>🎫</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{ticket.subject || 'Sans objet'}</span>
                  <Badge label={status.label} color={status.color} bg={status.bg} />
                  <Badge label={prio.label} color={prio.color} bg={prio.color + '18'} />
                </div>
                <div style={{ fontSize: 12, color: T.textSecondary }}>
                  {TICKET_CATEGORIES.find(c => c.value === ticket.category)?.label || ticket.category}
                  {' — '}{ago(ticket.createdAt)}
                  {ticket.messages?.length > 0 && ` — ${ticket.messages.length} message${ticket.messages.length > 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Knowledge Base Section
// ---------------------------------------------------------------------------

function KBSection({ articles, search, onSearch, selected, onSelect }) {
  const filtered = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase();
    return articles.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
  }, [articles, search]);

  if (selected) {
    const article = articles.find(a => a.id === selected);
    if (!article) return null;
    const cat = KB_CATEGORIES.find(c => c.id === article.category);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Btn small v="ghost" onClick={() => onSelect(null)}>← Retour</Btn>
        <Card>
          <div style={{ padding: '8px 0' }}>
            {cat && <Badge label={cat.label} color={cat.color} bg={cat.color + '18'} />}
            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginTop: 10, marginBottom: 6 }}>{article.title}</h2>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 20 }}>{article.views} vues</div>
            <div style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {article.content.split(/(\*\*.*?\*\*)/).map((part, i) =>
                part.startsWith('**') && part.endsWith('**')
                  ? <strong key={i} style={{ color: T.text }}>{part.slice(2, -2)}</strong>
                  : <span key={i}>{part}</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Inp small placeholder="Rechercher dans la base de connaissances..." value={search} onChange={onSearch} />

      {/* Categories Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {KB_CATEGORIES.map(cat => {
          const catArticles = filtered.filter(a => a.category === cat.id);
          if (catArticles.length === 0 && search.trim()) return null;
          return (
            <div key={cat.id} className="glass-static" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{cat.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{cat.label}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>{catArticles.length} article{catArticles.length !== 1 ? 's' : ''}</div>
              {catArticles.map(a => (
                <div key={a.id} onClick={() => onSelect(a.id)} className="pressable"
                  style={{ fontSize: 12, color: T.accent, cursor: 'pointer', padding: '4px 0', borderBottom: `1px solid ${T.border}20` }}>
                  {a.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ticket Editor Modal
// ---------------------------------------------------------------------------

function TicketEditor({ ticket, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(ticket);
  const [newMessage, setNewMessage] = useState('');
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const addMessage = () => {
    if (!newMessage.trim()) return;
    const msg = { id: uid(), text: newMessage, author: 'Vous', createdAt: new Date().toISOString() };
    set('messages', [...(form.messages || []), msg]);
    setNewMessage('');
  };

  return (
    <Modal open onClose={onClose} title="Ticket de support" wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Inp label="Sujet" value={form.subject} onChange={(v) => set('subject', v)} placeholder="Décrivez brièvement votre problème..." />

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px' }}>
            <Sel label="Catégorie" value={form.category} onChange={(v) => set('category', v)} options={TICKET_CATEGORIES} />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <Sel label="Priorité" value={form.priority} onChange={(v) => set('priority', v)}
              options={TICKET_PRIORITIES.map(p => ({ value: p.id, label: p.label }))} />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <Sel label="Statut" value={form.status} onChange={(v) => set('status', v)}
              options={TICKET_STATUSES.map(s => ({ value: s.id, label: s.label }))} />
          </div>
        </div>

        <Inp label="Description" value={form.description} onChange={(v) => set('description', v)} textarea placeholder="Décrivez votre problème en détail..." />

        {/* Message thread */}
        {(form.messages || []).length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .5 }}>
              Conversation ({form.messages.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', padding: 4 }}>
              {form.messages.map(msg => (
                <div key={msg.id} style={{ padding: '10px 14px', background: msg.author === 'Vous' ? T.accentBg : T.surface2, borderRadius: 10,
                  borderBottomRightRadius: msg.author === 'Vous' ? 2 : 10, borderBottomLeftRadius: msg.author !== 'Vous' ? 2 : 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: msg.author === 'Vous' ? T.accent : T.text }}>{msg.author}</span>
                    <span style={{ fontSize: 10, color: T.textMuted }}>{ago(msg.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{msg.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New message */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><Inp small placeholder="Ajouter un message..." value={newMessage} onChange={setNewMessage}
            onKeyDown={(e) => { if (e.key === 'Enter') addMessage(); }} /></div>
          <Btn small onClick={addMessage} disabled={!newMessage.trim()}>Envoyer</Btn>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Btn small v="danger" onClick={onDelete}>Supprimer</Btn>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn small v="ghost" onClick={onClose}>Annuler</Btn>
            <Btn small onClick={() => onSave(form)}>Enregistrer</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}
