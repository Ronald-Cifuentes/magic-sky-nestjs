#!/bin/bash
# Magic Sky - Script para ejecutar todo el stack (backend + frontend)
# Ejecutar desde backend/: ./scripts/run-all.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$BACKEND_DIR/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "=== Magic Sky - Iniciando ==="

# 1. Verificar PostgreSQL
if ! pg_isready -h localhost -p 5432 2>/dev/null; then
  echo ""
  echo "⚠️  PostgreSQL no está corriendo en localhost:5432"
  echo ""
  echo "Opciones:"
  echo "  A) Iniciar Docker y ejecutar: cd backend && docker compose up -d"
  echo "  B) Iniciar PostgreSQL local: brew services start postgresql@15"
  echo "  C) Usar Postgres.app o tu instalación de PostgreSQL"
  echo ""
  read -p "¿Deseas intentar iniciar PostgreSQL con Docker? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$BACKEND_DIR" && docker compose up -d
    echo "Esperando a que PostgreSQL inicie..."
    sleep 5
  else
    echo "Por favor inicia PostgreSQL manualmente y vuelve a ejecutar este script."
    exit 1
  fi
fi

# 2. Migraciones y seed
echo ""
echo "=== Ejecutando migraciones ==="
cd "$BACKEND_DIR"
pnpm prisma migrate deploy
pnpm prisma:seed
echo ""
echo "=== Importando productos desde CSV ==="
pnpm import:products 2>/dev/null || echo "(Opcional: productos ya importados o CSV no encontrado)"
pnpm import:customers 2>/dev/null || echo "(Opcional: clientes ya importados)"

# 3. Iniciar backend
echo ""
echo "=== Iniciando backend (puerto 4000) ==="
cd "$BACKEND_DIR"
pnpm start:dev &
BACKEND_PID=$!

# 4. Esperar a que el backend esté listo
echo "Esperando a que el backend inicie..."
for i in {1..30}; do
  if curl -s http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query":"{ __typename }"}' 2>/dev/null | grep -q "data"; then
    echo "Backend listo."
    break
  fi
  sleep 1
done

# 5. Iniciar frontend
echo ""
echo "=== Iniciando frontend (puerto 5173) ==="
cd "$FRONTEND_DIR"
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "✅ Magic Sky está corriendo"
echo ""
echo "  Storefront: http://localhost:5173"
echo "  GraphQL:    http://localhost:4000/graphql"
echo "  Admin:      http://localhost:5173/admin"
echo ""
echo "  Credenciales admin: admin@magic-sky.com / Admin123!"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"
echo "=========================================="

wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
