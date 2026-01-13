#!/bin/bash
# Script para criar databases de Staging e Produção
# Executado automaticamente pelo PostgreSQL na primeira vez

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    -- Database de Produção
    SELECT 'CREATE DATABASE reiche_academy_prod'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reiche_academy_prod')\gexec

    -- Database de Staging
    SELECT 'CREATE DATABASE reiche_academy_staging'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reiche_academy_staging')\gexec

    -- Mensagem de sucesso
    \echo 'Databases criados: reiche_academy_prod, reiche_academy_staging'
EOSQL
