#!/bin/bash

echo "🚀 Tests des APIs Aria Creative"
echo "================================"

# Variables
API_BASE="http://localhost:3001/api"

echo ""
echo "1. Health Check..."
curl -s "$API_BASE/health" | head -c 200
echo ""

echo ""
echo "2. GET Projects (Public)..."
curl -s "$API_BASE/projects" | head -c 200
echo ""

echo ""
echo "3. Admin Login..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_BASE/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aria-creative.com","password":"admin@aria25!!"}')

echo "$TOKEN_RESPONSE" | head -c 200
echo ""

# Extraire le token (méthode basique)
TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
  echo ""
  echo "4. GET Projects (Admin) avec token..."
  curl -s "$API_BASE/projects/admin" \
    -H "Authorization: Bearer $TOKEN" | head -c 200
  echo ""

  echo ""
  echo "5. GET Contact Messages (Admin)..."
  curl -s "$API_BASE/contact/admin" \
    -H "Authorization: Bearer $TOKEN" | head -c 200
  echo ""
fi

echo ""
echo "6. POST Contact Message..."
curl -s -X POST "$API_BASE/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","company":"Test Co","subject":"Test API","message":"Message de test pour vérifier API"}' | head -c 200
echo ""

echo ""
echo "✅ Tests terminés"
