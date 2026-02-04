# Fiche Projet — Origo

**Étudiant :** Arthur Pacaud
**Dépôt GitHub :** https://github.com/ArthurPcd/origo-hub
**Période de développement :** Décembre 2025 – Février 2026
**Temps total estimé : 60 heures**

---

## Présentation du projet

**Origo** est une plateforme SaaS de génération de briefs créatifs assistée par IA.

L'objectif est de permettre à des agences, freelances et entrepreneurs de générer en moins d'une minute un brief de projet structuré et exportable — qu'il s'agisse d'une présentation, d'un scope MVP, d'un POC technique ou d'un devis. L'utilisateur remplit un formulaire en quelques étapes, choisit le type de document souhaité, et l'IA produit un brief complet formaté, prêt à partager ou exporter en PDF.

Le projet couvre l'ensemble de la stack : authentification, base de données, paiements, génération IA, export PDF et internationalisation sur 7 langues.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Langage | TypeScript |
| Styling | Tailwind CSS v4 |
| Authentification | Clerk |
| Base de données | Supabase (PostgreSQL + Row Level Security) |
| Paiements | Stripe (Checkout + Webhooks) |
| IA | API Anthropic (architecture multi-agent) |
| i18n | next-intl — 7 langues (EN, FR, DE, ES, IT, RU, ZH) |
| Export PDF | Puppeteer (server) + @react-pdf/renderer (client) |
| Monitoring | Sentry + PostHog |
| Tests | Jest (unitaires) + Playwright (E2E) |
| Déploiement | Vercel |

---

## Features & estimation du temps

### 1. Setup & configuration — 3h

- Initialisation Next.js 15 avec TypeScript et Tailwind v4
- Configuration next-intl pour 7 langues avec ICU MessageFormat
- Mise en place du linter, tsconfig strict, variables d'environnement

---

### 2. Authentification complète — 5h

- Intégration Clerk (provider, middleware, pages)
- Pages login / signup / forgot-password / reset-password
- Middleware de protection des routes avec gestion des locales
- En-têtes de sécurité (CSP, HSTS, X-Frame-Options, Permissions-Policy)
- Webhook Clerk → synchronisation utilisateurs vers Supabase à l'inscription

---

### 3. Base de données Supabase — 4h

- Schéma PostgreSQL : briefs, user_subscriptions, brief_folders, brief_skins, user_feature_activations, activation_codes
- Migrations SQL versionnées (7 fichiers)
- Politiques Row Level Security par table
- Intégration JWT Clerk → Supabase pour RLS côté utilisateur connecté

---

### 4. Landing page — 4h

- Section hero avec CTA
- Présentation des features (3 colonnes)
- Section pricing avec les plans
- Responsive desktop / mobile
- Animations légères (Framer Motion)
- Traductions pour les 7 langues

---

### 5. Formulaire de génération de briefs — 4h

- Formulaire multi-étapes avec validation Zod
- Sélecteur de mode : Présentation / MVP / POC / Devis
- Streaming de la génération avec indicateur de progression
- Gestion des erreurs (quota dépassé, API indisponible)

---

### 6. API de génération IA — 6h

- Route `/api/generate` avec sanitisation des entrées
- Architecture multi-agent selon le plan :
  - Free / Starter → 1 appel Haiku séquentiel
  - Pro → 2 appels Haiku en parallèle + merge
  - Premium → 3 Haiku + coordinateur Sonnet
- Rate limiting par utilisateur (5 req/15 min)
- Déduction de crédits atomique en base
- Route `/api/generate/idea` pour le mode "Idée Express"

---

### 7. Dashboard & historique des briefs — 3h

- Liste des briefs avec recherche
- Système de dossiers façon Mac Finder (onglets colorés)
- Filtrage par dossier
- Actions rapides : renommer, supprimer, assigner un dossier

---

### 8. Vue détaillée d'un brief — 2h

- Affichage du contenu formaté (Markdown → HTML)
- Actions : éditer le titre, exporter PDF, partager
- Sélecteur de style PDF (selon plan)

---

### 9. Paiements Stripe — 7h

- Page pricing avec comparatif des plans
- Checkout Stripe pour les abonnements (Free / Starter / Pro / Premium)
- Achat de packs de crédits (5, 10, 25, 50, 100 crédits)
- Webhook Stripe : gestion des événements `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Mise à jour du plan et des crédits en base après paiement
- Page compte : affichage du plan actuel, crédits restants, historique

---

### 10. Export PDF multi-thèmes — 6h

- Route Puppeteer server-side pour rendu haute qualité
- @react-pdf/renderer pour export client-side
- 5 thèmes : classic, minimal, dark (Pro+), executive, emerald (Premium+)
- Gating par plan côté serveur
- Route `/api/pdf-styles` pour exposer les thèmes disponibles

---

### 11. Système de dossiers — 4h

- CRUD dossiers (créer, renommer, supprimer, réordonner)
- Assignation rapide via dropdown sur chaque brief card
- Persistance en base avec FK `briefs.folder_id`
- RLS : chaque utilisateur ne voit que ses propres dossiers

---

### 12. Codes d'activation — 2h

- Table `activation_codes` accessible uniquement en service_role
- Validation serveur : format, expiration, quota d'utilisations
- Activation de features spéciales (ex : édition collector)
- Modal d'activation dans la page compte

---

### 13. Bot Telegram — 3h

- Création du bot via @BotFather, configuration webhook
- Commandes : `/status`, `/briefs`, `/usage`
- Notifications automatiques : brief généré, nouveau paiement, erreur
- Helper `sendTelegramMessage()` appelé depuis les API routes

---

### 14. Tests — 4h

- **Jest (unitaires)** : repositories, error handling, rate limiting, validation, Stripe utils — 4 suites, ~100 tests
- **Playwright (E2E)** : flux auth (login → redirect), génération de brief, abonnement

---

### 15. Sécurité & déploiement — 3h

- Audit Content Security Policy (script-src, worker-src, connect-src, frame-src)
- Rate limiting en mémoire avec fallback serverless
- Déploiement Vercel, configuration domaine custom
- Variables d'environnement production séparées des variables de dev

---

## Récapitulatif

| Feature | Temps |
|---|---|
| Setup & configuration | 3h |
| Authentification (Clerk) | 5h |
| Base de données Supabase | 4h |
| Landing page | 4h |
| Formulaire de génération | 4h |
| API génération IA (multi-agent) | 6h |
| Dashboard & historique | 3h |
| Vue détaillée brief | 2h |
| Paiements Stripe | 7h |
| Export PDF multi-thèmes | 6h |
| Système de dossiers | 4h |
| Codes d'activation | 2h |
| Bot Telegram | 3h |
| Tests Jest + Playwright | 4h |
| Sécurité & déploiement | 3h |
| **Total** | **60h** |
