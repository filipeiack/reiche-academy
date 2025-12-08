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
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Criar nova empresa' })
  @ApiResponse({ status: 201, description: 'Empresa criada com sucesso' })
  create(@Body() createEmpresaDto: CreateEmpresaDto, @Request() req: ExpressRequest & { user: { id: string } }) {
    return this.empresasService.create(createEmpresaDto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Listar todas as empresas ativas' })
  @ApiResponse({ status: 200, description: 'Lista de empresas' })
  findAll() {
    return this.empresasService.findAll();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  findOne(@Param('id') id: string) {
    return this.empresasService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Desativar empresa' })
    @ApiResponse({ status: 200, description: 'Empresa desativada' })
    remove(@Param('id') id: string, @Request() req: ExpressRequest & { user: { id: string } }) {
      return this.empresasService.remove(id, req.user.id);
    }
  
    @Post(':id/pilares')
    @ApiOperation({ summary: 'Vincular pilares à empresa' })
    vincularPilares(
      @Param('id') id: string,
      @Body('pilaresIds') pilaresIds: string[],
      @Request() req: ExpressRequest & { user: { id: string } },
    ) {
      return this.empresasService.vincularPilares(id, pilaresIds, req.user.id);
    }
  }
