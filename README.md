# TaskD — Identity Service (`identity-service`)

Service d'authentification, d'inscription et de gestion des comptes utilisateurs pour la plateforme web de délégation de tâches **TaskD** (marché UEMOA).

---

## 📋 Table des matières

1. [Présentation et périmètre](#1-présentation-et-périmètre)
2. [Stack technique](#2-stack-technique)
3. [Architecture logicielle](#3-architecture-logicielle)
4. [Prérequis](#4-prérequis)
5. [Installation et démarrage rapide](#5-installation-et-démarrage-rapide)
6. [Variables d'environnement](#6-variables-denvironnement)
7. [Commandes disponibles (Makefile)](#7-commandes-disponibles-makefile)
8. [Documentation de l'API REST](#8-documentation-de-lapi-rest)
9. [Règles de sécurité et gestion des erreurs](#9-règles-de-sécurité-et-gestion-des-erreurs)
10. [Conventions de développement](#10-conventions-de-développement)

---

## 1. Présentation et périmètre

Dans l'architecture de **TaskD**, `identity-service` est responsable du domaine **Identité et Accès**. Il possède exclusivement le schéma PostgreSQL `identity` et expose une API REST préfixée par `/api/v1`.

### User Stories couvertes (Sprint actuel)
* **US-03 — S'inscrire comme délégueur :** Création d'un compte avec le rôle `delegator`.
* **US-04 — S'inscrire comme collaborateur :** Création d'un compte avec le rôle `collaborator`.
* **US-05 — Se connecter :** Authentification par email ou nom d'utilisateur, génération d'un jeton JWT (validité 7 jours) et protection contre la force brute.

---

## 2. Stack technique

| Composant | Technologie | Rôle |
| :--- | :--- | :--- |
| **Langage** | TypeScript (mode `strict`) | Typage statique de bout en bout |
| **Framework Backend** | NestJS (sur Express) | Architecture modulaire, injection de dépendances, validation |
| **Base de données** | PostgreSQL 18 | Persistance relationnelle (schéma dédié `identity`) |
| **Accès aux données** | `pg` (`node-postgres`) | Requêtes SQL paramétrées natives (sans ORM) |
| **Validation** | `class-validator` & `zod` | Validation des DTO entrants et des variables d'environnement |
| **Sécurité** | `bcrypt` & `@nestjs/jwt` | Hachage des mots de passe et signature des jetons JWT |
| **Documentation API** | OpenAPI 3 / Swagger UI | Spécification interactive des routes |
| **Conteneurisation** | Docker & Docker Compose | Orchestration de la base de données locale |
| **Gestionnaire de paquets** | `pnpm` | Installation rapide et lockfile déterministe |

---

## 3. Architecture logicielle

### Architecture en 3 couches (n-tiers)
Le code est strictement découpé en couches unidirectionnelles afin d'isoler les règles métier de l'infrastructure HTTP et SQL :

```text
Client (Front / Swagger)
   │
   ▼
[ Contrôleur ]  ──► Reçoit la requête HTTP, valide les DTO, formate la réponse
   │
   ▼
[ Service ]     ──► Applique les règles métier, hache les mots de passe, lève des DomainError
   │
   ▼
[ Repository ]  ──► Exécute les requêtes SQL paramétrées ($1, $2...) via pg
   │
   ▼
PostgreSQL (schéma `identity`)
```

### Arborescence du projet

```text
identity-service/
├── migrations/
│   └── 001_init_identity.sql        # Script DDL initial (schéma identity, table users)
├── src/
│   ├── auth/
│   │   ├── dto/
│   │   │   ├── auth-response.dto.ts # DTO de sortie (exclut le hash du mot de passe)
│   │   │   ├── login.dto.ts         # Validation de la connexion (US-05)
│   │   │   └── register.dto.ts      # Validation de l'inscription (US-03 / US-04)
│   │   ├── auth.controller.ts       # Routes HTTP /api/v1/auth/*
│   │   ├── auth.errors.ts           # Exceptions métier du domaine Auth
│   │   ├── auth.module.ts           # Configuration du module Auth & JWT
│   │   └── auth.service.ts          # Règles métier (inscription, login, blocage 5 échecs)
│   ├── common/
│   │   ├── domain-error.filter.ts   # Traduction des DomainError en réponses RFC 9457
│   │   └── domain.error.ts          # Classe de base des erreurs métier
│   ├── config/
│   │   └── env.ts                   # Validation Zod des variables d'environnement au démarrage
│   ├── database/
│   │   └── database.module.ts       # Fournisseur global du Pool de connexions PostgreSQL
│   ├── users/
│   │   ├── user.types.ts            # Modèles et types métier User
│   │   ├── users.module.ts          # Module de gestion des données utilisateurs
│   │   └── users.repository.ts      # Requêtes SQL sur identity.users
│   ├── app.module.ts                # Module racine de l'application
│   └── main.ts                      # Point d'entrée (préfixe global, Pipes, Swagger)
├── .env.example                     # Modèle des variables d'environnement
├── docker-compose.yml               # Conteneur PostgreSQL 18 Alpine
├── Makefile                         # Automatisation des tâches de développement
└── package.json                     # Dépendances et scripts pnpm
```

---

## 4. Prérequis

Assurez-vous d'avoir installé sur votre machine :
* **Node.js** (v20 ou v22+)
* **pnpm** (`corepack enable` ou `npm install -g pnpm`)
* **Docker** et **Docker Compose** (v2+)
* **GNU Make** (préinstallé sur Linux/macOS)

---

## 5. Installation et démarrage rapide

### Option A : Démarrage en une commande (Recommandé)
```bash
git clone <URL_DU_DEPOT>
cd identity-service
make bootstrap
```
Cette commande installe les dépendances via `pnpm`, copie `.env.example` vers `.env`, démarre le conteneur PostgreSQL 18 (et applique automatiquement `migrations/001_init_identity.sql`), puis lance le serveur NestJS en mode développement.

### Option B : Démarrage manuel étape par étape
```bash
# 1. Installer les dépendances
pnpm install

# 2. Configurer l'environnement local
cp .env.example .env

# 3. Démarrer la base de données PostgreSQL
docker compose up -d postgres

# 4. Lancer l'application en mode watch
pnpm start:dev
```

Une fois démarré :
* **API REST :** `http://localhost:3000/api/v1`
* **Documentation interactive Swagger UI :** `http://localhost:3000/api/docs` *(désactivée automatiquement lorsque `NODE_ENV=production`)*.

---

## 6. Variables d'environnement

Le service valide strictement ses variables d'environnement au démarrage via **Zod** (`src/config/env.ts`) et refuse de démarrer si une variable requise est absente ou invalide.

| Variable | Description | Exemple / Valeur par défaut |
| :--- | :--- | :--- |
| `NODE_ENV` | Environnement d'exécution (`development`, `test`, `production`) | `development` |
| `PORT` | Port d'écoute du serveur HTTP | `3000` |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL | `postgres://taskd:taskd_dev_password@localhost:5432/taskd` |
| `JWT_SECRET` | Clé secrète de signature des jetons JWT (min. 10 caractères) | `super-secret-key-for-taskd-dev-only-change-in-prod` |

---

## 7. Commandes disponibles (Makefile)

Exécutez `make help` à la racine pour afficher l'aide complète :

### Développement
* `make bootstrap` : Installation complète initiale (dépendances + `.env` + DB + serveur).
* `make dev` : Démarre PostgreSQL (attend qu'il soit prêt) et lance NestJS en mode `watch`.
* `make dev-down` : Arrête les conteneurs Docker.
* `make dev-logs` : Affiche les journaux des conteneurs en temps réel.
* `make dev-clean` : Supprime les conteneurs, réseaux et volumes (**efface les données locales**).

### Base de données
* `make db-up` / `make db-down` : Démarre ou arrête uniquement PostgreSQL.
* `make db-migrate` : Exécute manuellement tous les scripts `.sql` du dossier `migrations/`.
* `make db-reset` : Réinitialise complètement la base de données à partir de zéro.
* `make db-shell` : Ouvre un terminal interactif `psql` directement dans le conteneur.

### Qualité et Tests
* `make build` : Compile le projet TypeScript dans `dist/`.
* `make lint` : Vérifie le style et les règles ESLint.
* `make format` : Formate automatiquement le code avec Prettier.
* `make test` : Exécute la suite de tests automatisés.

---

## 8. Documentation de l'API REST

Toutes les routes sont préfixées par `/api/v1`.

### `POST /api/v1/auth/register` — Inscription (US-03 / US-04)
Crée un nouveau compte utilisateur (`delegator` ou `collaborator`) et retourne un jeton d'accès.

**Corps de la requête (`application/json`) :**
```json
{
  "lastName": "DOSSOU",
  "firstName": "Fréjuste",
  "phone": "+2290197000000",
  "email": "frejuste@example.com",
  "profession": "Développeur Backend",
  "password": "TaskD2026",
  "role": "collaborator",
  "acceptTerms": true
}
```

**Réponses possibles :**
* `201 Created` : Compte créé. Retourne `{ "accessToken": "...", "user": { ... } }`.
* `400 Bad Request` : Erreur de validation (email invalide, téléphone non international, mot de passe < 8 caractères ou sans lettre/chiffre, CGU non cochées).
* `409 Conflict` : L'adresse email ou le numéro de téléphone est déjà associé à un compte.

---

### `POST /api/v1/auth/login` — Connexion (US-05)
Authentifie un utilisateur via son email (insensible à la casse) ou son nom d'utilisateur.

**Corps de la requête (`application/json`) :**
```json
{
  "identifier": "frejuste@example.com",
  "password": "TaskD2026"
}
```

**Réponses possibles :**
* `200 OK` : Authentification réussie. Retourne `{ "accessToken": "...", "user": { ... } }`.
