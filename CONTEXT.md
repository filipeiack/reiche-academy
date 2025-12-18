Contexto do Projeto:
Desenvolver o sistema de Gestão Empresarial PDCA para a Reiche Consultoria, substituindo as duas planilhas existentes na pasta "planilhas/". 
Na fase 1 iremos focar na planilha DIAGNOSTICO e na fase 2 na planilha COCKPIT.  
O sistema será web (SPA) com backend em Node.js/NestJS, frontend em Angular e banco PostgreSQL.
O nome do sistema é Reiche Academy.

Stack:
- Front-end: Angular 18+, Angular Material, RxJS, NgRx (quando necessário). Template baseado em "reiche-academy\templates\nobleui-angular\template\demo1".
- Back-end: Node.js 20 LTS com NestJS, TypeScript, Swagger/OpenAPI, DTOs e validação class-validator.
- Banco de dados: PostgreSQL + Prisma ORM (migrations versionadas).
- Autenticação: JWT (access + refresh), RBAC por perfis (Administrador, Gestor, Colaborador, Leitura).
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

**Paleta de Cores Oficial (Design System):**
O sistema utiliza a seguinte paleta de cores baseada em design system moderno e elegante:

| Nome | HEX | RGB | Uso |
|------|-----|-----|-----|
| **Dourado 01 (Primário)** | `#B6915D` | 182, 145, 93 | Botões, destaques, elementos interativos |
| **Dourado 02 (Apoio)** | `#D1B689` | 209, 182, 137 | Bordas, divisores, detalhes secundários |
| **Azul Grafite (Neutro)** | `#242B2E` | 36, 40, 46 | Textos escuros, backgrounds elegantes |
| **Branco (Claro)** | `#EFEFEF` | 239, 239, 239 | Fundos claros, textos em backgrounds escuros |

**CSS Variables (Aplicação):**
```css
:root {
  --color-gold-1: #B6915D;        /* Primário */
  --color-gold-2: #D1B689;        /* Apoio */
  --color-dark: #242B2E;          /* Neutro Escuro */
  --color-light: #EFEFEF;         /* Neutro Claro */
  --bg-dark: #0d0d0d;             /* Background Escuro */
  --bg-light: #ffffff;            /* Background Claro */
}
```



**Personalização por Empresa:**
O sistema deve permitir personalização visual e funcional por empresa:
- Logotipo customizado (fallback: logo Reiche Academy)
- Imagem de fundo da tela de login (fallback: imagem padrão Reiche Academy)
- Cores primárias/secundárias do tema (fallback: paleta oficial Dourado/Grafite)
- Configurações específicas de funcionalidades por contrato
- Cada empresa visualiza apenas seus próprios dados (isolamento total)

Guidelines de código:
- Backend em arquitetura limpa (controllers, services, repositories).
- Frontend com componentes e módulos bem isolados.
- Uso de DTOs e tipagem rigorosa em todo o código.
- Todos os endpoints documentados com Swagger.
- Priorizar performance, legibilidade e padrões de mercado.
- Implementar fallbacks para assets não customizados (logo e backgrounds padrão).
- Respeitar paleta oficial de cores em componentes base, permitindo override por empresa.
