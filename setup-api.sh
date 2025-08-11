#!/bin/bash

echo "🚀 Configuration de l'API backend pour le CRUD..."

# Installer les dépendances de l'API
cd api
npm install

echo "✅ Dépendances installées"

# Démarrer l'API en mode développement
echo "🔧 Démarrage de l'API sur le port 3001..."
npm run dev &

API_PID=$!
echo "📊 API PID: $API_PID"

# Attendre que l'API soit prête
sleep 3

# Tester l'API
echo "🧪 Test de l'API..."
curl -f http://localhost:3001/api/health || {
  echo "❌ L'API ne répond pas"
  kill $API_PID
  exit 1
}

echo "✅ API backend configurée et fonctionnelle!"
echo "🌐 URL API: http://localhost:3001/api"
echo "👤 Admin: admin@aria-creative.com / admin@aria25!!"

# Garder l'API en vie
wait $API_PID
