# Configuration Backend API pour le CRUD des Projets

## 🎯 Objectif
Cette configuration fournit un backend API fonctionnel pour le CRUD des projets sans système de fallback.

## 🚀 Démarrage rapide

### Étape 1: Installer les dépendances
```bash
cd api
npm install
```

### Étape 2: Démarrer l'API
```bash
npm start
```

L'API sera disponible sur `http://localhost:3001/api`

### Étape 3: Configurer le frontend
Définir la variable d'environnement pour le frontend:
```bash
export VITE_API_URL=http://localhost:3001/api
```

Ou créer un fichier `.env` à la racine du projet:
```
VITE_API_URL=http://localhost:3001/api
```

## 📋 Fonctionnalités disponibles

### Authentification Admin
- **POST** `/api/admin/login`
- Credentials: `admin@aria-creative.com` / `admin@aria25!!`

### CRUD Projects
- **GET** `/api/projects` - Projets publics (status: TERMINE)
- **GET** `/api/projects/admin` - Tous les projets (admin requis)
- **POST** `/api/projects` - Créer un projet
- **PUT** `/api/projects/:id` - Modifier un projet
- **DELETE** `/api/projects/:id` - Supprimer un projet
- **POST** `/api/projects/:id/status` - Changer le statut

### Messages de Contact
- **POST** `/api/contact` - Envoyer un message
- **GET** `/api/contact/admin` - Lister les messages (admin)
- **DELETE** `/api/contact/admin/:id` - Supprimer un message
- **PUT** `/api/contact/admin/:id/status` - Changer le statut

### Health Check
- **GET** `/api/health` - Statut de l'API

## 📊 Données initiales

L'API démarre avec 3 projets de démonstration:
- CGEPRO (TERMINE)
- ERIC RABY (TERMINE)  
- CONNECT TALENT (TERMINE)

## 🌐 Déploiement

### Option 1: Vercel
```bash
cd api
vercel --prod
```

### Option 2: Heroku
```bash
cd api
git init
heroku create aria-creative-api
git add .
git commit -m "Deploy API"
git push heroku main
```

### Option 3: Railway
```bash
cd api
railway login
railway init
railway up
```

## ✅ Test de l'API

Vérifier que l'API fonctionne:
```bash
curl http://localhost:3001/api/health
```

Test de connexion admin:
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aria-creative.com","password":"admin@aria25!!"}'
```

## 🔧 Variables d'environnement

### Pour le backend (optionnel):
```
PORT=3001
NODE_ENV=production
```

### Pour le frontend (obligatoire):
```
VITE_API_URL=http://localhost:3001/api
```

En production, remplacer par l'URL réelle de votre API déployée.

## 📝 Notes importantes

- ⚠️ Cette API utilise une base de données en mémoire (redémarre = données perdues)
- ✅ Parfait pour le développement et les démonstrations
- 🔒 Pour la production, remplacer par une vraie base de données (PostgreSQL, MySQL, etc.)
- 🚫 Aucun système de fallback - l'API doit être accessible pour que le CRUD fonctionne

## 🐛 Dépannage

### Erreur "Failed to fetch"
- Vérifier que l'API est démarrée sur le bon port
- Vérifier la variable `VITE_API_URL`
- Vérifier les paramètres CORS

### Erreur d'authentification
- Vérifier les credentials admin
- Vérifier que l'endpoint `/api/admin/login` répond

### Projets ne s'affichent pas
- Vérifier l'endpoint `/api/projects/admin`
- Vérifier le token d'authentification
