# NDIOBEEN GUI LOGISTIQUE — plateforme

Le site public de NDIOBEEN GUI LOGISTIQUE, **conservé tel quel**, et la plateforme
métier qui se construit derrière : comptes, rôles, permissions, espace client et
administration.

---

## Le principe

> **Le site existant n'est pas réécrit. Il est servi tel quel.
> Next.js s'installe autour de lui, pas à sa place.**

Les fichiers du site vivent dans `public/` et sont identiques au bit près à ceux du
commit `29c83e3` :

```
public/index.html  services.html  flotte.html  reservation.html  contact.html
public/premium.css  premium.js  data.js  ui.js  img/
```

`next.config.ts` leur donne des URL propres — `/`, `/services`, `/flotte`,
`/reservation`, `/contact` — et l'application Next.js occupe le reste des routes.

### Les seules modifications du site d'origine

| Fichier | Nature |
|---|---|
| `public/ui.js` | bouton « Connexion » dans la barre, injection de `compte.css`. **+38 lignes, 0 supprimée** |
| `public/compte.css` | **nouveau** — le seul ajout de style |

`premium.css`, `premium.js`, `data.js` et les cinq pages HTML ne sont pas modifiés.
Toute modification les concernant doit être considérée comme une erreur.

---

## Démarrage

```bash
npm install
cp .env.example .env.local        # puis renseigner DATABASE_URL
npm run db:seed                   # rôles et permissions
npm run db:admin -- vous@exemple.sn Prénom Nom "MotDePasseSolide"
npm run dev                       # http://localhost:3000
```

Le schéma se pose avec `drizzle/0000_auth.sql` (à jouer une fois sur une base neuve).

---

## Stack

| | |
|---|---|
| Application | Next.js 15 (App Router), React 19, TypeScript strict |
| Base | PostgreSQL — Neon en production, PostgreSQL classique en local |
| Accès données | Drizzle ORM |
| Validation | Zod, côté serveur — c'est elle qui fait foi |
| Mots de passe | scrypt (`node:crypto`), aucune dépendance native à compiler |

### Deux pilotes, une seule interface

`src/db/index.ts` choisit le pilote d'après l'hôte de `DATABASE_URL` :

- hôte `*.neon.tech` → `neon-serverless` (WebSocket). **Pas `neon-http`** : le pilote
  HTTP ne supporte pas les transactions, que le cahier des charges exige.
- tout autre hôte → `node-postgres`.

C'est ce qui permet de développer et de tester en local sans dépendre du réseau.

---

## Sécurité

- Mots de passe hachés en scrypt, format `scrypt$N$r$p$sel$clé`. Jamais en clair.
- Sessions en base, révocables une par une. Le cookie ne porte qu'un jeton aléatoire ;
  **seul son SHA-256 est stocké** — une fuite de la table ne permet pas de se connecter.
- Un échec de connexion ne dit jamais si c'est l'adresse ou le mot de passe qui est
  faux, et vérifie un hachage factice quand le compte n'existe pas, pour que la durée
  de la réponse ne trahisse rien.
- Toute page privée et toute action sensible commence par `requireUser()`,
  `requirePermission()` ou leur variante « page ». Masquer un bouton ne protège rien.

---

## Rôles et permissions

Catalogue unique dans `src/lib/permissions.ts` : 50 permissions, 7 rôles.
`npm run db:seed` synchronise la base — il **retire** aussi les droits supprimés du
catalogue, sinon un droit révoqué resterait accordé.

| Rôle | Permissions |
|---|---|
| super_admin | 50 |
| admin | 47 |
| manager | 30 |
| commercial | 18 |
| comptable | 10 |
| technicien | 9 |
| client | 7 |

---

## Vérification

```bash
npm run typecheck
npm run build

# Les tests pilotent un vrai navigateur. Playwright n'est pas dans les
# dependances du projet — il telechargerait un navigateur a chaque build
# Vercel pour rien. On l'installe seulement quand on veut tester :
npm i -D playwright && npx playwright install chromium

npm run test:auth -- http://localhost:3000    # 28 controles
node scripts/captures.mjs http://localhost:3000
```

`test-auth.mjs` ouvre un vrai navigateur, remplit les vrais formulaires et **relit la
base** derrière : mot de passe haché, jeton de session haché, cloisonnement des rôles,
révocation à la déconnexion, refus des doublons.

---

## Structure

```
public/            le site existant, intact, + compte.css
src/
  app/
    (auth)/        connexion, inscription
    (client)/      espace client
    (admin)/       administration
    api/moi/       état du compte, lu par la barre du site
  components/
  db/              schéma et client
  lib/
    auth/          mots de passe, sessions, contrôle d'accès
    actions/       actions serveur
    permissions.ts catalogue des rôles et permissions
drizzle/           migrations SQL
scripts/           seed, création de compte, tests
legacy-server/     l'ancien serveur Express, conservé le temps du portage
```

---

## État d'avancement

| Étape | Contenu | État |
|---|---|---|
| 1 | Socle, base, comptes, rôles, permissions, connexion | **Fait** |
| 2 | Écrans de l'espace client et de l'administration | À faire |
| 3 | Branchement du site public (catalogue, disponibilité, réservation) | À faire |
| 4 | Retours, maintenance, vente, stocks, paiements, factures | À faire |
| 5 | Pages légales, 404, SEO, performance, sécurité finale | À faire |

**Aucun moyen de paiement n'est connecté.** Aucune donnée commerciale n'est écrite en
dur : ce qui n'est pas confirmé reste vide.

### `legacy-server/`

L'ancien serveur Express est conservé tel quel le temps que ses trois routes
(`/api/stock`, `/api/bookings`, `/api/contact`) soient portées et vérifiées à l'étape 3.
Il n'a jamais tourné en production — `vercel.json` ne déployait que le dossier statique.
`mailer.js` et `templates.js` seront repris, pas réécrits.
