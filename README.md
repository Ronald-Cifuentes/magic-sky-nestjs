# Magic Sky – Backend

API NestJS + GraphQL + Prisma para el ecommerce Magic Sky.

## Stack

- **NestJS** + GraphQL (code-first)
- **Prisma** + PostgreSQL
- **JWT** para autenticación
- **Wompi** (pagos Colombia)

---

## Ejecución local

### Requisitos

- Node.js 20+
- pnpm
- PostgreSQL 15+ (o Docker)

### 1. Variables de entorno

```bash
cp .env.example .env
```

Editar `.env` y configurar al menos:

- `DATABASE_URL` – Conexión a PostgreSQL
- `JWT_ACCESS_SECRET` – Mínimo 32 caracteres
- `JWT_REFRESH_SECRET` – Mínimo 32 caracteres

### 2. Base de datos

**Con Docker (recomendado):**

```bash
docker compose up -d
```

Esto inicia PostgreSQL en `localhost:5432` (usuario: `postgres`, contraseña: `postgres`, BD: `magic_sky`).

**PostgreSQL local:**

```bash
createdb magic_sky
```

### 3. Instalación

```bash
pnpm install
```

### 4. Migraciones y seed

```bash
pnpm prisma migrate deploy
pnpm prisma:seed
```

Opcional (importar datos):

```bash
pnpm import:products    # Desde recursos/products_export_ms.csv
pnpm import:customers    # Desde recursos/customers_export_ms.csv
```

### 5. Ejecutar

```bash
pnpm start:dev
```

API disponible en **http://localhost:4000/graphql**

---

## Ejecución con Docker Compose

Desde la carpeta **backend**:

```bash
cd backend
docker compose up -d
```

Inicia PostgreSQL + Backend. API en `http://localhost:4000/graphql`. Las migraciones se ejecutan automáticamente al iniciar. Para el frontend, ejecuta localmente `cd frontend && pnpm dev` o usa el docker-compose del frontend (requiere backend corriendo).

**Seed (datos demo):** Ejecutar una vez tras el primer arranque:

```bash
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/magic_sky?schema=public" pnpm prisma:seed
```

---

## Scripts

| Comando           | Descripción                    |
|-------------------|--------------------------------|
| `pnpm start:dev` | Desarrollo con hot-reload      |
| `pnpm build`     | Build de producción            |
| `pnpm prisma:migrate` | Crear migraciones          |
| `pnpm prisma migrate deploy` | Aplicar migraciones   |
| `pnpm prisma:seed` | Seed inicial                 |
| `pnpm import:products` | Importar productos CSV   |
| `pnpm import:customers` | Importar clientes CSV  |
| `./scripts/run-all.sh` | Inicia backend + frontend + PostgreSQL |
| `./scripts/test-e2e.sh` | Pruebas E2E (requiere servicios corriendo) |

---

## Credenciales demo

| Rol             | Email                   | Contraseña |
|-----------------|-------------------------|------------|
| Super Admin     | admin@magic-sky.com     | Admin123!  |
| Admin Comercial | comercial@magic-sky.com | Admin123!  |
