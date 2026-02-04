-- Configuração de Timezone para América/São Paulo
-- Este script é executado automaticamente na inicialização do PostgreSQL

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_database WHERE datname = 'reiche_academy') THEN
		EXECUTE 'ALTER DATABASE reiche_academy SET timezone TO ''America/Sao_Paulo''';
	END IF;

	IF EXISTS (SELECT 1 FROM pg_database WHERE datname = 'reiche_academy_prod') THEN
		EXECUTE 'ALTER DATABASE reiche_academy_prod SET timezone TO ''America/Sao_Paulo''';
	END IF;

	IF EXISTS (SELECT 1 FROM pg_database WHERE datname = 'reiche_academy_staging') THEN
		EXECUTE 'ALTER DATABASE reiche_academy_staging SET timezone TO ''America/Sao_Paulo''';
	END IF;
END $$;
