-- 1. Eliminar constraints de clave foránea para permitir cambios de tipo
ALTER TABLE "Images" DROP CONSTRAINT "Images_producto_id_fkey";
ALTER TABLE "Prices" DROP CONSTRAINT "Prices_producto_id_fkey";

-- 2. Eliminar la primary key para poder cambiar el tipo de `Products.id`
ALTER TABLE "Products" DROP CONSTRAINT "Products_pkey";

-- 3. Alterar columna `Products.id` a UUID usando cast
ALTER TABLE "Products"
ALTER COLUMN "id" TYPE UUID USING "id"::uuid;

-- 4. Alterar columnas foráneas a UUID usando cast
ALTER TABLE "Images"
ALTER COLUMN "producto_id" TYPE UUID USING "producto_id"::uuid;

ALTER TABLE "Prices"
ALTER COLUMN "producto_id" TYPE UUID USING "producto_id"::uuid;

-- 5. Restaurar la clave primaria
ALTER TABLE "Products"
    ADD CONSTRAINT "Products_pkey" PRIMARY KEY ("id");

-- 6. Restaurar claves foráneas
ALTER TABLE "Images"
    ADD CONSTRAINT "Images_producto_id_fkey"
        FOREIGN KEY ("producto_id") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Prices"
    ADD CONSTRAINT "Prices_producto_id_fkey"
        FOREIGN KEY ("producto_id") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
