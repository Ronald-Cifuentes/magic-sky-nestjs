# Magic Sky – Backend

API NestJS + GraphQL + Prisma para el ecommerce Magic Sky.

## Stack

- **NestJS** + GraphQL (code-first)
- **Prisma** + PostgreSQL
- **JWT** para autenticación
- **Wompi** (pagos Colombia)

## Variables de entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Configura `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` y las keys de Wompi.

## Instalación

```bash
pnpm install
```

## Base de datos

**Docker (recomendado):**
```bash
docker compose up -d
```

**PostgreSQL local:**
```bash
createdb magic_sky
```

## Migraciones y seed

```bash
pnpm prisma migrate deploy
pnpm prisma:seed
pnpm import:products    # Desde recursos/products_export_ms.csv
pnpm import:customers   # Desde recursos/customers_export_ms.csv
```

## Ejecución

```bash
pnpm start:dev
```

API en http://localhost:4000/graphql

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm start:dev` | Desarrollo con hot-reload |
| `pnpm prisma:migrate` | Migraciones |
| `pnpm prisma:seed` | Seed inicial |
| `pnpm import:products` | Importar productos CSV |
| `pnpm import:customers` | Importar clientes CSV |
| `./scripts/run-all.sh` | Inicia backend + frontend + PostgreSQL |
| `./scripts/test-e2e.sh` | Pruebas E2E (requiere servicios corriendo) |

## Credenciales demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Super Admin | admin@magic-sky.com | Admin123! |
| Admin Comercial | comercial@magic-sky.com | Admin123! |
