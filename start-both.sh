#!/bin/bash

# Script pour démarrer à la fois le frontend et le backend

echo "🚀 Démarrage du backend..."
cd backend && npm run start:logs &
BACKEND_PID=$!

sleep 5

echo "🚀 Démarrage du frontend..."
cd .. && npm run dev &
FRONTEND_PID=$!

echo "✅ Backend PID: $BACKEND_PID"
echo "✅ Frontend PID: $FRONTEND_PID"

# Attendre que l'utilisateur appuie sur Ctrl+C
trap 'echo "🛑 Arrêt des services..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT

wait
