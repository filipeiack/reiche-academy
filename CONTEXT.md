Contexto do Projeto:
Desenvolver o sistema de Gestão Empresarial PDCA para a Reiche Consultoria, substituindo as duas planilhas existentes na pasta "planilhas/". 
Na fase 1 iremos focar na planilha DIAGNOSTICO e na fase 2 na planilha COCKPIT.  
O sistema será web (SPA) com backend em Node.js/NestJS, frontend em Angular e banco PostgreSQL.
O nome do sistema é Reiche Academy.

Stack:
- Front-end: Angular 18+, Angular Material, RxJS, NgRx (quando necessário). Template baseado na pasta "templates/", subpasta "nobleui-angular/".
- Back-end: Node.js 20 LTS com NestJS, TypeScript, Swagger/OpenAPI, DTOs e validação class-validator.
- Banco de dados: PostgreSQL + Prisma ORM (migrations versionadas).
- Autenticação: JWT (access + refresh), RBAC por perfis (Consultor, Gestor, Colaborador, Leitura).
- Infraestrutura: Docker, Nginx, CI/CD GitHub Actions, storage S3 compatível, HTTPS.
- Segurança: Argon2 para senhas, proteção CSRF/XSS/SQLi, LGPD e logs de auditoria.
- Observabilidade: Winston ou Pino + OpenTelemetry.

Módulos Fase 1:
1.1. Cadastros Essenciais (Empresa, Usuário, Pilares, Rotinas, Agenda de Reuniões).
1.2. Wizard de Diagnóstico (Associar para cada empresa, Pilares e Rotinas desses pilares, atribuindo uma nota para cada pilar daquela empresa e uma classificação de criticidade: Alto, Medio ou Baixo).
1.3. Perfis e Permissões de acesso (Perfis não devem ver dados de outras empresas/contratos).
1.4. Log de auditoria (Logs devem registrar usuário, data/hora, operação e versão anterior do dado).

Módulos Fase 2:
2.1. Cockpit PDCA (Planos, Ações 5W2H, Tarefas, Status, Anexos)
2.2. KPIs / Metas / Resultados
2.3. Dashboard 360°


Objetivo:
Criar um MVP funcional (sem relatórios avançados por enquanto ou integrações externas) com arquitetura limpa, modular e escalável.

Guidelines de código:
- Backend em arquitetura limpa (controllers, services, repositories).
- Frontend com componentes e módulos bem isolados.
- Uso de DTOs e tipagem rigorosa em todo o código.
- Todos os endpoints documentados com Swagger.
- Priorizar performance, legibilidade e padrões de mercado.
