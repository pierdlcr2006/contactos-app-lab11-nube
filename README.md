# CRUD de Contactos

Aplicacion NestJS que sirve backend y frontend en el mismo contenedor. Incluye:

- Login de administrador con JWT.
- CRUD de contactos protegido por token.
- UI web estatica servida desde Nest.
- PostgreSQL con Docker Compose.
- Seed inicial de usuario admin cuando la aplicacion ya conecto con la BD.

## Credenciales iniciales

```txt
Email: admin@app.com
Password: admin123
```

Puedes cambiarlas en `docker-compose.yml` o usando las variables de `.env.example`.

## Ejecutar con Docker

```bash
docker compose up --build
```

Luego abre:

```txt
http://localhost:3000
```

La app espera a que PostgreSQL este saludable. Despues Nest conecta con la BD y ejecuta el seed si no existen usuarios.

## Ejecutar en desarrollo

```bash
pnpm install
pnpm start:dev
```

Para desarrollo local necesitas una BD PostgreSQL y estas variables:

```bash
cp .env.example .env
```

## Endpoints principales

```txt
GET    /api/health
POST   /api/auth/login
GET    /api/auth/me
GET    /api/contacts
POST   /api/contacts
GET    /api/contacts/:id
PATCH  /api/contacts/:id
DELETE /api/contacts/:id
```

## Verificacion

```bash
pnpm lint
pnpm build
pnpm test
pnpm test:e2e
```
