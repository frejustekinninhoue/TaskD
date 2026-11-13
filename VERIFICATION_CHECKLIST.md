# TaskD — Identity Service — Verification Checklist

Exécution de chaque bloc dans l'ordre depuis la racine du projet. Pour chaque commande, le résultat attendu est indiqué ci-dessous.

> **Répertoire de travail :** `~/Documents/identity-service`

---

## BLOC 0 — Démarrage de la stack (PostgreSQL 18 + NestJS)

### 0.1 Lancer la base de données PostgreSQL
```bash
cd ~/Documents/identity-service
make db-up
```

**Résultat attendu :**
```text
▶ Starting PostgreSQL container...
 ✔ Container taskd-postgres Running
▶ Waiting for PostgreSQL...
  ✅ Database ready on port 5432
```

### 0.2 Lancer le serveur NestJS (laisser tourner dans ce terminal)
```bash
make dev
```

**Résultat attendu :**
```text
[Nest] ... LOG [InstanceLoader] AppModule dependencies initialized
[Nest] ... LOG [InstanceLoader] DatabaseModule dependencies initialized
[Nest] ... LOG [InstanceLoader] AuthModule dependencies initialized
[Nest] ... LOG [NestApplication] Nest application successfully started
```

*(Ouvrir un second terminal à la racine `~/Documents/identity-service` pour exécuter tous les blocs suivants).*

---

## BLOC 1 — Vérification de la base de données PostgreSQL (Schéma & Table)

```bash
docker compose exec -T postgres psql -U taskd -d taskd -c "\dt identity.*"
```

**Résultat attendu :**
```text
          List of relations
  Schema  | Name  | Type  | Owner
----------+-------+-------+-------
 identity | users | table | taskd
```

---

## BLOC 2 — Compilation TypeScript (0 erreur)

```bash
make build
```

**Résultat attendu :**
Aucune sortie d'erreur et génération du dossier `dist/` avec exit code `0`.

---

## BLOC 3 — Tests automatisés (Vitest + Supertest en Given / When / Then)

```bash
make test
```

**Résultat attendu :**
```text
 ✓ test/auth.e2e-spec.ts (4 tests)
   ✓ US-03 / US-04 / US-05 — Authentication API (HTTP) (4)
     ✓ Given valid delegator data, When registering, Then the API responds 201 Created
     ✓ Given an email already registered, When registering again, Then the API responds 409 Conflict
     ✓ Given a registered user, When logging in with valid credentials, Then the API responds 200 OK
     ✓ Given a registered user, When logging in with a wrong password, Then the API responds 401 Unauthorized

 Test Files  1 passed (1)
      Tests  4 passed (4)
```

---

## BLOC 4 — Swagger UI & Spécification OpenAPI

### 4.1 Vérifier que l'interface Swagger UI répond
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/docs
```

**Résultat attendu :**
```text
200
```

### 4.2 Lister toutes les routes REST enregistrées dans OpenAPI
```bash
curl -s http://localhost:3000/api/docs-json | python3 -c "
import json, sys
paths = json.load(sys.stdin)['paths']
for p in sorted(paths): print(p)
"
```

**Résultat attendu :**
```text
/api/v1/auth/login
/api/v1/auth/register
```

---

## BLOC 5 — Tests fonctionnels des API REST en direct (`curl`)

*(Réinitialiser la table avant le test manuel si besoin)* :
```bash
docker compose exec -T postgres psql -U taskd -d taskd -c "TRUNCATE TABLE identity.users;"
```

### 5.1 Création de compte valide (`POST /api/v1/auth/register` — US-03 / US-04)
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "lastName": "DOSSOU",
    "firstName": "Frejuste",
    "phone": "+2290197000000",
    "email": "frejuste@example.com",
    "profession": "Developpeur Backend",
    "password": "TaskD2026",
    "role": "collaborator",
    "acceptTerms": true
  }'
```

**Résultat attendu :**
* `HTTP_STATUS:201`
* JSON contenant `"accessToken"` et `"user"` (sans aucun champ `"password"` ni `"passwordHash"`).

### 5.2 Inscription avec email en doublon (`409 Conflict` — RFC 9457)
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "lastName": "DOSSOU",
    "firstName": "Autre",
    "phone": "+2290197999999",
    "email": "frejuste@example.com",
    "profession": "Designer",
    "password": "TaskD2026",
    "role": "delegator",
    "acceptTerms": true
  }'
```

**Résultat attendu :**
* `HTTP_STATUS:409`
* JSON au format RFC 9457 : `"type": "https://taskd.example"`.

### 5.3 Connexion valide (`POST /api/v1/auth/login` — US-05)
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "FREJUSTE@example.com",
    "password": "TaskD2026"
  }'
```

**Résultat attendu :**
* `HTTP_STATUS:200`
* JSON contenant `"accessToken"` et `"user"`.

### 5.4 Connexion avec mauvais mot de passe (`401 Unauthorized` — US-05)
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "frejuste@example.com",
    "password": "MauvaisPassword1"
  }'
```

**Résultat attendu :**
* `HTTP_STATUS:401`
* Message générique : `"title": "Identifiants incorrects."`.

---

## BLOC 6 — Vérifications d'architecture et de sécurité (Audits rapides)

### 6.1 Aucune concaténation SQL (requêtes paramétrées `$1`, `$2` uniquement)
```bash
grep -rn "pool.query" src/
```

**Résultat attendu :**
Toutes les requêtes utilisent `$1`, `$2`, etc. Aucune interpolation `${...}` dans les chaînes SQL.

### 6.2 Validation stricte activée (`whitelist` + `forbidNonWhitelisted`)
```bash
grep -n "forbidNonWhitelisted" src/main.ts
```

**Résultat attendu :**
```text
      forbidNonWhitelisted: true,
```

### 6.3 Swagger désactivé en production
```bash
grep -n "NODE_ENV !== 'production'" src/main.ts
```

**Résultat attendu :**
Une ligne confirmant que `SwaggerModule.setup` est encadré par `if (process.env.NODE_ENV !== 'production')`.

---

## BLOC 7 — Build de l'image Docker de production

```bash
docker build -t taskd-identity-service:latest .
```

**Résultat attendu :**
```text
 => => naming to docker.io/library/taskd-identity-service:latest
```
*(Build complet en 13/13 étapes sans erreur).*

---

## BLOC 8 — Vérification Git avant push

```bash
git status
```

**Résultat attendu :**
* Le fichier `.env` **n'apparaît pas** dans les fichiers suivis (ignoré par `.gitignore`).
* Les fichiers `.env.example`, `Dockerfile`, `Makefile`, `README.md`, `VERIFICATION_CHECKLIST.md`, `migrations/`, `src/` et `test/` sont propres et prêts à être commités.
