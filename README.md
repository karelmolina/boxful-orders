# Boxful Orders API

API RESTful construida con **NestJS**, **Prisma** y **MongoDB** para la gestión de órdenes y usuarios.

## Stack

| Tecnología | Uso |
|------------|-----|
| NestJS | Framework backend |
| Prisma | ORM y modelado de datos |
| MongoDB | Base de datos NoSQL |
| Docker | Containerización de MongoDB |
| Jest | Tests unitarios y e2e |
| pnpm | Gestor de paquetes |

## Requisitos

- Node.js >= 18
- pnpm
- Docker (para MongoDB local)

## Instalación

```bash
# 1. Clonar
git clone https://github.com/karelmolina/boxful-orders.git
cd boxful-orders

# 2. Dependencias
pnpm install

# 3. Variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Levantar MongoDB
docker compose up -d

# 5. Seeders (poblar base de datos)
pnpm prisma db seed

# 6. Iniciar servidor
pnpm run start:dev
```

El API estará disponible en `http://localhost:3000`

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm run start:dev` | Modo desarrollo con hot reload |
| `pnpm run start:prod` | Modo producción |
| `pnpm run test` | Tests unitarios |
| `pnpm run test:e2e` | Tests end-to-end |
| `pnpm run test:cov` | Cobertura de tests |
| `pnpm prisma db seed` | Ejecutar seeders |

## Tests

```bash
# Unitarios
pnpm run test

# E2E
pnpm run test:e2e

# Cobertura
pnpm run test:cov
```

## Estructura del proyecto

```
src/
├── modules/        # Módulos de dominio (orders, users)
├── common/         # Utilidades, filtros, interceptores
├── prisma/         # Schema y seeders
└── main.ts         # Entry point
```

## Esfuerzos extra

- ✅ Docker Compose para MongoDB listo para usar
- ✅ Seeders automatizados para demo data
- ✅ Tests unitarios y E2E con Jest
- ✅ Configuración de ESLint y Prettier
