# Migration Stripe : USD → EUR pour les abonnements

Date : 2026-02-20
Auteur : ArthurPcd

---

## Contexte

Les plans d'abonnement Origo sont actuellement configurés en USD dans Stripe.
Cette migration crée des nouveaux prix EUR sans supprimer les anciens (les abonnés USD existants restent sur leurs prix).

**Plans concernés :**

| Plan    | Prix actuel (USD) | Nouveau prix (EUR) |
|---------|------------------|--------------------|
| Starter | $4.99/mois       | €4.99/mois         |
| Pro     | $14.99/mois      | €14.99/mois        |
| Premium | $29.99/mois      | €29.99/mois        |

---

## Étape 1 — Créer les nouveaux prix EUR dans Stripe Dashboard

### 1.1 — Plan Starter EUR

1. Aller sur [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Trouver le produit **"Starter"** (ou "Origo Starter")
3. Cliquer sur **"Add another price"**
4. Configurer :
   - **Currency** : EUR
   - **Price** : 4.99
   - **Billing period** : Monthly
   - **Price description** (optionnel) : "Starter EUR - Monthly"
5. Cliquer **"Save price"**
6. Copier le **Price ID** généré (format : `price_xxxxxxxxxxxxxxxx`)

### 1.2 — Plan Pro EUR

1. Trouver le produit **"Pro"** (ou "Origo Pro")
2. Cliquer sur **"Add another price"**
3. Configurer :
   - **Currency** : EUR
   - **Price** : 14.99
   - **Billing period** : Monthly
   - **Price description** (optionnel) : "Pro EUR - Monthly"
4. Cliquer **"Save price"**
5. Copier le **Price ID** généré

### 1.3 — Plan Premium EUR

1. Trouver le produit **"Premium"** (ou "Origo Premium")
2. Cliquer sur **"Add another price"**
3. Configurer :
   - **Currency** : EUR
   - **Price** : 29.99
   - **Billing period** : Monthly
   - **Price description** (optionnel) : "Premium EUR - Monthly"
4. Cliquer **"Save price"**
5. Copier le **Price ID** généré

---

## Étape 2 — Mettre à jour les variables d'environnement

### Fichier `.env.local` (développement)

Remplacer les anciens Price IDs USD par les nouveaux EUR :

```bash
# Avant (USD)
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_xxx_usd_starter
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxx_usd_pro
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_xxx_usd_premium

# Après (EUR)
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_xxx_eur_starter
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxx_eur_pro
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_xxx_eur_premium
```

### Variables d'environnement Vercel (production)

1. Aller sur [Vercel Dashboard](https://vercel.com/) → Projet Origo → **Settings** → **Environment Variables**
2. Mettre à jour les trois variables :
   - `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID`
3. **Redéployer** le projet pour appliquer les changements

---

## Étape 3 — Vérifier le webhook Stripe

Le webhook (`/api/webhooks/stripe`) écoute les événements Stripe.
Aucune modification de code n'est nécessaire : le webhook traite les événements par `subscription.id`, pas par `price.id`.

Vérifier que le webhook est bien configuré pour l'environnement de production :
- Stripe Dashboard → **Webhooks** → vérifier l'URL : `https://origo-beta.xyz/api/webhooks/stripe`

---

## Étape 4 — Tester avant la mise en production

1. En mode **test Stripe** (`sk_test_...`), créer les prix EUR dans le dashboard test
2. Mettre à jour `.env.local` avec les Price IDs de test EUR
3. Faire un checkout test avec une carte de test Stripe
4. Vérifier que :
   - Le checkout affiche bien "€4.99" (et non "$4.99")
   - Le webhook reçoit l'événement `checkout.session.completed`
   - La subscription se crée correctement dans Supabase (`user_subscriptions`)

---

## Fichiers impactés dans le code

| Fichier | Rôle | Modification requise |
|---------|------|---------------------|
| `src/lib/stripe.ts` | Définit les plans avec `priceId` via env vars | Aucune — déjà dynamique |
| `src/app/api/checkout/route.ts` | Valide les `priceId` via whitelist env vars | Aucune — déjà dynamique |
| `src/app/api/webhooks/stripe/route.ts` | Traite les événements Stripe | Aucune — indépendant du price |
| `.env.local` | Variables d'environnement locales | Mettre à jour les 3 Price IDs |
| Vercel env vars | Variables de production | Mettre à jour les 3 Price IDs |

---

## Notes importantes

- **Ne pas supprimer les anciens prix USD** dans Stripe : les abonnés existants qui ont souscrit en USD resteront sur leurs prix USD jusqu'à résiliation ou migration manuelle.
- Les nouveaux abonnés après la migration souscriront automatiquement en EUR.
- Le symbole `€` vs `$` est géré par Stripe dans la page de checkout — le code ne formate pas la devise directement.
- Si tu veux afficher `€4.99` sur la page de pricing (au lieu de `$4.99`), mettre à jour `src/lib/stripe.ts` : changer `price: 4.99` ne suffit pas, il faudra aussi mettre à jour le formatage dans les composants de pricing pour afficher `€`.
