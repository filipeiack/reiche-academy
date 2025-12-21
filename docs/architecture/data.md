# Data - Arquitetura (AS-IS)

Documentação baseada exclusivamente no código presente.

## Banco de Dados
- PostgreSQL ([backend/README.md](backend/README.md), [docker-compose.yml](docker-compose.yml))
- Migrations versionadas com Prisma ([backend/prisma/schema.prisma](backend/prisma/schema.prisma))

## Modelos
- Empresa, Usuario, Pilar, Rotina, Diagnostico, Criticidade, PerfilUsuario, etc ([backend/prisma/schema.prisma](backend/prisma/schema.prisma), [backend/DATA_MODEL.md](backend/DATA_MODEL.md))
- Relacionamentos e enums definidos em [backend/prisma/schema.prisma](backend/prisma/schema.prisma)

## Infraestrutura de Dados
- Redis configurado ([docker-compose.yml](docker-compose.yml))
- Nginx: Não identificado no código
- Storage S3: Não identificado no código

## Observações
- Apenas decisões presentes no código foram documentadas.
