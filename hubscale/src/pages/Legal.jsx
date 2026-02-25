// HubScale — Legal Pages (CGU + Politique de Confidentialité)
import React, { useState } from 'react';
import { T, FONT } from '../lib/theme.js';
import { Btn, TabBar } from '../components/ui.jsx';

const TABS = ["Conditions Générales d'Utilisation", "Politique de Confidentialité"];

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
          Conditions Générales d'Utilisation
        </h1>
        <p style={{ color: T.textMuted, fontSize: 12, margin: 0, fontFamily: FONT }}>
          Dernière mise à jour : {LAST_UPDATED}
        </p>
      </div>

      <SH>1. Objet</SH>
      <P>
        Les présentes Conditions Générales d'Utilisation (ci-après "CGU") ont pour objet de définir
        les modalités et conditions dans lesquelles la société HubScale SAS (ci-après "HubScale")
        met à disposition sa plateforme SaaS de gestion commerciale et CRM (ci-après "le Service")
        à destination des professionnels et entreprises (ci-après "l'Utilisateur" ou "le Client").
      </P>
      <P>
        L'accès et l'utilisation du Service impliquent l'acceptation sans réserve des présentes CGU.
        HubScale se réserve le droit de modifier les présentes CGU à tout moment. Les modifications
        prennent effet dès leur publication sur la plateforme. L'Utilisateur sera notifié par email
        de toute modification substantielle.
      </P>

      <SH>2. Accès au Service</SH>
      <P>
        Le Service est accessible via un navigateur web compatible (dernières versions de Chrome,
        Firefox, Safari ou Edge). L'Utilisateur est responsable de son équipement informatique,
        de sa connexion internet et de la sécurité de ses identifiants de connexion.
      </P>
      <P>
        L'inscription au Service est réservée aux personnes morales et aux professionnels agissant
        dans le cadre de leur activité professionnelle. L'Utilisateur s'engage à fournir des
        informations exactes et à jour lors de son inscription.
      </P>
      <P>
        HubScale se réserve le droit de suspendre ou de fermer tout compte en cas de violation des
        présentes CGU, d'utilisation frauduleuse ou de non-paiement des sommes dues.
      </P>

      <SH>3. Abonnements et tarifs</SH>
      <P>
        Le Service est proposé sous forme d'abonnements mensuels ou annuels. Les tarifs en vigueur
        sont les suivants (hors taxes) :
      </P>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '16px 0' }}>
        {[
          { name: 'Essentiel', price: '49', features: ['1 utilisateur', 'CRM (100 contacts)', 'Dashboard complet', 'Données financières', 'Export PDF & FEC', 'Support email'] },
          { name: 'Business', price: '149', features: ['5 utilisateurs', 'CRM illimité', 'Analytics & rapports', 'Prévisions IA', 'Simulateur publicitaire', 'Intégrations API (60+)', 'Tous les exports', 'Support prioritaire'] },
          { name: 'Scale', price: '349', features: ['Utilisateurs illimités', 'Tout Business +', 'KPI personnalisés', 'Backup automatique 24h', 'Webhooks avancés', 'Onboarding dédié', 'Account manager', 'SLA 99.9%'] },
        ].map((plan) => (
          <div key={plan.name} style={{
            flex: '1 1 200px',
            background: plan.name === 'Business' ? 'rgba(249,115,22,.06)' : 'rgba(255,255,255,.02)',
            border: `1px solid ${plan.name === 'Business' ? 'rgba(249,115,22,.25)' : T.border}`,
            borderRadius: 14,
            padding: '20px 18px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: plan.name === 'Business' ? T.orange : T.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
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
        Les prix sont susceptibles d'évoluer. Toute modification tarifaire sera communiquée au Client
        au moins 30 jours avant son application. Les abonnements annuels bénéficient d'une remise de
        20% par rapport au tarif mensuel.
      </P>
      <P>
        La facturation est effectuée à l'avance pour chaque période d'abonnement. Tout mois entamé
        est dû dans son intégralité. Les paiements sont effectués par carte bancaire via notre
        prestataire de paiement sécurisé Stripe.
      </P>

      <SH>4. Essai gratuit</SH>
      <P>
        HubScale propose un essai gratuit de 14 jours sur l'ensemble des formules, incluant l'accès
        à toutes les fonctionnalités de la formule choisie. Aucun moyen de paiement n'est requis
        pour démarrer l'essai.
      </P>
      <P>
        À l'issue de la période d'essai, l'Utilisateur devra souscrire un abonnement payant pour
        continuer à utiliser le Service. À défaut, l'accès au Service sera suspendu. Les données
        seront conservées pendant 30 jours après l'expiration de l'essai, permettant à l'Utilisateur
        de réactiver son compte sans perte de données.
      </P>

      <SH>5. Données personnelles</SH>
      <P>
        Le traitement des données personnelles est régi par notre Politique de Confidentialité,
        accessible depuis l'onglet dédié dans la présente page. HubScale agit en tant que
        sous-traitant au sens du RGPD pour les données que le Client intègre dans le Service
        (données clients, contacts CRM), et en tant que responsable de traitement pour les
        données relatives au compte de l'Utilisateur.
      </P>
      <P>
        Un accord de traitement des données (DPA) conforme à l'article 28 du RGPD est disponible
        sur demande pour les clients des formules Professional et Enterprise.
      </P>

      <SH>6. Propriété intellectuelle</SH>
      <P>
        L'ensemble des éléments constituant le Service (logiciel, interface, textes, graphismes,
        logos, base de données, algorithmes) sont la propriété exclusive de HubScale SAS et sont
        protégés par les lois françaises et internationales relatives a la propriété intellectuelle.
      </P>
      <P>
        L'abonnement au Service confère à l'Utilisateur un droit d'utilisation personnel, non
        exclusif, non cessible et non transférable, limité à la durée de l'abonnement. Toute
        reproduction, représentation, modification ou distribution du Service, en tout ou partie,
        est strictement interdite sans autorisation écrite préalable de HubScale.
      </P>
      <P>
        Les données saisies par l'Utilisateur dans le Service restent sa propriété exclusive.
        HubScale ne revendique aucun droit de propriété sur ces données.
      </P>

      <SH>7. Responsabilités</SH>
      <SSH>7.1 Obligations de HubScale</SSH>
      <P>
        HubScale s'engage à fournir le Service avec diligence et conformément aux règles de l'art.
        HubScale garantit un taux de disponibilité du Service de 99,9% (hors maintenance programmée).
        Les interventions de maintenance seront, dans la mesure du possible, effectuées en dehors
        des heures ouvrables et signalées à l'avance.
      </P>

      <SSH>7.2 Limitations de responsabilité</SSH>
      <P>
        HubScale ne saurait être tenue responsable des dommages indirects, tels que les pertes de
        chiffre d'affaires, de données, de bénéfices ou d'opportunités commerciales. En tout état
        de cause, la responsabilité totale de HubScale est limitée au montant des sommes versées
        par le Client au cours des douze (12) derniers mois précédant l'événement générateur de
        responsabilité.
      </P>

      <SSH>7.3 Obligations de l'Utilisateur</SSH>
      <P>
        L'Utilisateur s'engage à utiliser le Service conformément à sa destination et aux présentes
        CGU. Il est responsable de la confidentialité de ses identifiants et de l'ensemble des
        actions effectuées sous son compte. L'Utilisateur s'interdit notamment de :
      </P>
      <UL>
        <li>Tenter d'accéder aux systèmes ou réseaux de HubScale de manière non autorisée</li>
        <li>Utiliser le Service à des fins illicites ou contraires à l'ordre public</li>
        <li>Procéder à l'extraction systématique du contenu du Service (scraping)</li>
        <li>Introduire des virus ou tout élément malveillant dans le Service</li>
        <li>Revendre ou sous-licencier l'accès au Service sans autorisation</li>
      </UL>

      <SH>8. Résiliation</SH>
      <P>
        L'Utilisateur peut résilier son abonnement à tout moment depuis les paramètres de son compte.
        La résiliation prend effet à la fin de la période de facturation en cours. Aucun
        remboursement prorata temporis n'est effectué pour les abonnements mensuels. Pour les
        abonnements annuels, un remboursement au prorata des mois restants pourra être accordé
        sous conditions.
      </P>
      <P>
        HubScale se réserve le droit de résilier l'abonnement d'un Utilisateur en cas de manquement
        grave aux présentes CGU, après mise en demeure restée sans effet pendant 15 jours.
      </P>
      <P>
        En cas de résiliation, l'Utilisateur dispose d'un délai de 30 jours pour exporter ses
        données via les outils d'export intégrés au Service. Passé ce délai, HubScale procédera
        à la suppression définitive des données.
      </P>

      <SH>9. Droit applicable</SH>
      <P>
        Les présentes CGU sont soumises au droit français. Tout litige relatif à l'interprétation
        ou à l'exécution des présentes CGU sera soumis à la compétence exclusive des tribunaux de
        Paris, sauf disposition légale impérieuse contraire.
      </P>
      <P>
        Conformément aux articles L.611-1 et suivants du Code de la consommation, en cas de litige
        non résolu amiablement, le Client professionnel pourra recourir à un médiateur agréé.
      </P>

      <SH>10. Contact</SH>
      <P>
        Pour toute question relative aux présentes CGU, vous pouvez nous contacter :
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
          Politique de Confidentialité
        </h1>
        <p style={{ color: T.textMuted, fontSize: 12, margin: 0, fontFamily: FONT }}>
          Dernière mise à jour : {LAST_UPDATED}
        </p>
      </div>

      <P>
        La présente Politique de Confidentialité décrit comment HubScale SAS (ci-après "HubScale",
        "nous", "notre") collecte, utilise, stocke et protège les données personnelles des
        utilisateurs de sa plateforme SaaS, conformément au Règlement Général sur la Protection
        des Données (RGPD - Règlement UE 2016/679) et à la loi Informatique et Libertés du 6
        janvier 1978 modifiée.
      </P>

      <SH>1. Responsable du traitement</SH>
      <P>
        Le responsable du traitement des données personnelles est :
      </P>
      <UL>
        <li>HubScale SAS</li>
        <li>42 rue de la Innovation, 75009 Paris, France</li>
        <li>RCS Paris B 912 345 678</li>
        <li>Email : dpo@hubscale.fr</li>
        <li>Délégué à la Protection des Données (DPO) : M. Alexandre Durand</li>
      </UL>

      <SH>2. Données collectées</SH>
      <P>
        Dans le cadre de la fourniture du Service, HubScale collecte et traite les catégories de
        données suivantes :
      </P>

      <SSH>2.1 Données d'identification</SSH>
      <UL>
        <li>Nom et prénom</li>
        <li>Adresse email professionnelle</li>
        <li>Numéro de téléphone professionnel (facultatif)</li>
        <li>Nom et raison sociale de l'entreprise</li>
        <li>Fonction au sein de l'entreprise</li>
      </UL>

      <SSH>2.2 Données financières</SSH>
      <UL>
        <li>Informations de facturation (adresse, numéro de TVA)</li>
        <li>Historique des transactions et paiements</li>
        <li>Données de carte bancaire (traitées exclusivement par Stripe, jamais stockées sur nos serveurs)</li>
      </UL>

      <SSH>2.3 Données CRM et métier</SSH>
      <UL>
        <li>Contacts et prospects intégrés par l'Utilisateur</li>
        <li>Données de pipeline commercial (opportunités, montants, étapes)</li>
        <li>Notes, commentaires et historique d'interactions</li>
        <li>Documents et fichiers uploadés</li>
      </UL>

      <SSH>2.4 Données techniques et de navigation</SSH>
      <UL>
        <li>Adresse IP et données de géolocalisation approximative</li>
        <li>Type de navigateur et système d'exploitation</li>
        <li>Pages visitees et actions effectuées sur la plateforme</li>
        <li>Horodatages de connexion et durée des sessions</li>
      </UL>

      <SH>3. Finalites du traitement</SH>
      <P>
        Les données personnelles collectees sont traitées pour les finalités suivantes :
      </P>
      <UL>
        <li>Fourniture, gestion et amélioration du Service</li>
        <li>Gestion des comptes utilisateurs et authentification</li>
        <li>Facturation et gestion des abonnements</li>
        <li>Support technique et relation client</li>
        <li>Envoi de notifications transactionnelles liées au Service</li>
        <li>Analyse statistique et amélioration de la plateforme (données anonymisées)</li>
        <li>Respect des obligations légales et réglementaires</li>
        <li>Prévention de la fraude et sécurité du Service</li>
      </UL>

      <SH>4. Base légale (Art. 6 RGPD)</SH>
      <P>
        Les traitements de données personnelles mis en œuvre par HubScale reposent sur les bases
        légales suivantes :
      </P>
      <UL>
        <li>
          <strong style={{ color: T.text }}>Exécution du contrat</strong> (Art. 6.1.b RGPD) : le
          traitement est nécessaire à l'exécution du contrat d'abonnement et à la fourniture du
          Service (gestion du compte, facturation, support).
        </li>
        <li>
          <strong style={{ color: T.text }}>Intérêt légitime</strong> (Art. 6.1.f RGPD) : amélioration
          du Service, analyse statistique anonymisée, prévention de la fraude et sécurité.
        </li>
        <li>
          <strong style={{ color: T.text }}>Obligation légale</strong> (Art. 6.1.c RGPD) : conservation
          des données de facturation conformément aux obligations comptables et fiscales.
        </li>
        <li>
          <strong style={{ color: T.text }}>Consentement</strong> (Art. 6.1.a RGPD) : envoi de
          communications marketing et utilisation de cookies non essentiels.
        </li>
      </UL>

      <SH>5. Durée de conservation</SH>
      <P>
        Les données personnelles sont conservées pour les durées suivantes :
      </P>
      <UL>
        <li>
          <strong style={{ color: T.text }}>Données de compte</strong> : pendant la durée de
          l'abonnement, puis 30 jours après la résiliation (période de réactivation).
        </li>
        <li>
          <strong style={{ color: T.text }}>Données CRM et métier</strong> : pendant la durée
          de l'abonnement, puis 30 jours après la résiliation pour permettre l'export.
        </li>
        <li>
          <strong style={{ color: T.text }}>Données de facturation</strong> : 10 ans conformément
          aux obligations comptables et fiscales françaises (Art. L.123-22 du Code de commerce).
        </li>
        <li>
          <strong style={{ color: T.text }}>Données de connexion</strong> : 12 mois conformément
          a la legislation applicable (decret n 2011-219 du 25 février 2011).
        </li>
        <li>
          <strong style={{ color: T.text }}>Cookies</strong> : 13 mois maximum conformément aux
          recommandations de la CNIL.
        </li>
      </UL>

      <SH>6. Sous-traitants</SH>
      <P>
        Pour la fourniture du Service, HubScale fait appel aux sous-traitants suivants, sélectionnés
        pour leur conformite aux exigences du RGPD :
      </P>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
        {[
          {
            name: 'Supabase',
            rôle: 'Hébergement et base de données',
            location: 'Union Européenne (Francfort, Allemagne)',
            detail: 'Hébergement des données applicatives et stockage. Infrastructure conforme aux normes SOC 2 Type II. Données hébergées exclusivement dans l\'UE.',
          },
          {
            name: 'Stripe',
            rôle: 'Traitement des paiements',
            location: 'Certifié PCI DSS Niveau 1',
            detail: 'Gestion sécurisée des transactions par carte bancaire. Les données de carte ne transitent jamais par nos serveurs. Conforme PCI DSS, le plus haut niveau de certification de sécurité des paiements.',
          },
          {
            name: 'Resend',
            rôle: 'Service d\'envoi d\'emails',
            location: 'Emails transactionnels',
            detail: 'Envoi des emails transactionnels (confirmations, notifications, réinitialisation de mot de passe). Traitement limité aux données strictement nécessaires à l\'acheminement des messages.',
          },
          {
            name: 'Vercel',
            rôle: 'Hébergement de l\'application web',
            location: 'CDN mondial avec edge functions',
            detail: 'Hébergement de l\'interface utilisateur et des fonctions serverless. Infrastructure sécurisée avec chiffrement TLS en transit. Données applicatives non stockées sur Vercel (uniquement le code front-end).',
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
              <span style={{ fontSize: 10, color: T.textMuted, padding: '2px 8px', borderRadius: 20, background: T.orangeBg }}>{sub.rôle}</span>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>{sub.location}</div>
            <P>{sub.detail}</P>
          </div>
        ))}
      </div>

      <P>
        La liste complete et actualisée de nos sous-traitants est disponible sur demande auprès
        de notre DPO. HubScale s'assure contractuellement que chaque sous-traitant présente des
        garanties suffisantes en matière de protection des données.
      </P>

      <SH>7. Droits des personnes</SH>
      <P>
        Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants
        sur vos données personnelles :
      </P>
      <UL>
        <li>
          <strong style={{ color: T.text }}>Droit d'accès</strong> (Art. 15 RGPD) : obtenir la
          confirmation que vos données sont traitées et en obtenir une copie.
        </li>
        <li>
          <strong style={{ color: T.text }}>Droit de rectification</strong> (Art. 16 RGPD) : faire
          corriger vos données inexactes ou incomplètes.
        </li>
        <li>
          <strong style={{ color: T.text }}>Droit à l'effacement</strong> (Art. 17 RGPD) : obtenir
          la suppression de vos données dans les cas prévus par la réglementation.
        </li>
        <li>
          <strong style={{ color: T.text }}>Droit à la portabilité</strong> (Art. 20 RGPD) : recevoir
          vos données dans un format structuré, couramment utilisé et lisible par machine (JSON, CSV).
        </li>
        <li>
          <strong style={{ color: T.text }}>Droit d'opposition</strong> (Art. 21 RGPD) : vous opposer
          au traitement de vos données pour des motifs légitimes, ainsi qu'au profilage.
        </li>
        <li>
          <strong style={{ color: T.text }}>Droit à la limitation</strong> (Art. 18 RGPD) : demander
          la limitation du traitement de vos données dans certains cas.
        </li>
        <li>
          <strong style={{ color: T.text }}>Droit de retirer votre consentement</strong> : à tout
          moment pour les traitements fondés sur le consentement.
        </li>
      </UL>
      <P>
        Pour exercer vos droits, contactez notre DPO à l'adresse dpo@hubscale.fr ou via les
        paramètres de votre compte. Nous nous engageons à répondre dans un délai d'un mois.
        En cas de demande complexe, ce délai peut être prolongé de deux mois. Vous disposez
        également du droit d'introduire une réclamation auprès de la CNIL (www.cnil.fr).
      </P>

      <SH>8. Cookies</SH>
      <P>
        HubScale utilise des cookies et technologies similaires pour assurer le bon fonctionnement
        du Service et améliorer l'expérience utilisateur.
      </P>

      <SSH>8.1 Cookies essentiels</SSH>
      <P>
        Ces cookies sont strictement nécessaires au fonctionnement du Service et ne nécessitent pas
        votre consentement : authentification de session, préférences d'interface (thème, langue),
        sécurité (tokens CSRF).
      </P>

      <SSH>8.2 Cookies analytiques</SSH>
      <P>
        Avec votre consentement, nous utilisons des cookies pour analyser l'utilisation du Service
        et l'améliorer. Ces données sont anonymisées et agrégées. Vous pouvez retirer votre
        consentement à tout moment via les paramètres de votre compte.
      </P>

      <P>
        Conformément aux recommandations de la CNIL, les cookies ont une durée de vie maximale de
        13 mois. Vous pouvez également gérer vos préférences via les paramètres de votre navigateur.
      </P>

      <SH>9. Transferts de données</SH>
      <P>
        HubScale s'engage à héberger les données de ses clients au sein de l'Union Européenne.
        Nos serveurs de base de données sont localisés à Francfort, Allemagne (Supabase EU).
      </P>
      <P>
        Dans le cas où un transfert de données vers un pays tiers serait nécessaire (par exemple
        pour l'utilisation de certains sous-traitants), HubScale s'assure que des garanties
        appropriées sont mises en place conformément au chapitre V du RGPD :
      </P>
      <UL>
        <li>Décision d'adéquation de la Commission Européenne (le cas échéant)</li>
        <li>Clauses Contractuelles Types (CCT) approuvées par la Commission Européenne</li>
        <li>Certification au EU-US Data Privacy Framework (le cas échéant)</li>
      </UL>

      <SH>10. Sécurité</SH>
      <P>
        HubScale met en oeuvre des mesures techniques et organisationnelles appropriées pour garantir
        la sécurité et la confidentialité des données personnelles, notamment :
      </P>
      <UL>
        <li>Chiffrement des données en transit (TLS 1.3) et au repos (AES-256)</li>
        <li>Authentification renforcée avec support de l'authentification a deux facteurs (2FA)</li>
        <li>Contrôle d'accès base sur les rôles (RBAC) au sein de la plateforme</li>
        <li>Sauvegardes automatiques quotidiennes avec retention de 30 jours</li>
        <li>Surveillance continue et journalisation des accès (audit logs)</li>
        <li>Tests de pénétration réguliers et programme de bug bounty</li>
        <li>Formation régulière des équipes aux bonnes pratiques de sécurité</li>
      </UL>
      <P>
        En cas de violation de données personnelles susceptible d'engendrer un risque pour les
        droits et libertés des personnes concernées, HubScale s'engage a en notifiér la CNIL dans
        un délai de 72 heures et a informer les personnes concernées dans les meilleurs délais.
      </P>

      <SH>11. Modifications</SH>
      <P>
        HubScale se réserve le droit de modifier la présente Politique de Confidentialité a tout
        moment. Toute modification substantielle sera communiquée aux Utilisateurs par email et
        par notification dans l'application au moins 30 jours avant son entree en vigueur.
      </P>
      <P>
        La poursuite de l'utilisation du Service après la date d'entree en vigueur des modifications
        vaut acceptation de la nouvelle Politique de Confidentialité.
      </P>

      <SH>12. Contact (DPO)</SH>
      <P>
        Pour toute question relative a la protection de vos données personnelles ou pour exercer
        vos droits, vous pouvez contacter notre Délégué à la Protection des Données :
      </P>
      <UL>
        <li>Délégué à la Protection des Données : M. Alexandre Durand</li>
        <li>Email : dpo@hubscale.fr</li>
        <li>Courrier : HubScale SAS - DPO, 42 rue de la Innovation, 75009 Paris, France</li>
      </UL>
      <P>
        En cas de difficulté dans la gestion de vos données, vous pouvez également adresser une
        réclamation a la Commission Nationale de l'Informatique et des Libertés (CNIL) :
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
            Mentions Légales
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
