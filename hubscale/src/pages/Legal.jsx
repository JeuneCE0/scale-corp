// HubScale — Legal Pages (CGU + Politique de Confidentialite)
import React, { useState } from 'react';
import { T, FONT } from '../lib/theme.js';
import { Btn, TabBar } from '../components/ui.jsx';

const TABS = ["Conditions Generales d'Utilisation", "Politique de Confidentialite"];

const LAST_UPDATED = '15 janvier 2026';

/* ---------- Shared style helpers ---------- */

const sectionTitle = {
  fontSize: 18,
  fontWeight: 700,
  color: T.text,
  margin: '32px 0 12px',
  fontFamily: FONT,
};

const sectionSubtitle = {
  fontSize: 14,
  fontWeight: 600,
  color: T.text,
  margin: '20px 0 8px',
  fontFamily: FONT,
};

const paragraph = {
  fontSize: 13,
  lineHeight: 1.7,
  color: T.textSecondary,
  margin: '0 0 12px',
  fontFamily: FONT,
};

const list = {
  fontSize: 13,
  lineHeight: 1.8,
  color: T.textSecondary,
  margin: '0 0 12px',
  paddingLeft: 20,
  fontFamily: FONT,
};

const cardStyle = {
  background: `rgba(255,255,255,.03)`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  padding: '28px 32px',
  marginTop: 16,
};

const accentBar = {
  display: 'inline-block',
  width: 4,
  height: 18,
  borderRadius: 2,
  background: 'linear-gradient(180deg, #f97316, #f59e0b)',
  marginRight: 10,
  verticalAlign: 'middle',
};

function SH({ children }) {
  return (
    <h2 style={sectionTitle}>
      <span style={accentBar} />
      {children}
    </h2>
  );
}

function SSH({ children }) {
  return <h3 style={sectionSubtitle}>{children}</h3>;
}

function P({ children }) {
  return <p style={paragraph}>{children}</p>;
}

function UL({ children }) {
  return <ul style={list}>{children}</ul>;
}

/* ---------- CGU Content ---------- */

function CGU() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 6px', fontFamily: FONT }}>
          Conditions Generales d'Utilisation
        </h1>
        <p style={{ color: T.textMuted, fontSize: 12, margin: 0, fontFamily: FONT }}>
          Derniere mise a jour : {LAST_UPDATED}
        </p>
      </div>

      <SH>1. Objet</SH>
      <P>
        Les presentes Conditions Generales d'Utilisation (ci-apres "CGU") ont pour objet de definir
        les modalites et conditions dans lesquelles la societe HubScale SAS (ci-apres "HubScale")
        met a disposition sa plateforme SaaS de gestion commerciale et CRM (ci-apres "le Service")
        a destination des professionnels et entreprises (ci-apres "l'Utilisateur" ou "le Client").
      </P>
      <P>
        L'acces et l'utilisation du Service impliquent l'acceptation sans reserve des presentes CGU.
        HubScale se reserve le droit de modifier les presentes CGU a tout moment. Les modifications
        prennent effet des leur publication sur la plateforme. L'Utilisateur sera notifie par email
        de toute modification substantielle.
      </P>

      <SH>2. Acces au Service</SH>
      <P>
        Le Service est accessible via un navigateur web compatible (dernieres versions de Chrome,
        Firefox, Safari ou Edge). L'Utilisateur est responsable de son equipement informatique,
        de sa connexion internet et de la securite de ses identifiants de connexion.
      </P>
      <P>
        L'inscription au Service est reservee aux personnes morales et aux professionnels agissant
        dans le cadre de leur activite professionnelle. L'Utilisateur s'engage a fournir des
        informations exactes et a jour lors de son inscription.
      </P>
      <P>
        HubScale se reserve le droit de suspendre ou de fermer tout compte en cas de violation des
        presentes CGU, d'utilisation frauduleuse ou de non-paiement des sommes dues.
      </P>

      <SH>3. Abonnements et tarifs</SH>
      <P>
        Le Service est propose sous forme d'abonnements mensuels ou annuels. Les tarifs en vigueur
        sont les suivants (hors taxes) :
      </P>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '16px 0' }}>
        {[
          { name: 'Starter', price: '99', features: ['Jusqu\'a 3 utilisateurs', 'CRM de base', '1 000 contacts', 'Tableau de bord standard', 'Support par email'] },
          { name: 'Professional', price: '249', features: ['Jusqu\'a 10 utilisateurs', 'CRM avance + pipeline', '10 000 contacts', 'Analytics & rapports', 'API access', 'Support prioritaire'] },
          { name: 'Enterprise', price: '499', features: ['Utilisateurs illimites', 'CRM complet + automatisations', 'Contacts illimites', 'Analytics avances + IA', 'API + webhooks', 'SSO & audit logs', 'Account manager dedie'] },
        ].map((plan) => (
          <div key={plan.name} style={{
            flex: '1 1 200px',
            background: plan.name === 'Professional' ? 'rgba(249,115,22,.06)' : 'rgba(255,255,255,.02)',
            border: `1px solid ${plan.name === 'Professional' ? 'rgba(249,115,22,.25)' : T.border}`,
            borderRadius: 14,
            padding: '20px 18px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: plan.name === 'Professional' ? T.orange : T.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              {plan.name}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.text, marginBottom: 4, fontFamily: FONT }}>
              {plan.price}<span style={{ fontSize: 14, fontWeight: 500, color: T.textSecondary }}> €/mois</span>
            </div>
            <ul style={{ ...list, fontSize: 11, margin: '12px 0 0', paddingLeft: 16 }}>
              {plan.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <P>
        Les prix sont susceptibles d'evoluer. Toute modification tarifaire sera communiquee au Client
        au moins 30 jours avant son application. Les abonnements annuels beneficient d'une remise de
        20% par rapport au tarif mensuel.
      </P>
      <P>
        La facturation est effectuee a l'avance pour chaque periode d'abonnement. Tout mois entame
        est du dans son integralite. Les paiements sont effectues par carte bancaire via notre
        prestataire de paiement securise Stripe.
      </P>

      <SH>4. Essai gratuit</SH>
      <P>
        HubScale propose un essai gratuit de 14 jours sur l'ensemble des formules, incluant l'acces
        a toutes les fonctionnalites de la formule choisie. Aucun moyen de paiement n'est requis
        pour demarrer l'essai.
      </P>
      <P>
        A l'issue de la periode d'essai, l'Utilisateur devra souscrire un abonnement payant pour
        continuer a utiliser le Service. A defaut, l'acces au Service sera suspendu. Les donnees
        seront conservees pendant 30 jours apres l'expiration de l'essai, permettant a l'Utilisateur
        de reactiver son compte sans perte de donnees.
      </P>

      <SH>5. Donnees personnelles</SH>
      <P>
        Le traitement des donnees personnelles est regi par notre Politique de Confidentialite,
        accessible depuis l'onglet dedie dans la presente page. HubScale agit en tant que
        sous-traitant au sens du RGPD pour les donnees que le Client integre dans le Service
        (donnees clients, contacts CRM), et en tant que responsable de traitement pour les
        donnees relatives au compte de l'Utilisateur.
      </P>
      <P>
        Un accord de traitement des donnees (DPA) conforme a l'article 28 du RGPD est disponible
        sur demande pour les clients des formules Professional et Enterprise.
      </P>

      <SH>6. Propriete intellectuelle</SH>
      <P>
        L'ensemble des elements constituant le Service (logiciel, interface, textes, graphismes,
        logos, base de donnees, algorithmes) sont la propriete exclusive de HubScale SAS et sont
        proteges par les lois francaises et internationales relatives a la propriete intellectuelle.
      </P>
      <P>
        L'abonnement au Service confere a l'Utilisateur un droit d'utilisation personnel, non
        exclusif, non cessible et non transferable, limite a la duree de l'abonnement. Toute
        reproduction, representation, modification ou distribution du Service, en tout ou partie,
        est strictement interdite sans autorisation ecrite prealable de HubScale.
      </P>
      <P>
        Les donnees saisies par l'Utilisateur dans le Service restent sa propriete exclusive.
        HubScale ne revendique aucun droit de propriete sur ces donnees.
      </P>

      <SH>7. Responsabilites</SH>
      <SSH>7.1 Obligations de HubScale</SSH>
      <P>
        HubScale s'engage a fournir le Service avec diligence et conformement aux regles de l'art.
        HubScale garantit un taux de disponibilite du Service de 99,9% (hors maintenance programmee).
        Les interventions de maintenance seront, dans la mesure du possible, effectuees en dehors
        des heures ouvrables et signalees a l'avance.
      </P>

      <SSH>7.2 Limitations de responsabilite</SSH>
      <P>
        HubScale ne saurait etre tenue responsable des dommages indirects, tels que les pertes de
        chiffre d'affaires, de donnees, de benefices ou d'opportunites commerciales. En tout etat
        de cause, la responsabilite totale de HubScale est limitee au montant des sommes versees
        par le Client au cours des douze (12) derniers mois precedant l'evenement generateur de
        responsabilite.
      </P>

      <SSH>7.3 Obligations de l'Utilisateur</SSH>
      <P>
        L'Utilisateur s'engage a utiliser le Service conformement a sa destination et aux presentes
        CGU. Il est responsable de la confidentialite de ses identifiants et de l'ensemble des
        actions effectuees sous son compte. L'Utilisateur s'interdit notamment de :
      </P>
      <UL>
        <li>Tenter d'acceder aux systemes ou reseaux de HubScale de maniere non autorisee</li>
        <li>Utiliser le Service a des fins illicites ou contraires a l'ordre public</li>
        <li>Proceder a l'extraction systematique du contenu du Service (scraping)</li>
        <li>Introduire des virus ou tout element malveillant dans le Service</li>
        <li>Revendre ou sous-licencier l'acces au Service sans autorisation</li>
      </UL>

      <SH>8. Resiliation</SH>
      <P>
        L'Utilisateur peut resilier son abonnement a tout moment depuis les parametres de son compte.
        La resiliation prend effet a la fin de la periode de facturation en cours. Aucun
        remboursement prorata temporis n'est effectue pour les abonnements mensuels. Pour les
        abonnements annuels, un remboursement au prorata des mois restants pourra etre accorde
        sous conditions.
      </P>
      <P>
        HubScale se reserve le droit de resilier l'abonnement d'un Utilisateur en cas de manquement
        grave aux presentes CGU, apres mise en demeure restee sans effet pendant 15 jours.
      </P>
      <P>
        En cas de resiliation, l'Utilisateur dispose d'un delai de 30 jours pour exporter ses
        donnees via les outils d'export integres au Service. Passe ce delai, HubScale procedera
        a la suppression definitive des donnees.
      </P>

      <SH>9. Droit applicable</SH>
      <P>
        Les presentes CGU sont soumises au droit francais. Tout litige relatif a l'interpretation
        ou a l'execution des presentes CGU sera soumis a la competence exclusive des tribunaux de
        Paris, sauf disposition legale imperieuse contraire.
      </P>
      <P>
        Conformement aux articles L.611-1 et suivants du Code de la consommation, en cas de litige
        non resolu amiablement, le Client professionnel pourra recourir a un mediateur agree.
      </P>

      <SH>10. Contact</SH>
      <P>
        Pour toute question relative aux presentes CGU, vous pouvez nous contacter :
      </P>
      <UL>
        <li>Par email : legal@hubscale.fr</li>
        <li>Par courrier : HubScale SAS, 42 rue de la Innovation, 75009 Paris, France</li>
        <li>Via le formulaire de contact disponible sur la plateforme</li>
      </UL>
      <P>
        HubScale SAS - Capital social : 50 000 € - RCS Paris B 912 345 678 - N TVA : FR 82 912345678
      </P>
    </div>
  );
}

/* ---------- Privacy Policy Content ---------- */

function PrivacyPolicy() {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 6px', fontFamily: FONT }}>
          Politique de Confidentialite
        </h1>
        <p style={{ color: T.textMuted, fontSize: 12, margin: 0, fontFamily: FONT }}>
          Derniere mise a jour : {LAST_UPDATED}
        </p>
      </div>

      <P>
        La presente Politique de Confidentialite decrit comment HubScale SAS (ci-apres "HubScale",
        "nous", "notre") collecte, utilise, stocke et protege les donnees personnelles des
        utilisateurs de sa plateforme SaaS, conformement au Reglement General sur la Protection
        des Donnees (RGPD - Reglement UE 2016/679) et a la loi Informatique et Libertes du 6
        janvier 1978 modifiee.
      </P>

      <SH>1. Responsable du traitement</SH>
      <P>
        Le responsable du traitement des donnees personnelles est :
      </P>
      <UL>
        <li>HubScale SAS</li>
        <li>42 rue de la Innovation, 75009 Paris, France</li>
        <li>RCS Paris B 912 345 678</li>
        <li>Email : dpo@hubscale.fr</li>
        <li>Delegue a la Protection des Donnees (DPO) : M. Alexandre Durand</li>
      </UL>

      <SH>2. Donnees collectees</SH>
      <P>
        Dans le cadre de la fourniture du Service, HubScale collecte et traite les categories de
        donnees suivantes :
      </P>

      <SSH>2.1 Donnees d'identification</SSH>
      <UL>
        <li>Nom et prenom</li>
        <li>Adresse email professionnelle</li>
        <li>Numero de telephone professionnel (facultatif)</li>
        <li>Nom et raison sociale de l'entreprise</li>
        <li>Fonction au sein de l'entreprise</li>
      </UL>

      <SSH>2.2 Donnees financieres</SSH>
      <UL>
        <li>Informations de facturation (adresse, numero de TVA)</li>
        <li>Historique des transactions et paiements</li>
        <li>Donnees de carte bancaire (traitees exclusivement par Stripe, jamais stockees sur nos serveurs)</li>
      </UL>

      <SSH>2.3 Donnees CRM et metier</SSH>
      <UL>
        <li>Contacts et prospects integres par l'Utilisateur</li>
        <li>Donnees de pipeline commercial (opportunites, montants, etapes)</li>
        <li>Notes, commentaires et historique d'interactions</li>
        <li>Documents et fichiers uploades</li>
      </UL>

      <SSH>2.4 Donnees techniques et de navigation</SSH>
      <UL>
        <li>Adresse IP et donnees de geolocalisation approximative</li>
        <li>Type de navigateur et systeme d'exploitation</li>
        <li>Pages visitees et actions effectuees sur la plateforme</li>
        <li>Horodatages de connexion et duree des sessions</li>
      </UL>

      <SH>3. Finalites du traitement</SH>
      <P>
        Les donnees personnelles collectees sont traitees pour les finalites suivantes :
      </P>
      <UL>
        <li>Fourniture, gestion et amelioration du Service</li>
        <li>Gestion des comptes utilisateurs et authentification</li>
        <li>Facturation et gestion des abonnements</li>
        <li>Support technique et relation client</li>
        <li>Envoi de notifications transactionnelles liees au Service</li>
        <li>Analyse statistique et amelioration de la plateforme (donnees anonymisees)</li>
        <li>Respect des obligations legales et reglementaires</li>
        <li>Prevention de la fraude et securite du Service</li>
      </UL>

      <SH>4. Base legale (Art. 6 RGPD)</SH>
      <P>
        Les traitements de donnees personnelles mis en oeuvre par HubScale reposent sur les bases
        legales suivantes :
      </P>
      <UL>
        <li>
          <strong style={{ color: T.text }}>Execution du contrat</strong> (Art. 6.1.b RGPD) : le
          traitement est necessaire a l'execution du contrat d'abonnement et a la fourniture du
          Service (gestion du compte, facturation, support).
        </li>
        <li>
          <strong style={{ color: T.text }}>Interet legitime</strong> (Art. 6.1.f RGPD) : amelioration
          du Service, analyse statistique anonymisee, prevention de la fraude et securite.
        </li>
        <li>
          <strong style={{ color: T.text }}>Obligation legale</strong> (Art. 6.1.c RGPD) : conservation
          des donnees de facturation conformement aux obligations comptables et fiscales.
        </li>
        <li>
          <strong style={{ color: T.text }}>Consentement</strong> (Art. 6.1.a RGPD) : envoi de
          communications marketing et utilisation de cookies non essentiels.
        </li>
      </UL>

      <SH>5. Duree de conservation</SH>
      <P>
        Les donnees personnelles sont conservees pour les durees suivantes :
      </P>
      <UL>
        <li>
          <strong style={{ color: T.text }}>Donnees de compte</strong> : pendant la duree de
          l'abonnement, puis 30 jours apres la resiliation (periode de reactivation).
        </li>
        <li>
          <strong style={{ color: T.text }}>Donnees CRM et metier</strong> : pendant la duree
          de l'abonnement, puis 30 jours apres la resiliation pour permettre l'export.
        </li>
        <li>
          <strong style={{ color: T.text }}>Donnees de facturation</strong> : 10 ans conformement
          aux obligations comptables et fiscales francaises (Art. L.123-22 du Code de commerce).
        </li>
        <li>
          <strong style={{ color: T.text }}>Donnees de connexion</strong> : 12 mois conformement
          a la legislation applicable (decret n 2011-219 du 25 fevrier 2011).
        </li>
        <li>
          <strong style={{ color: T.text }}>Cookies</strong> : 13 mois maximum conformement aux
          recommandations de la CNIL.
        </li>
      </UL>

      <SH>6. Sous-traitants</SH>
      <P>
        Pour la fourniture du Service, HubScale fait appel aux sous-traitants suivants, selectionnes
        pour leur conformite aux exigences du RGPD :
      </P>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
        {[
          {
            name: 'Supabase',
            role: 'Hebergement et base de donnees',
            location: 'Union Europeenne (Francfort, Allemagne)',
            detail: 'Hebergement des donnees applicatives et stockage. Infrastructure conforme aux normes SOC 2 Type II. Donnees hebergees exclusivement dans l\'UE.',
          },
          {
            name: 'Stripe',
            role: 'Traitement des paiements',
            location: 'Certifie PCI DSS Niveau 1',
            detail: 'Gestion securisee des transactions par carte bancaire. Les donnees de carte ne transitent jamais par nos serveurs. Conforme PCI DSS, le plus haut niveau de certification de securite des paiements.',
          },
          {
            name: 'Resend',
            role: 'Service d\'envoi d\'emails',
            location: 'Emails transactionnels',
            detail: 'Envoi des emails transactionnels (confirmations, notifications, reinitialisation de mot de passe). Traitement limite aux donnees strictement necessaires a l\'acheminement des messages.',
          },
          {
            name: 'Vercel',
            role: 'Hebergement de l\'application web',
            location: 'CDN mondial avec edge functions',
            detail: 'Hebergement de l\'interface utilisateur et des fonctions serverless. Infrastructure securisee avec chiffrement TLS en transit. Donnees applicatives non stockees sur Vercel (uniquement le code front-end).',
          },
        ].map((sub) => (
          <div key={sub.name} style={{
            background: 'rgba(255,255,255,.02)',
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.orange }}>{sub.name}</span>
              <span style={{ fontSize: 10, color: T.textMuted, padding: '2px 8px', borderRadius: 20, background: T.orangeBg }}>{sub.role}</span>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>{sub.location}</div>
            <P>{sub.detail}</P>
          </div>
        ))}
      </div>

      <P>
        La liste complete et actualisee de nos sous-traitants est disponible sur demande aupres
        de notre DPO. HubScale s'assure contractuellement que chaque sous-traitant presente des
        garanties suffisantes en matiere de protection des donnees.
      </P>

      <SH>7. Droits des personnes</SH>
      <P>
        Conformement au RGPD et a la loi Informatique et Libertes, vous disposez des droits suivants
        sur vos donnees personnelles :
      </P>
      <UL>
        <li>
          <strong style={{ color: T.text }}>Droit d'acces</strong> (Art. 15 RGPD) : obtenir la
          confirmation que vos donnees sont traitees et en obtenir une copie.
        </li>
        <li>
          <strong style={{ color: T.text }}>Droit de rectification</strong> (Art. 16 RGPD) : faire
          corriger vos donnees inexactes ou incompletes.
        </li>
        <li>
          <strong style={{ color: T.text }}>Droit a l'effacement</strong> (Art. 17 RGPD) : obtenir
          la suppression de vos donnees dans les cas prevus par la reglementation.
        </li>
        <li>
          <strong style={{ color: T.text }}>Droit a la portabilite</strong> (Art. 20 RGPD) : recevoir
          vos donnees dans un format structure, couramment utilise et lisible par machine (JSON, CSV).
        </li>
        <li>
          <strong style={{ color: T.text }}>Droit d'opposition</strong> (Art. 21 RGPD) : vous opposer
          au traitement de vos donnees pour des motifs legitimes, ainsi qu'au profilage.
        </li>
        <li>
          <strong style={{ color: T.text }}>Droit a la limitation</strong> (Art. 18 RGPD) : demander
          la limitation du traitement de vos donnees dans certains cas.
        </li>
        <li>
          <strong style={{ color: T.text }}>Droit de retirer votre consentement</strong> : a tout
          moment pour les traitements fondes sur le consentement.
        </li>
      </UL>
      <P>
        Pour exercer vos droits, contactez notre DPO a l'adresse dpo@hubscale.fr ou via les
        parametres de votre compte. Nous nous engageons a repondre dans un delai d'un mois.
        En cas de demande complexe, ce delai peut etre prolonge de deux mois. Vous disposez
        egalement du droit d'introduire une reclamation aupres de la CNIL (www.cnil.fr).
      </P>

      <SH>8. Cookies</SH>
      <P>
        HubScale utilise des cookies et technologies similaires pour assurer le bon fonctionnement
        du Service et ameliorer l'experience utilisateur.
      </P>

      <SSH>8.1 Cookies essentiels</SSH>
      <P>
        Ces cookies sont strictement necessaires au fonctionnement du Service et ne necessitent pas
        votre consentement : authentification de session, preferences d'interface (theme, langue),
        securite (tokens CSRF).
      </P>

      <SSH>8.2 Cookies analytiques</SSH>
      <P>
        Avec votre consentement, nous utilisons des cookies pour analyser l'utilisation du Service
        et l'ameliorer. Ces donnees sont anonymisees et agregees. Vous pouvez retirer votre
        consentement a tout moment via les parametres de votre compte.
      </P>

      <P>
        Conformement aux recommandations de la CNIL, les cookies ont une duree de vie maximale de
        13 mois. Vous pouvez egalement gerer vos preferences via les parametres de votre navigateur.
      </P>

      <SH>9. Transferts de donnees</SH>
      <P>
        HubScale s'engage a heberger les donnees de ses clients au sein de l'Union Europeenne.
        Nos serveurs de base de donnees sont localises a Francfort, Allemagne (Supabase EU).
      </P>
      <P>
        Dans le cas ou un transfert de donnees vers un pays tiers serait necessaire (par exemple
        pour l'utilisation de certains sous-traitants), HubScale s'assure que des garanties
        appropriees sont mises en place conformement au chapitre V du RGPD :
      </P>
      <UL>
        <li>Decision d'adequation de la Commission Europeenne (le cas echeant)</li>
        <li>Clauses Contractuelles Types (CCT) approuvees par la Commission Europeenne</li>
        <li>Certification au EU-US Data Privacy Framework (le cas echeant)</li>
      </UL>

      <SH>10. Securite</SH>
      <P>
        HubScale met en oeuvre des mesures techniques et organisationnelles appropriees pour garantir
        la securite et la confidentialite des donnees personnelles, notamment :
      </P>
      <UL>
        <li>Chiffrement des donnees en transit (TLS 1.3) et au repos (AES-256)</li>
        <li>Authentification renforcee avec support de l'authentification a deux facteurs (2FA)</li>
        <li>Controle d'acces base sur les roles (RBAC) au sein de la plateforme</li>
        <li>Sauvegardes automatiques quotidiennes avec retention de 30 jours</li>
        <li>Surveillance continue et journalisation des acces (audit logs)</li>
        <li>Tests de penetration reguliers et programme de bug bounty</li>
        <li>Formation reguliere des equipes aux bonnes pratiques de securite</li>
      </UL>
      <P>
        En cas de violation de donnees personnelles susceptible d'engendrer un risque pour les
        droits et libertes des personnes concernees, HubScale s'engage a en notifier la CNIL dans
        un delai de 72 heures et a informer les personnes concernees dans les meilleurs delais.
      </P>

      <SH>11. Modifications</SH>
      <P>
        HubScale se reserve le droit de modifier la presente Politique de Confidentialite a tout
        moment. Toute modification substantielle sera communiquee aux Utilisateurs par email et
        par notification dans l'application au moins 30 jours avant son entree en vigueur.
      </P>
      <P>
        La poursuite de l'utilisation du Service apres la date d'entree en vigueur des modifications
        vaut acceptation de la nouvelle Politique de Confidentialite.
      </P>

      <SH>12. Contact (DPO)</SH>
      <P>
        Pour toute question relative a la protection de vos donnees personnelles ou pour exercer
        vos droits, vous pouvez contacter notre Delegue a la Protection des Donnees :
      </P>
      <UL>
        <li>Delegue a la Protection des Donnees : M. Alexandre Durand</li>
        <li>Email : dpo@hubscale.fr</li>
        <li>Courrier : HubScale SAS - DPO, 42 rue de la Innovation, 75009 Paris, France</li>
      </UL>
      <P>
        En cas de difficulte dans la gestion de vos donnees, vous pouvez egalement adresser une
        reclamation a la Commission Nationale de l'Informatique et des Libertes (CNIL) :
        www.cnil.fr - 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
      </P>
    </div>
  );
}

/* ---------- Main Legal Component ---------- */

export default function Legal({ onBack }) {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      color: T.text,
      fontFamily: FONT,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <Btn v="ghost" small onClick={onBack} aria-label="Retour">
          <span style={{ fontSize: 16, lineHeight: 1 }}>&larr;</span>
        </Btn>
        <div>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>
            Mentions Legales
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>
            HubScale SAS — Informations juridiques
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '16px 24px 0' }}>
        <TabBar
          items={TABS}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Content area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 24px 40px',
      }}>
        <div style={cardStyle}>
          {activeTab === TABS[0] ? <CGU /> : <PrivacyPolicy />}
        </div>
      </div>
    </div>
  );
}
