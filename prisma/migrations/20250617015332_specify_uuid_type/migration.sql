-- Primero eliminar constraint para poder cambiar tipo
ALTER TABLE "Prices" DROP CONSTRAINT "Prices_pkey";

-- Cambiar tipo con cast explícito para no perder datos
ALTER TABLE "Prices" ALTER COLUMN "id" SET DATA TYPE UUID USING id::uuid;

-- Volver a crear la llave primaria
ALTER TABLE "Prices" ADD CONSTRAINT "Prices_pkey" PRIMARY KEY ("id");
