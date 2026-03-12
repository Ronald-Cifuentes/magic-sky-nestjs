#!/bin/bash
# Magic Sky - Pruebas E2E (requiere PostgreSQL y servicios corriendo)
set -e

echo "=== Magic Sky - Pruebas E2E ==="

# Verificar backend
echo -n "Verificando backend (localhost:4000)... "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/graphql -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' | grep -q "200"; then
  echo "OK"
else
  echo "FALLO - ¿Backend corriendo?"
  exit 1
fi

# Query featuredProducts
echo -n "Query featuredProducts... "
RES=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ featuredProducts(limit: 2) { id title } }"}')
if echo "$RES" | grep -q "featuredProducts"; then
  echo "OK"
  echo "$RES" | head -c 200
  echo "..."
else
  echo "FALLO"
  echo "$RES"
  exit 1
fi

# Admin login
echo -n "Admin login... "
LOGIN=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { adminLogin(email: \"admin@magic-sky.com\", password: \"Admin123!\") { accessToken user { email } } }"}')
if echo "$LOGIN" | grep -q "accessToken"; then
  echo "OK"
else
  echo "FALLO"
  echo "$LOGIN"
  exit 1
fi

# Verificar frontend
echo -n "Verificando frontend (localhost:5173)... "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ | grep -q "200"; then
  echo "OK"
else
  echo "FALLO - ¿Frontend corriendo?"
fi

echo ""
echo "=== Pruebas completadas ==="
