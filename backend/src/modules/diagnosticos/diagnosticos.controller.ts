import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DiagnosticosService } from './diagnosticos.service';
import { UpdateNotaRotinaDto } from './dto/update-nota-rotina.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('diagnosticos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DiagnosticosController {
  constructor(private readonly diagnosticosService: DiagnosticosService) {}

  @Get('empresas/:empresaId/diagnostico/notas')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Buscar estrutura completa de diagnóstico (pilares → rotinas → notas)' })
  @ApiResponse({ status: 200, description: 'Estrutura de diagnóstico retornada com sucesso' })
  getDiagnosticoByEmpresa(
    @Param('empresaId') empresaId: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.diagnosticosService.getDiagnosticoByEmpresa(empresaId, req.user);
  }

  @Patch('rotinas-empresa/:rotinaEmpresaId/nota')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Atualizar ou criar nota de uma rotina (auto-save)' })
  @ApiResponse({ status: 200, description: 'Nota salva com sucesso' })
  upsertNotaRotina(
    @Param('rotinaEmpresaId') rotinaEmpresaId: string,
    @Body() updateDto: UpdateNotaRotinaDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.diagnosticosService.upsertNotaRotina(rotinaEmpresaId, updateDto, req.user);
  }
}
