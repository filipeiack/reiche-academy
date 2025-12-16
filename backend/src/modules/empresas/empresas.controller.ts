import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('empresas')
@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  // Endpoint público para buscar customização por CNPJ (sem autenticação)
  @Get('customization/:cnpj')
  @ApiOperation({ summary: 'Buscar customização da empresa por CNPJ (público)' })
  @ApiResponse({ status: 200, description: 'Customização encontrada' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  async getCustomizationByCnpj(@Param('cnpj') cnpj: string) {
    return this.empresasService.findByCnpj(cnpj);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
  @Post()
  @ApiOperation({ summary: 'Criar nova empresa' })
  @ApiResponse({ status: 201, description: 'Empresa criada com sucesso' })
  create(@Body() createEmpresaDto: CreateEmpresaDto, @Request() req: ExpressRequest & { user: { id: string } }) {
    return this.empresasService.create(createEmpresaDto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
  @Get()
  @ApiOperation({ summary: 'Listar empresas' })
  @ApiResponse({ status: 200, description: 'Lista de empresas' })
  findAll(@Request() req: ExpressRequest & { user: { empresaId: string; perfil: string } }) {
    // ADMINISTRADOR vê todas as empresas
    if (req.user.perfil === 'ADMINISTRADOR') {
      return this.empresasService.findAll();
    }
    // Outros perfis veem apenas sua empresa
    return this.empresasService.findAllByEmpresa(req.user.empresaId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @Get(':id')
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  findOne(@Param('id') id: string) {
    return this.empresasService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar empresa' })
  @ApiResponse({ status: 200, description: 'Empresa atualizada' })
  update(
    @Param('id') id: string,
    @Body() updateEmpresaDto: UpdateEmpresaDto,
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.empresasService.update(id, updateEmpresaDto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'CONSULTOR')
  @Delete(':id')
  @ApiOperation({ summary: 'Desativar empresa' })
    @ApiResponse({ status: 200, description: 'Empresa desativada' })
    remove(@Param('id') id: string, @Request() req: ExpressRequest & { user: { id: string } }) {
      return this.empresasService.remove(id, req.user.id);
    }
  
    @Post(':id/pilares')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
    @ApiOperation({ summary: 'Vincular pilares à empresa' })
    vincularPilares(
      @Param('id') id: string,
      @Body('pilaresIds') pilaresIds: string[],
      @Request() req: ExpressRequest & { user: { id: string } },
    ) {
      return this.empresasService.vincularPilares(id, pilaresIds, req.user.id);
    }
  }
