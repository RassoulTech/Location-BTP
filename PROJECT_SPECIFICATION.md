# PROJECT SPECIFICATION — PLATEFORME WEB BTP

## 1. RÔLE DE L'AGENT

Tu es l'agent principal chargé d'analyser, développer, améliorer, tester et maintenir une plateforme web professionnelle pour une entreprise du secteur du BTP qui vend et loue du matériel et des équipements de construction.

Tu travailles directement sur un projet existant.

IMPORTANT :
- Le projet possède déjà un site web.
- Il ne faut PAS repartir de zéro sans raison.
- Il faut d'abord analyser l'existant.
- Il faut préserver les fonctionnalités existantes qui sont utiles.
- Il faut améliorer et étendre progressivement le projet.
- Toute modification doit être cohérente avec l'architecture existante.
- Ne jamais supprimer ou remplacer une fonctionnalité existante sans avoir vérifié son rôle et son impact.

Le résultat final doit être une véritable plateforme web professionnelle, et pas simplement une vitrine avec quelques pages supplémentaires.

---

# 2. OBJECTIF GLOBAL

Transformer progressivement le site existant en une plateforme complète permettant :

- de présenter l'entreprise ;
- de présenter les équipements et produits ;
- de vendre certains équipements ou produits ;
- de louer des équipements ;
- de gérer les demandes de location ;
- de gérer les commandes ;
- de gérer les clients ;
- de gérer les équipements physiques ;
- de gérer les stocks ;
- de gérer les disponibilités ;
- de gérer les paiements ;
- de gérer les factures et documents ;
- de gérer la maintenance des équipements ;
- de gérer les utilisateurs internes ;
- de gérer les rôles et permissions ;
- de fournir un espace client ;
- de fournir un espace administrateur ;
- de suivre l'activité de l'entreprise ;
- de préparer une base solide pour le référencement naturel ;
- de déployer la plateforme sur un domaine professionnel.

---

# 3. STACK TECHNIQUE OBLIGATOIRE

La stack principale doit rester :

- Next.js
- React
- TypeScript
- PostgreSQL
- Neon PostgreSQL

Ne pas remplacer cette stack par :

- Laravel ;
- PHP ;
- MySQL ;
- Supabase ;
- MongoDB ;
- Firebase ;
- autre framework principal.

Les bibliothèques complémentaires sont autorisées lorsqu'elles sont réellement nécessaires et compatibles avec l'architecture.

Avant d'ajouter une dépendance, vérifier si elle est réellement nécessaire.

Éviter la multiplication inutile des packages.

---

# 4. MÉTHODE DE TRAVAIL — 4D

Le projet doit suivre la méthode :

## D1 — DÉLÉGATION

L'agent peut prendre en charge :

- analyse du code ;
- analyse de l'architecture ;
- conception de la base de données ;
- développement frontend ;
- développement backend ;
- API ;
- authentification ;
- autorisation ;
- migrations ;
- CRUD ;
- logique métier ;
- espace client ;
- espace administrateur ;
- gestion des locations ;
- gestion des ventes ;
- gestion des stocks ;
- gestion de la maintenance ;
- notifications ;
- statistiques ;
- tests ;
- correction des erreurs ;
- optimisation ;
- documentation.

Cependant, l'agent ne doit jamais considérer son propre code comme automatiquement correct.

Le développeur reste responsable des décisions finales.

---

# 5. D2 — DESCRIPTION

Chaque fonctionnalité doit être comprise selon :

- son objectif ;
- ses utilisateurs ;
- ses données ;
- son fonctionnement ;
- ses règles métier ;
- ses dépendances ;
- ses permissions ;
- ses états ;
- ses erreurs possibles ;
- son comportement côté client ;
- son comportement côté serveur.

Ne pas développer uniquement à partir de l'apparence visuelle.

Une interface visible ne signifie pas qu'une fonctionnalité est réellement implémentée.

---

# 6. D3 — DISCERNEMENT

Avant de considérer une fonctionnalité comme terminée, vérifier :

- architecture ;
- logique métier ;
- base de données ;
- sécurité ;
- authentification ;
- autorisation ;
- permissions ;
- validation serveur ;
- cohérence des données ;
- gestion des erreurs ;
- relations entre tables ;
- disponibilité des équipements ;
- conflits de réservation ;
- cohérence des stocks ;
- calculs ;
- statistiques ;
- performances ;
- TypeScript ;
- ESLint ;
- build production ;
- responsive design.

Ne jamais se contenter de constater qu'une page s'affiche correctement.

---

# 7. D4 — DILIGENCE

Les contraintes suivantes sont obligatoires :

- conserver Next.js ;
- conserver TypeScript ;
- utiliser PostgreSQL avec Neon ;
- ne pas remplacer la base de données par une autre solution ;
- ne pas hardcoder les secrets ;
- utiliser les variables d'environnement ;
- protéger les routes privées ;
- effectuer les contrôles importants côté serveur ;
- ne jamais faire confiance uniquement au frontend ;
- conserver une architecture maintenable ;
- éviter les solutions temporaires qui deviennent définitives ;
- ne pas supprimer des données existantes sans justification ;
- ne pas réécrire tout le projet inutilement.

D2 et D4 doivent toujours être considérés ensemble :

DESCRIPTION précise de ce qui est attendu + DILIGENCE précise des contraintes à respecter.

---

# 8. RÈGLE ABSOLUE : ANALYSER AVANT DE MODIFIER

Avant toute modification importante :

1. analyser la structure du projet ;
2. identifier les pages existantes ;
3. identifier les composants ;
4. identifier les routes ;
5. identifier les API ;
6. identifier la configuration ;
7. identifier le système d'authentification existant ;
8. identifier la base de données existante ;
9. identifier les modèles ;
10. identifier les variables d'environnement ;
11. identifier les fonctionnalités déjà implémentées ;
12. identifier les fonctionnalités incomplètes ;
13. identifier les éventuels problèmes techniques ;
14. identifier les risques de régression.

Ne jamais commencer par créer arbitrairement de nouveaux fichiers sans comprendre le projet existant.

---

# 9. CYCLE DE DÉVELOPPEMENT OBLIGATOIRE

Pour chaque fonctionnalité :

ANALYSER
→ PLANIFIER
→ IMPLÉMENTER
→ VÉRIFIER
→ TESTER
→ CORRIGER
→ DOCUMENTer si nécessaire
→ PASSER À LA SUITE

Une fonctionnalité n'est pas terminée simplement parce que son interface est créée.

---

# 10. ARCHITECTURE GÉNÉRALE

La plateforme doit progressivement être organisée autour de trois grands espaces :

1. espace public ;
2. espace client ;
3. espace administrateur.

Des espaces supplémentaires peuvent être ajoutés si l'analyse du projet le justifie.

---

# 11. ESPACE PUBLIC

L'espace public doit pouvoir contenir :

- accueil ;
- présentation de l'entreprise ;
- services ;
- équipements ;
- catégories ;
- détails d'un équipement ;
- produits à vendre ;
- détails d'un produit ;
- conditions de location ;
- conditions de vente ;
- FAQ ;
- contact ;
- informations de l'entreprise.

L'expérience doit être professionnelle, claire et adaptée au secteur du BTP.

---

# 12. PAGE D'ACCUEIL

La page d'accueil doit présenter clairement :

- l'activité de l'entreprise ;
- les principaux services ;
- la vente d'équipements ;
- la location d'équipements ;
- les catégories principales ;
- les équipements mis en avant ;
- les moyens de contact ;
- les appels à l'action pertinents.

Ne pas surcharger la page.

La hiérarchie visuelle doit être claire.

---

# 13. CATALOGUE DES ÉQUIPEMENTS

Le catalogue doit permettre :

- recherche ;
- filtrage ;
- catégories ;
- disponibilité ;
- caractéristiques ;
- images ;
- description ;
- conditions ;
- prix lorsque disponible ;
- location ;
- vente lorsque applicable.

Les informations doivent provenir de la base de données.

Ne pas créer de fausses données permanentes directement dans les composants.

---

# 14. DISTINCTION TYPE D'ÉQUIPEMENT / UNITÉ PHYSIQUE

Cette distinction est fondamentale.

Un modèle/type d'équipement représente une catégorie ou un modèle.

Exemple :

PELLETEUSE CAT 320

Ce modèle peut avoir plusieurs unités physiques :

- CAT320-001
- CAT320-002
- CAT320-003

Chaque unité physique doit pouvoir avoir :

- identifiant interne ;
- numéro ou référence ;
- état ;
- disponibilité ;
- localisation ;
- heures d'utilisation ;
- historique ;
- maintenance ;
- statut.

Cette architecture doit permettre de savoir précisément quelle unité est disponible, louée ou en maintenance.

---

# 15. STATUTS DES ÉQUIPEMENTS

Prévoir au minimum :

- available ;
- reserved ;
- rented ;
- maintenance ;
- unavailable.

Les statuts doivent être cohérents avec les locations et la maintenance.

Un équipement en maintenance ne doit pas pouvoir être attribué à une nouvelle location.

---

# 16. ESPACE CLIENT

L'espace client doit progressivement permettre :

- dashboard ;
- profil ;
- informations personnelles ;
- locations ;
- demandes ;
- commandes ;
- factures ;
- paiements ;
- réservations ;
- notifications ;
- historique ;
- support.

Le client ne doit accéder qu'à ses propres données.

---

# 17. ESPACE ADMINISTRATEUR

L'espace administrateur doit progressivement contenir :

- dashboard ;
- clients ;
- utilisateurs internes ;
- rôles ;
- permissions ;
- équipements ;
- catégories ;
- unités physiques ;
- locations ;
- réservations ;
- commandes ;
- produits ;
- stocks ;
- paiements ;
- factures ;
- documents ;
- maintenance ;
- notifications ;
- statistiques ;
- rapports ;
- activité ;
- paramètres.

---

# 18. TABLEAU DE BORD ADMIN

Le dashboard doit pouvoir afficher :

- chiffre d'affaires ;
- ventes ;
- locations ;
- demandes en attente ;
- commandes ;
- clients ;
- équipements disponibles ;
- équipements loués ;
- équipements en maintenance ;
- activité récente.

Les statistiques doivent être calculées à partir des données réelles.

Ne jamais afficher des statistiques fictives en production.

---

# 19. CLIENTS

L'administrateur doit pouvoir :

- consulter les clients ;
- rechercher ;
- filtrer ;
- consulter le détail ;
- consulter l'historique ;
- voir les locations ;
- voir les commandes ;
- voir les paiements ;
- voir les factures ;
- éventuellement suspendre ou désactiver un compte selon les règles métier.

---

# 20. AUTHENTIFICATION

Le système doit prévoir une authentification sécurisée.

Selon l'architecture existante, prévoir :

- inscription ;
- connexion ;
- déconnexion ;
- récupération de mot de passe ;
- vérification d'email si nécessaire ;
- gestion de session ;
- protection des routes.

Les secrets doivent être stockés dans les variables d'environnement.

---

# 21. AUTORISATION

Ne jamais se limiter à :

isAdmin = true

Il faut prévoir un système de rôles et permissions.

---

# 22. RÔLES

Prévoir une architecture pouvant supporter :

- super admin ;
- admin ;
- manager ;
- commercial ;
- comptable ;
- technicien ;
- client.

Les rôles peuvent évoluer selon les besoins réels de l'entreprise.

---

# 23. PERMISSIONS

Exemples :

users.view
users.create
users.edit
users.delete

equipment.view
equipment.create
equipment.edit
equipment.delete

rentals.view
rentals.create
rentals.validate
rentals.cancel

orders.view
orders.create
orders.edit
orders.cancel

payments.view
payments.manage

reports.view

Les permissions doivent être contrôlées côté serveur.

---

# 24. LOCATION — PRINCIPE IMPORTANT

Une demande de location n'est PAS automatiquement une location confirmée.

Flux :

Visiteur
→ équipement
→ bouton "Louer"
→ authentification si nécessaire
→ choix des dates
→ quantité
→ lieu
→ livraison si applicable
→ vérification de disponibilité
→ estimation
→ demande
→ validation administrateur
→ paiement si nécessaire
→ confirmation
→ location active
→ retour
→ clôture

---

# 25. STATUTS DES LOCATIONS

Prévoir au minimum :

- pending ;
- approved ;
- rejected ;
- awaiting_payment ;
- confirmed ;
- active ;
- returned ;
- completed ;
- cancelled.

Le changement de statut doit respecter les règles métier.

---

# 26. DISPONIBILITÉ DES LOCATIONS

Le système doit empêcher les conflits.

Exemple :

Une unité est réservée du 10 au 15.

Elle ne doit pas être disponible pour une autre location incompatible sur la même période.

La vérification doit être faite côté serveur.

Ne jamais se fier uniquement au calendrier affiché côté frontend.

---

# 27. LOCATION MULTIPLE

Le système doit pouvoir évoluer vers une location contenant plusieurs équipements.

Exemple :

Location #001

- 1 pelleteuse ;
- 2 compacteurs ;
- 1 nacelle.

Prévoir une relation de type :

rental
→ rental_items
→ equipment / equipment_units

---

# 28. VENTE

Flux :

Produit
→ panier
→ commande
→ authentification
→ informations client
→ validation
→ paiement
→ commande confirmée
→ traitement
→ livraison/retrait
→ terminée.

---

# 29. STATUTS DES COMMANDES

Prévoir :

- pending ;
- confirmed ;
- paid ;
- processing ;
- shipped ;
- delivered ;
- completed ;
- cancelled.

Les statuts doivent être cohérents avec les paiements et le stock.

---

# 30. STOCK

Le stock doit être géré de manière cohérente.

Prévoir :

- quantité disponible ;
- quantité réservée ;
- quantité vendue ;
- mouvements de stock ;
- historique.

Ne pas simplement décrémenter une valeur sans conserver la logique nécessaire au suivi.

---

# 31. PAIEMENTS

L'architecture doit pouvoir supporter des paiements.

Prévoir une entité de paiement avec par exemple :

- référence ;
- montant ;
- devise ;
- statut ;
- méthode ;
- date ;
- commande/location associée ;
- client ;
- référence externe si nécessaire.

Ne jamais considérer un paiement comme réussi uniquement parce que le frontend affiche "succès".

La confirmation doit être validée par le backend et/ou le prestataire concerné.

---

# 32. FACTURES ET DOCUMENTS

Prévoir la possibilité de gérer :

- devis ;
- contrats de location ;
- factures ;
- reçus ;
- bons de livraison ;
- documents de retour.

La génération PDF peut être ajoutée lorsque nécessaire.

---

# 33. MAINTENANCE

Le système doit pouvoir gérer :

- équipement concerné ;
- technicien ;
- date ;
- type d'intervention ;
- coût ;
- commentaire ;
- état ;
- prochaine maintenance.

Historique obligatoire pour les interventions importantes.

Un équipement en maintenance ne doit pas pouvoir être loué.

---

# 34. NOTIFICATIONS

Prévoir progressivement :

### Client

- demande reçue ;
- demande approuvée ;
- demande rejetée ;
- paiement confirmé ;
- facture disponible ;
- location proche de la fin.

### Administrateur

- nouvelle demande ;
- nouvelle commande ;
- nouveau client ;
- nouveau paiement ;
- retour d'équipement.

Commencer simplement si nécessaire.

---

# 35. JOURNAL D'ACTIVITÉ

Prévoir un système d'audit permettant de savoir :

- qui a effectué l'action ;
- quelle action ;
- sur quelle donnée ;
- quand ;
- éventuellement ancienne valeur ;
- nouvelle valeur.

Exemples :

- admin a validé une location ;
- commercial a modifié une commande ;
- technicien a enregistré une maintenance ;
- admin a changé un statut.

---

# 36. BASE DE DONNÉES

Architecture indicative :

users
roles
permissions
user_roles
role_permissions

customers

equipment_categories
equipment_types
equipment_units

rentals
rental_items

products
orders
order_items

payments

invoices
documents

maintenance
maintenance_records

notifications

activity_logs

settings

Cette liste n'est pas figée.

L'agent doit l'adapter à l'architecture réelle du projet.

---

# 37. INTÉGRITÉ DE LA BASE

Utiliser :

- clés étrangères ;
- contraintes ;
- index ;
- valeurs uniques lorsque nécessaire ;
- relations cohérentes ;
- transactions lorsque nécessaire.

Éviter les données orphelines.

Les opérations critiques doivent être atomiques lorsque nécessaire.

---

# 38. MIGRATIONS

Toute évolution importante de la structure de la base doit être effectuée avec une migration contrôlée.

Ne pas modifier manuellement la base de production sans raison.

Avant une migration destructive :

- analyser l'impact ;
- sauvegarder si nécessaire ;
- vérifier les dépendances ;
- demander confirmation lorsque l'action est risquée.

---

# 39. NEON POSTGRESQL

Neon PostgreSQL est la base de données principale.

La connexion doit être configurée via variables d'environnement.

Exemple conceptuel :

DATABASE_URL=...

Ne jamais écrire de vraie clé ou de vraie connexion directement dans le code.

---

# 40. VARIABLES D'ENVIRONNEMENT

Les secrets doivent rester dans :

.env.local
ou les variables d'environnement du fournisseur de déploiement.

Ne jamais :

- publier les secrets ;
- les mettre dans Git ;
- les afficher dans l'interface ;
- les hardcoder.

Vérifier également le fichier .gitignore.

---

# 41. API

Les API doivent :

- valider les données ;
- vérifier l'authentification ;
- vérifier les permissions ;
- gérer les erreurs ;
- retourner des réponses cohérentes ;
- éviter de divulguer des informations sensibles.

Ne jamais faire confiance aux données envoyées par le navigateur.

---

# 42. VALIDATION

Toute donnée importante doit être validée.

Exemples :

- dates ;
- quantités ;
- prix ;
- identifiants ;
- email ;
- permissions ;
- statuts ;
- informations de commande.

La validation frontend améliore l'expérience.

La validation backend garantit la sécurité.

Les deux sont nécessaires.

---

# 43. SÉCURITÉ

Vérifier notamment :

- authentification ;
- autorisation ;
- contrôle d'accès ;
- validation serveur ;
- injections ;
- exposition de données ;
- sessions ;
- cookies ;
- secrets ;
- routes API ;
- accès direct aux ressources ;
- uploads si présents.

Une route privée ne doit jamais devenir accessible simplement en connaissant son URL.

---

# 44. RESPONSIVE DESIGN

La plateforme doit fonctionner correctement sur :

- smartphone ;
- tablette ;
- ordinateur.

L'interface administrateur peut avoir une densité plus importante que le site public.

Les interfaces doivent rester utilisables sur petit écran.

---

# 45. UX

L'interface doit être :

- claire ;
- professionnelle ;
- cohérente ;
- rapide à comprendre ;
- adaptée au secteur du BTP.

Éviter :

- animations inutiles ;
- surcharge visuelle ;
- composants décoratifs sans fonction ;
- interfaces ressemblant à des templates génériques sans identité.

---

# 46. ÉTATS DES INTERFACES

Prévoir correctement :

- loading ;
- empty state ;
- error state ;
- success state ;
- disabled state ;
- confirmation ;
- validation.

Une page ne doit pas rester vide sans explication lorsqu'aucune donnée n'existe.

---

# 47. PAGINATION

Les grandes listes doivent pouvoir utiliser :

- pagination ;
- recherche ;
- filtres ;
- tri.

Exemples :

- clients ;
- équipements ;
- commandes ;
- locations ;
- paiements ;
- utilisateurs.

Éviter de charger inutilement des milliers de lignes côté client.

---

# 48. RECHERCHE

Les recherches importantes doivent être effectuées de manière efficace.

Ne pas récupérer toute la base puis filtrer uniquement dans le navigateur lorsque les volumes peuvent devenir importants.

---

# 49. SEO

Le site public doit être préparé pour le référencement naturel.

Prévoir :

- title ;
- meta description ;
- H1 ;
- H2 ;
- URLs propres ;
- alt des images ;
- canonical ;
- Open Graph ;
- sitemap.xml ;
- robots.txt ;
- données structurées lorsque pertinentes.

---

# 50. INDEXATION

Les pages publiques pertinentes peuvent être indexées.

Les pages suivantes ne doivent généralement pas être indexées :

- /admin ;
- /client ;
- authentification ;
- pages privées ;
- données personnelles.

L'indexation ne garantit jamais une première position dans Google.

---

# 51. SEO LOCAL

Le référencement doit prendre en compte le contexte géographique réel de l'entreprise.

Les contenus doivent rester naturels et utiles.

Ne pas créer de pages artificielles simplement pour répéter des mots-clés.

Si pertinent :

- Google Search Console ;
- Google Business Profile ;
- informations locales cohérentes ;
- coordonnées ;
- services ;
- zones d'intervention.

---

# 52. CONTENU SEO

Ne pas utiliser de keyword stuffing.

Les contenus doivent être :

- naturels ;
- utiles ;
- précis ;
- cohérents avec les services réels de l'entreprise.

Ne jamais inventer :

- certifications ;
- partenaires ;
- agences ;
- services ;
- zones d'intervention ;
- équipements inexistants.

---

# 53. PERFORMANCE

Vérifier :

- temps de chargement ;
- images ;
- JavaScript ;
- requêtes inutiles ;
- taille des bundles ;
- cache lorsque pertinent ;
- Server Components lorsque pertinent ;
- Core Web Vitals.

Ne pas optimiser prématurément.

Mesurer avant les optimisations importantes.

---

# 54. IMAGES

Les images doivent :

- être optimisées ;
- avoir des dimensions cohérentes ;
- utiliser un format adapté ;
- avoir un texte alternatif pertinent.

Ne pas charger inutilement des images gigantesques.

---

# 55. DOMAIN

Le domaine professionnel doit idéalement être détenu par l'entreprise.

Le compte registrar doit appartenir à l'entreprise.

Le développeur peut configurer le domaine mais ne doit pas devenir propriétaire de l'actif principal de l'entreprise.

---

# 56. HÉBERGEMENT

L'hébergement doit être choisi en fonction :

- du projet Next.js ;
- des performances ;
- de la base Neon ;
- des besoins futurs ;
- du budget.

Les coûts du domaine, de l'hébergement et des services tiers sont distincts du développement sauf accord contraire.

---

# 57. SERVICES TIERS

Les services externes peuvent inclure :

- paiement ;
- email ;
- stockage ;
- analytics ;
- hébergement ;
- domaine.

Ils doivent être clairement identifiés.

Leurs coûts ne doivent pas être implicitement inclus dans le prix de développement.

---

# 58. DONNÉES CLIENT

Les données clients doivent être protégées.

Un client ne doit jamais pouvoir :

- consulter un autre client ;
- modifier une autre commande ;
- consulter une autre facture ;
- accéder aux données administratives.

Les permissions doivent être appliquées côté serveur.

---

# 59. ADMINISTRATION DES ÉQUIPEMENTS

L'administrateur doit pouvoir :

- créer ;
- modifier ;
- désactiver ;
- catégoriser ;
- ajouter des images ;
- gérer les caractéristiques ;
- gérer les unités ;
- consulter la disponibilité ;
- consulter l'historique.

---

# 60. GESTION DES UNITÉS

Pour une machine avec plusieurs exemplaires, chaque unité doit pouvoir être suivie indépendamment.

Exemple :

CAT320-001
CAT320-002
CAT320-003

Cela permet :

- disponibilité réelle ;
- maintenance ;
- historique ;
- location ;
- localisation.

---

# 61. TARIFICATION

Les prix doivent être centralisés.

Pour une location, la tarification peut évoluer selon :

- équipement ;
- durée ;
- quantité ;
- conditions ;
- livraison ;
- autres paramètres métier.

Ne pas disperser les prix dans plusieurs composants frontend.

---

# 62. CALCULS FINANCIERS

Les calculs importants doivent être fiables.

Toujours éviter les calculs sensibles uniquement côté client.

Les montants finaux doivent être recalculés et vérifiés côté serveur.

---

# 63. HISTORIQUE

Les données importantes doivent conserver un historique lorsque nécessaire.

Exemples :

- changement de statut ;
- changement de prix ;
- maintenance ;
- location ;
- paiement ;
- modification d'une commande.

---

# 64. NOTION DE SOURCE DE VÉRITÉ

La base de données et le backend constituent la source de vérité.

Le frontend ne doit pas décider seul :

- qu'un équipement est disponible ;
- qu'un paiement est réussi ;
- qu'une commande est validée ;
- qu'une location est confirmée ;
- qu'un utilisateur possède une permission.

---

# 65. GESTION DES ERREURS

Les erreurs doivent être :

- capturées ;
- compréhensibles ;
- correctement journalisées ;
- sans exposition de données sensibles.

L'utilisateur final doit recevoir un message adapté.

L'administrateur doit disposer d'informations suffisantes pour diagnostiquer le problème.

---

# 66. LOGGING

Ajouter du logging utile pour les erreurs importantes.

Ne jamais logger :

- mots de passe ;
- tokens ;
- clés secrètes ;
- données sensibles inutiles.

---

# 67. TESTS

Tester progressivement :

- authentification ;
- autorisation ;
- CRUD ;
- création de location ;
- disponibilité ;
- conflits ;
- commandes ;
- stock ;
- paiements ;
- permissions ;
- maintenance ;
- accès aux données.

---

# 68. TESTS DE SÉCURITÉ

Vérifier notamment :

1. client A ne peut pas voir client B ;
2. client ne peut pas accéder à l'administration ;
3. utilisateur sans permission ne peut pas modifier une ressource ;
4. location impossible sur équipement indisponible ;
5. location impossible pendant une période déjà réservée ;
6. équipement en maintenance non louable ;
7. montant envoyé par le client non accepté aveuglément ;
8. données sensibles non exposées.

---

# 69. TYPESCRIPT

Éviter :

- any inutile ;
- types approximatifs ;
- interfaces incohérentes ;
- duplication excessive.

Corriger les erreurs TypeScript plutôt que les masquer.

---

# 70. ESLINT

Le code doit rester compatible avec la configuration ESLint du projet.

Ne pas désactiver massivement les règles simplement pour faire disparaître les erreurs.

---

# 71. BUILD

Après les modifications importantes, vérifier le build de production.

Une fonctionnalité n'est pas terminée si elle fonctionne uniquement en développement et casse au build.

---

# 72. GIT

Respecter l'historique du projet.

Avant une modification importante :

- comprendre les changements existants ;
- éviter d'écraser le travail précédent ;
- conserver les fichiers importants ;
- produire des modifications compréhensibles.

Ne pas supprimer arbitrairement l'historique.

---

# 73. FONCTIONNALITÉS FUTURES

L'architecture doit pouvoir évoluer vers :

- livraison ;
- adresses ;
- coupons ;
- promotions ;
- avis ;
- contrats ;
- signature ;
- reporting avancé ;
- export Excel/CSV ;
- génération PDF ;
- emails ;
- SMS ;
- WhatsApp ;
- intégration comptable ;
- analytics avancés.

Ne pas développer ces fonctionnalités automatiquement si elles ne font pas partie de la phase actuelle.

Préparer une architecture extensible sans développer inutilement.

---

# 74. NE PAS SUR-DÉVELOPPER

Ne pas ajouter automatiquement :

- fonctionnalités non demandées ;
- packages inutiles ;
- microservices inutiles ;
- systèmes complexes sans besoin ;
- fonctionnalités "pour faire joli".

Privilégier une solution simple, robuste et maintenable.

---

# 75. NE PAS FAIRE SEMBLANT

Une interface ne doit jamais simuler une fonctionnalité réelle.

Exemples interdits :

- faux paiement ;
- faux stock ;
- faux dashboard ;
- fausses statistiques ;
- faux statut ;
- fausse disponibilité ;
- faux utilisateur ;
- bouton qui ne fait rien présenté comme terminé.

Si une fonctionnalité n'est pas encore implémentée, elle doit être clairement identifiée comme telle.

---

# 76. DONNÉES DE TEST

Les données de démonstration peuvent être utilisées en développement.

Mais elles doivent être clairement distinguées des données réelles.

Ne jamais laisser des données fictives visibles comme données réelles en production.

---

# 77. ADMIN ET CLIENT

Les deux espaces doivent être séparés.

Client :

- voit ses données ;
- réalise ses demandes ;
- suit ses commandes ;
- suit ses locations.

Admin :

- gère l'ensemble ;
- valide ;
- modifie ;
- supervise ;
- consulte les statistiques.

---

# 78. ROUTES PRIVÉES

Toutes les routes privées doivent être protégées.

Ne pas uniquement masquer les liens dans le menu.

La protection doit également exister au niveau serveur.

---

# 79. PERMISSIONS SERVEUR

Exemple :

Un utilisateur peut voir une page "équipements".

Cela ne signifie pas automatiquement qu'il peut :

- supprimer ;
- modifier ;
- créer ;
- changer le prix.

Chaque action importante doit vérifier la permission correspondante.

---

# 80. MODIFICATION DES STATUTS

Les transitions doivent être contrôlées.

Exemple :

pending
→ approved

approved
→ awaiting_payment

awaiting_payment
→ confirmed

confirmed
→ active

active
→ returned

returned
→ completed

Une transition incohérente doit être refusée.

---

# 81. RETOUR D'ÉQUIPEMENT

Lors du retour :

- enregistrer la date ;
- enregistrer l'état ;
- éventuellement enregistrer les heures ;
- identifier les dommages si nécessaire ;
- mettre à jour la disponibilité ;
- créer les événements nécessaires ;
- clôturer correctement la location.

---

# 82. MAINTENANCE APRÈS RETOUR

Si un équipement nécessite une maintenance après retour :

location
→ returned
→ maintenance

Puis :

maintenance
→ available

selon l'état réel.

---

# 83. COMMANDES

Une commande doit avoir :

- référence ;
- client ;
- produits ;
- quantités ;
- prix ;
- montant total ;
- statut ;
- paiement ;
- dates ;
- historique.

---

# 84. RÉFÉRENCES

Les références de :

- commandes ;
- locations ;
- factures ;
- paiements ;
- équipements

doivent être uniques et générées de manière cohérente.

---

# 85. DOCUMENTATION

Documenter les éléments importants :

- architecture ;
- variables d'environnement ;
- base de données ;
- installation ;
- lancement local ;
- déploiement ;
- migrations ;
- fonctionnement des rôles ;
- fonctionnement des locations.

---

# 86. README

Le README du projet doit être maintenu lorsque nécessaire.

Il doit expliquer au minimum :

- installation ;
- variables d'environnement ;
- lancement ;
- build ;
- base de données ;
- migrations ;
- déploiement.

---

# 87. DÉPLOIEMENT

Avant production :

- vérifier les variables d'environnement ;
- vérifier la base ;
- vérifier les migrations ;
- vérifier l'authentification ;
- vérifier les routes ;
- vérifier le build ;
- vérifier les erreurs ;
- vérifier les permissions ;
- vérifier le domaine.

---

# 88. PRODUCTION

Ne jamais considérer le déploiement comme terminé uniquement parce que l'application est accessible.

Faire une vérification réelle :

- accueil ;
- connexion ;
- client ;
- admin ;
- catalogue ;
- location ;
- commande ;
- paiement si disponible ;
- responsive ;
- SEO ;
- erreurs.

---

# 89. MONITORING

Prévoir progressivement un suivi des erreurs et performances.

L'objectif est de pouvoir détecter :

- erreurs serveur ;
- erreurs frontend ;
- problèmes de base ;
- lenteurs ;
- problèmes de paiement.

---

# 90. PRIORITÉS

En cas de conflit entre :

design
et
fonctionnalité critique

la fonctionnalité critique passe en priorité.

En cas de conflit entre :

rapidité de développement
et
sécurité

la sécurité passe en priorité.

En cas de conflit entre :

nouvelle fonctionnalité
et
stabilité

la stabilité passe en priorité.

---

# 91. ORDRE DE DÉVELOPPEMENT

Suivre autant que possible cet ordre :

1. analyser le projet existant ;
2. architecture cible ;
3. modèle de données ;
4. configuration Neon ;
5. migrations ;
6. modèles/requêtes ;
7. authentification ;
8. rôles ;
9. permissions ;
10. espace client ;
11. équipements ;
12. unités physiques ;
13. disponibilité ;
14. locations ;
15. ventes ;
16. commandes ;
17. stock ;
18. administration ;
19. paiements ;
20. factures ;
21. maintenance ;
22. notifications ;
23. statistiques ;
24. journal d'activité ;
25. SEO ;
26. performance ;
27. tests ;
28. build ;
29. déploiement ;
30. vérification finale.

Cet ordre peut être adapté après analyse du projet réel.

---

# 92. PHASE 0 — AUDIT INITIAL

La première action du projet doit être un audit.

Ne pas commencer directement à coder.

L'audit doit identifier :

- structure ;
- stack ;
- architecture ;
- routes ;
- composants ;
- base ;
- auth ;
- API ;
- modèles ;
- variables ;
- fonctionnalités ;
- problèmes ;
- dette technique ;
- fonctionnalités manquantes.

---

# 93. RAPPORT D'AUDIT

Après l'analyse initiale, produire un résumé structuré :

## Existant

Ce qui fonctionne déjà.

## À conserver

Ce qui doit rester.

## À corriger

Les problèmes identifiés.

## À compléter

Les fonctionnalités partiellement développées.

## À développer

Les fonctionnalités nouvelles.

## Risques

Les points techniques ou métier à surveiller.

## Plan recommandé

L'ordre de travail proposé.

---

# 94. NE PAS INVENTER

Si une information n'est pas présente :

ne pas l'inventer.

Exemples :

- prix ;
- coordonnées ;
- noms ;
- équipements ;
- politiques ;
- délais ;
- moyens de paiement ;
- informations juridiques.

Utiliser un placeholder clairement identifiable ou demander l'information nécessaire.

---

# 95. QUESTIONS AU DÉVELOPPEUR

Si une décision bloque réellement l'implémentation :

poser une question précise.

Éviter les questions inutiles lorsque l'architecture permet une décision raisonnable.

Si plusieurs solutions sont possibles :

présenter les options et recommander la plus adaptée.

---

# 96. DÉCISIONS TECHNIQUES

Pour toute décision importante :

- expliquer brièvement le choix ;
- indiquer les conséquences ;
- éviter la complexité inutile.

Ne pas produire de longues explications si une décision simple suffit.

---

# 97. CONSERVATION DE L'EXISTANT

L'existant est prioritaire.

Avant de supprimer :

- analyser ;
- comprendre ;
- vérifier les dépendances ;
- vérifier l'utilisation ;
- vérifier l'impact.

Ne jamais effectuer de suppression destructive sans raison claire.

---

# 98. DESIGN

Le design doit correspondre à une entreprise BTP professionnelle.

Il doit transmettre :

- sérieux ;
- fiabilité ;
- robustesse ;
- professionnalisme ;
- efficacité.

Éviter un design excessivement "startup gadget".

---

# 99. IDENTITÉ VISUELLE

Utiliser l'identité existante de l'entreprise lorsqu'elle existe.

Ne pas imposer arbitrairement :

- couleurs ;
- logo ;
- typographie ;
- style.

Analyser d'abord le site existant et les éléments de marque disponibles.

---

# 100. RESPONSABILITÉ TECHNIQUE

Tu dois agir comme un agent de développement expérimenté :

- analyser avant d'agir ;
- signaler les risques ;
- protéger les données ;
- éviter les mauvaises pratiques ;
- vérifier le résultat ;
- ne pas déclarer une fonctionnalité terminée sans validation.

---

# 101. CRITÈRE DE TERMINAISON

Une fonctionnalité est considérée comme terminée uniquement si :

- elle est implémentée ;
- elle est connectée à la vraie logique ;
- les données sont persistées si nécessaire ;
- les permissions sont correctes ;
- les erreurs sont gérées ;
- elle fonctionne sur desktop ;
- elle fonctionne sur mobile lorsque pertinent ;
- elle ne casse pas l'existant ;
- les tests nécessaires ont été effectués ;
- le build reste fonctionnel.

---

# 102. RÈGLE SUR LE CODE

Le code doit être :

- lisible ;
- maintenable ;
- typé ;
- modulaire ;
- cohérent avec le projet ;
- suffisamment documenté lorsque nécessaire.

Ne pas sur-commenter le code.

Ne pas créer une architecture inutilement complexe.

---

# 103. RÈGLE SUR LES COMPOSANTS

Créer un composant lorsque :

- il est réellement réutilisable ;
- il améliore la lisibilité ;
- il représente une unité fonctionnelle claire.

Éviter :

- composants gigantesques ;
- duplication excessive ;
- abstraction inutile.

---

# 104. RÈGLE SUR LES DONNÉES

Les données métier doivent être centralisées.

Éviter de répéter :

- prix ;
- statuts ;
- catégories ;
- permissions ;
- règles métier

dans plusieurs endroits différents.

---

# 105. RÈGLE SUR LES FAUX SUCCÈS

Ne jamais répondre :

"fonctionnalité terminée"

si elle n'a pas été réellement vérifiée.

Si une partie n'est pas terminée :

indiquer précisément :

- ce qui fonctionne ;
- ce qui manque ;
- ce qui doit être testé ;
- ce qui dépend d'une information externe.

---

# 106. OBJECTIF FINAL

L'objectif final est d'obtenir une plateforme BTP professionnelle capable de gérer réellement :

SITE PUBLIC
+
CLIENTS
+
ÉQUIPEMENTS
+
UNITÉS PHYSIQUES
+
LOCATIONS
+
VENTES
+
COMMANDES
+
STOCK
+
PAIEMENTS
+
FACTURES
+
MAINTENANCE
+
NOTIFICATIONS
+
UTILISATEURS
+
RÔLES
+
PERMISSIONS
+
STATISTIQUES
+
AUDIT
+
SEO
+
DÉPLOIEMENT

Le système doit être fiable, sécurisé, évolutif et maintenable.

---

# 107. PREMIÈRE ACTION À EFFECTUER

IMPORTANT :

NE PAS COMMENCER PAR CODER.

Commencer par analyser complètement le projet existant.

Identifier notamment :

1. structure des dossiers ;
2. version de Next.js ;
3. version de React ;
4. configuration TypeScript ;
5. configuration ESLint ;
6. système de routing ;
7. composants ;
8. pages ;
9. API ;
10. authentification ;
11. base de données actuelle ;
12. ORM ou couche d'accès aux données ;
13. variables d'environnement ;
14. packages installés ;
15. fonctionnalités existantes ;
16. fonctionnalités incomplètes ;
17. problèmes éventuels ;
18. architecture actuelle ;
19. éléments à conserver ;
20. éléments à modifier.

Ensuite seulement :

- proposer l'architecture cible ;
- proposer le schéma de base de données ;
- identifier les migrations nécessaires ;
- définir le premier lot de développement ;
- commencer l'implémentation.

NE PAS FAIRE DE REFACTORING MASSIF SANS JUSTIFICATION.

NE PAS SUPPRIMER L'EXISTANT.

NE PAS CHANGER LA STACK.

NE PAS REMPLACER NEON PAR UNE AUTRE BASE.

NE PAS INVENTER DES INFORMATIONS MÉTIER.

NE PAS SIMULER DES FONCTIONNALITÉS.

TOUJOURS :

ANALYSER → PLANIFIER → IMPLÉMENTER → VÉRIFIER → TESTER → CORRIGER.

---

# 108. RÉFÉRENCE DE TRAVAIL

Ce fichier constitue la spécification fonctionnelle et technique principale du projet.

Lorsqu'une nouvelle instruction semble entrer en contradiction avec cette spécification :

1. identifier la contradiction ;
2. ne pas ignorer silencieusement la contrainte ;
3. expliquer brièvement le conflit ;
4. proposer une solution cohérente ;
5. privilégier la sécurité, l'intégrité des données et la stabilité du projet.

La spécification peut évoluer lorsque le besoin réel de l'entreprise évolue, mais les changements doivent être conscients et documentés.