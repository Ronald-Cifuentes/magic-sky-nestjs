-- CreateEnum
CREATE TYPE "CmsPageKind" AS ENUM ('SYSTEM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CmsSystemKey" AS ENUM ('HOME', 'CATALOG', 'CART', 'CMS_GENERIC');

-- CreateTable
CREATE TABLE "CmsPageDefinition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "route_path" TEXT NOT NULL,
    "page_kind" "CmsPageKind" NOT NULL,
    "system_key" "CmsSystemKey",
    "published" BOOLEAN NOT NULL DEFAULT false,
    "deletable" BOOLEAN NOT NULL DEFAULT true,
    "layout_json" JSONB NOT NULL,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsPageDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CmsPageDefinition_slug_key" ON "CmsPageDefinition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CmsPageDefinition_route_path_key" ON "CmsPageDefinition"("route_path");

-- CreateIndex
CREATE INDEX "CmsPageDefinition_route_path_idx" ON "CmsPageDefinition"("route_path");

-- CreateIndex
CREATE INDEX "CmsPageDefinition_page_kind_idx" ON "CmsPageDefinition"("page_kind");

-- Seed core pages (HOME, CATALOG, CART)
INSERT INTO "CmsPageDefinition" ("id", "title", "slug", "route_path", "page_kind", "system_key", "published", "deletable", "layout_json", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'Inicio', 'home', '/', 'SYSTEM', 'HOME', true, false, '{"pageVersion":1,"root":[{"id":"hero","type":"HeroSection","props":{},"zone":"main","children":[]},{"id":"products","type":"FeaturedProducts","props":{"limit":12},"zone":"main","children":[]}]}', NOW(), NOW()),
  (gen_random_uuid(), 'Catálogo', 'catalogo', '/catalogo', 'SYSTEM', 'CATALOG', true, false, '{"pageVersion":1,"root":[{"id":"catalog","type":"ProductGrid","props":{},"zone":"main","children":[]}]}', NOW(), NOW()),
  (gen_random_uuid(), 'Carrito', 'carrito', '/carrito', 'SYSTEM', 'CART', true, false, '{"pageVersion":1,"root":[{"id":"cart","type":"CartContent","props":{},"zone":"main","children":[]}]}', NOW(), NOW());

-- Migrate existing CmsPage to CmsPageDefinition as CUSTOM
INSERT INTO "CmsPageDefinition" ("id", "title", "slug", "route_path", "page_kind", "system_key", "published", "deletable", "layout_json", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  p."title",
  p."slug",
  '/' || p."slug",
  'CUSTOM',
  'CMS_GENERIC',
  p."published",
  true,
  jsonb_build_object('pageVersion', 1, 'root', jsonb_build_array(jsonb_build_object('id', 'content_' || p."id", 'type', 'HtmlContent', 'props', jsonb_build_object('html', COALESCE(p."content", '')), 'zone', 'main', 'children', '[]'::jsonb))),
  p."created_at",
  p."updated_at"
FROM "CmsPage" p
WHERE '/' || p."slug" NOT IN ('/', '/catalogo', '/carrito');
