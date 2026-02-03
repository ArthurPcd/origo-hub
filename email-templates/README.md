# Email Templates ORIGO

Templates professionnels pour les emails transactionnels Supabase.

## 🎨 Style

- Couleurs brand ORIGO (accent #6B7CFF, base #0B0D10)
- Logo dot pulsant + texte ORIGO
- Design dark mode épuré
- Footer "Pacaud Services"

## 📧 Templates disponibles

### 1. confirm-signup.html
Email de confirmation d'inscription (Confirm sign up dans Supabase)

### 2. reset-password.html
Email de réinitialisation de mot de passe (Reset password dans Supabase)

## ⚙️ Configuration Supabase

### Étape 1 : Setup Resend

1. **Créer compte Resend** : https://resend.com/signup
2. **Ajouter domaine** : `origo-beta.xyz`
3. **Configurer DNS sur Namecheap** (Advanced DNS) :

```
Type: TXT    Host: @                    Value: v=spf1 include:resend.com ~all
Type: TXT    Host: resend._domainkey    Value: [clé DKIM de Resend]
Type: TXT    Host: _dmarc               Value: v=DMARC1; p=none; pct=100; rua=mailto:postmaster@origo-beta.xyz
```

4. **Récupérer API Key** : Dashboard Resend → API Keys → Create

### Étape 2 : Configurer Supabase SMTP

Dans Supabase → Authentication → Email Settings :

- **Enable Custom SMTP** : ON
- **Sender email** : `no-reply@origo-beta.xyz`
- **Sender name** : `ORIGO`
- **Host** : `smtp.resend.com`
- **Port** : `465`
- **Username** : `resend`
- **Password** : `[ta clé API Resend - commence par re_...]`

### Étape 3 : Copier les templates

Dans Supabase → Authentication → Email Templates :

1. **Confirm signup** : Copie le contenu de `confirm-signup.html`
2. **Reset password** : Copie le contenu de `reset-password.html`

**IMPORTANT** : Garde bien `{{ .ConfirmationURL }}` dans les templates ! C'est la syntaxe correcte pour Supabase.

## 🧪 Test

Après configuration :
1. Va sur `https://origo-beta.xyz/signup`
2. Crée un nouveau compte
3. Vérifie que tu reçois l'email de confirmation avec le bon design
4. Clique sur "Confirmer mon email"

## 📊 Limites Resend (Free tier)

- 3000 emails/mois
- 100 emails/jour
- Largement suffisant pour démarrer !

## Variables Supabase disponibles

- `{{ .ConfirmationURL }}` - URL de confirmation/reset
- `{{ .Token }}` - Token brut (6 chiffres)
- `{{ .TokenHash }}` - Hash du token
- `{{ .SiteURL }}` - URL du site (https://origo-beta.xyz)
- `{{ .Email }}` - Email de l'utilisateur
- `{{ .RedirectTo }}` - URL de redirection après action
