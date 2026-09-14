# Plateforme BTP — location & vente de materiel

Application Next.js + PostgreSQL (Neon) qui remplace progressivement le site
statique existant. Ce depot contient le **lot A** : base de donnees, schema,
contraintes metier et controle de connexion.

> Le site actuel (`premium/` + `server/`) n'a pas ete touche. Il reste intact
> sur la branche `main` du depot GitHub `RassoulTech/Location-BTP` et continue
> de tourner. Il sera repris sous `legacy/` au lot F, quand le site public
> Next.js sera pret a le remplacer.

---

## Demarrage

```bash
npm install
cp .env.example .env.local   # deja fait si .env.local est present
npm run db:migrate           # applique les migrations
npm run db:seed              # roles, permissions, cles de parametres
npm run dev                  # http://localhost:3000
```

La page d'accueil lit la vraie base et affiche le nombre de tables, d'enums,
de roles, de permissions et de contraintes d'exclusion. Si la connexion
echoue, elle le dit — elle n'affiche jamais de valeurs de substitution.

### Si `npm run db:migrate` echoue

`drizzle-kit migrate` ouvre un WebSocket vers Neon. Certains reseaux le
bloquent. Solution de repli, meme resultat, meme journal :

```bash
node scripts/apply-migrations.mjs
```

---

## Stack

| | |
|---|---|
| Application | Next.js 15 (App Router), React 19, TypeScript strict |
| Base | PostgreSQL 17 sur Neon, region `aws-eu-central-1` |
| Acces donnees | Drizzle ORM + pilote serverless Neon |
| Migrations | `drizzle-kit generate` + une migration SQL ecrite a la main |
| Validation | Zod (lots suivants) |
| Auth | Auth.js v5, sessions en base, Argon2id (lot B) |

Aucune dependance n'est ajoutee sans necessite reelle.

---

## Variables d'environnement

Voir `.env.example`. `.env.local` n'est jamais committe.

| Variable | Role |
|---|---|
| `DATABASE_URL` | Chaine Neon (pooled). Console Neon > projet `location-btp` |
| `AUTH_SECRET` | Secret de session. `openssl rand -base64 32` (lot B) |
| `AUTH_URL` | URL de base pour l'authentification (lot B) |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site |

---

## Base de donnees

27 tables. Deux decisions structurent tout le reste.

### 1. Modele et exemplaire sont distincts

```
equipment_types   →  « Pelle hydraulique CAT 320 »   (tarifs, photos, SEO)
equipment_units   →  « CAT320-001 », « CAT320-002 »  (serie, etat, compteur)
```

Une ligne de location (`rental_items`) se rattache **toujours** a une unite,
jamais a un type. C'est ce qui rend la disponibilite calculable et la
maintenance tracable exemplaire par exemplaire.

### 2. La double reservation est empechee par la base

Un controle applicatif « je verifie puis j'ecris » laisse toujours une fenetre
entre les deux. Ici, une table unique — `unit_occupancies` — dit quelles
periodes sont prises pour chaque unite, et porte une contrainte d'exclusion :

```sql
EXCLUDE USING gist (unit_id WITH =, period WITH &&)
```

Elle est alimentee **automatiquement par des triggers** depuis `rental_items`
et `maintenance_records`. Aucun chemin applicatif ne peut l'oublier.
Consequences :

- deux locations qui se chevauchent sur la meme machine → refusees
- une location pendant une immobilisation atelier → refusee
- deux requetes simultanees sur la derniere machine → une seule passe

Une ligne annulee ou un entretien termine liberent la periode tout seuls.

> **La contrainte, les fonctions et les triggers vivent dans
> `drizzle/0001_business_constraints.sql`.** `drizzle-kit` ne sait pas les
> exprimer et ne les regenerera pas. Ne pas supprimer ce fichier, et le
> rejouer apres toute reinitialisation de la base.

### Conventions

- **Montants** : entiers, en FCFA. Le franc CFA n'a pas de sous-unite, donc
  aucun flottant, aucun arrondi douteux.
- **Taux** : en points de base. `1800` = 18 %.
- **Statuts** : types ENUM PostgreSQL. Les transitions autorisees sont
  declarees dans `src/lib/status.ts` et verifiees par `assertTransition()`
  avant chaque ecriture.
- **Suppression** : evitee. On desactive un compte, on marque un exemplaire
  indisponible — l'historique reste.

---

## Roles et permissions

Le catalogue vit dans `src/lib/permissions.ts` : 7 roles (super_admin, admin,
manager, commercial, comptable, technicien, client) et une cinquantaine de
permissions de la forme `ressource.action`.

`npm run db:seed` synchronise la base a partir de ce fichier. Ajouter une
permission = l'ajouter dans le fichier, puis relancer le seed.

Regle non negociable : toute operation sensible verifie la permission **cote
serveur**. Masquer un bouton ne protege rien.

---

## Donnees de l'entreprise

Aucune information commerciale n'est ecrite en dur. Raison sociale, NINEA,
adresse, telephones, horaires, zones desservies, taux de TVA, forfait de
livraison et remises vivent dans la table `settings`, creee vide par le seed
et remplie depuis l'administration.

Rien n'est invente : tant qu'une valeur n'est pas confirmee, elle reste vide.

---

## Structure

```
drizzle/                      migrations SQL versionnees
  0000_init.sql               genere par drizzle-kit
  0001_business_constraints.sql  ecrit a la main — triggers + exclusions
scripts/
  seed.ts                     roles, permissions, cles de parametres
  apply-migrations.mjs        repli quand le WebSocket est bloque
src/
  app/                        routes Next.js
  db/
    index.ts                  client Drizzle
    schema/                   un fichier par domaine metier
  lib/
    permissions.ts            catalogue des roles et permissions
    status.ts                 machines a etats
```

---

## Etat d'avancement

| Lot | Contenu | Etat |
|---|---|---|
| A | Audit, architecture, modele de donnees, Neon, migrations | **Fait** |
| B | Authentification, roles, permissions, espace client | **Fait** |
| C | Catalogue, unites, disponibilite, locations, retours, maintenance | **Fait** |
| D | Produits, commandes, stocks | A faire |
| E | Paiements, factures, documents, notifications, statistiques | A faire |
| F | SEO, performance, tests d'integration, securite finale, production | A faire |

Aucun moyen de paiement n'est connecte. L'architecture est prete, rien n'est
branche — et rien dans le code ne laisse croire le contraire.

---

## Lots B & C — mise en route complete

```bash
npm install
# creer .env.local a partir de .env.example (DATABASE_URL)
npm run db:migrate          # ou : node scripts/apply-migrations.mjs
npm run db:seed             # roles, permissions, cles de parametres
npm run db:admin -- vous@exemple.sn Prenom Nom "MotDePasse123"
npm run dev                 # http://localhost:3000
```

Puis, dans cet ordre : `/admin/materiels` → creer une categorie → un modele
avec ses tarifs → au moins un exemplaire physique → cocher « Publie ». Le
materiel apparait alors sur `/materiels` et devient reservable.

### Ce qui est implemente

**Authentification** — inscription, connexion, deconnexion, sessions en base
revocables une par une. Mots de passe haches avec scrypt (`node:crypto`,
aucune dependance native a compiler). Le cookie ne porte qu'un jeton aleatoire ;
seul son SHA-256 est stocke, donc une fuite de la table ne permet pas de se
connecter. Une inscription cree aussi la fiche client correspondante.

**Roles et permissions** — 7 roles, ~50 permissions. Chaque page privee et
chaque action serveur commence par `requirePermission()`. Modifier un tarif
exige `equipment.pricing` en plus de `equipment.update`, et laisse une trace
distincte dans le journal.

**Parc materiel** — categories, modeles (tarifs jour / semaine / mois, caution,
prix de vente, publication) et exemplaires physiques avec code interne, numero
de serie, etat, statut, emplacement et compteur horaire.

**Disponibilite** — calculee cote serveur sur la periode demandee a partir de
`unit_occupancies`. Locations et immobilisations d'atelier comptent pareil :
une machine a l'atelier n'apparait jamais comme libre.

**Locations** — demande depuis le catalogue (dates, quantite, retrait ou
livraison). Le devis est **recalcule cote serveur** a partir des tarifs en
base ; le montant venant du navigateur n'est jamais repris. La demande reserve
immediatement des exemplaires reels. Cycle complet : approbation, rejet motive,
confirmation, sortie, retour, cloture, annulation — chaque transition passe par
`assertTransition()`, et l'interface ne propose que les transitions possibles.

**Retours** — compteur horaire, montant des dommages, observations. Cocher
« immobiliser pour maintenance » cree l'intervention et rend la machine non
louable jusqu'a sa cloture.

**Maintenance** — planification par exemplaire, cycle scheduled → in_progress
→ completed. Une intervention ouverte bloque la location sur sa periode.

**Journal d'activite** — qui, quoi, quand, sur quelle ressource, etat avant et
apres. Ecrit dans la meme transaction que l'operation decrite.

**Parametres** — informations de l'entreprise, TVA, forfait de livraison,
remises de duree. Un champ vide reste vide sur le site public : rien n'est
invente, rien n'est remplace par une valeur provisoire.

### Ce qui n'est pas fait

Vente et commandes, stocks, paiements, factures, documents PDF, notifications.
Les tables existent, l'interface non. **Aucun moyen de paiement n'est
connecte** — ni Wave, ni Orange Money, ni carte.

### Verifications

```bash
npm run typecheck     # TypeScript strict
npm run build         # build de production
npm run test:rules    # regles metier pures, sans base
```

`test:rules` couvre 16 cas : bornes de dates incluses, choix automatique de la
base tarifaire la plus avantageuse, remises a 7 et 30 jours, livraison ajoutee
avant TVA, montants toujours entiers, et les transitions interdites (une
demande rejetee ne devient jamais active, une commande annulee ne repart pas en
traitement, une location sortie ne s'annule plus).
