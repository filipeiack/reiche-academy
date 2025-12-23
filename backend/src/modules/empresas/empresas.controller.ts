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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  // Endpoints públicos DEVEM vir ANTES de rotas com :id para não serem interceptados
  
  // Endpoint público para buscar customização por CNPJ (sem autenticação)
  @Get('customization/:cnpj')
  @ApiOperation({ summary: 'Buscar customização da empresa por CNPJ (público)' })
  @ApiResponse({ status: 200, description: 'Customização encontrada' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  async getCustomizationByCnpj(@Param('cnpj') cnpj: string) {
    return this.empresasService.findByCnpj(cnpj);
  }

  // Endpoint público para buscar empresa por loginUrl (sem autenticação)
  @Get('by-login-url/:loginUrl')
  @ApiOperation({ summary: 'Buscar empresa por loginUrl (público)' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  async getByLoginUrl(@Param('loginUrl') loginUrl: string) {
    return this.empresasService.findByLoginUrl(loginUrl);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  @Get('tipos-negocio/distinct')
  @ApiOperation({ summary: 'Buscar tipos de negócio distintos' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de negócio' })
  getTiposNegocio() {
    return this.empresasService.getTiposNegocioDistinct();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  @Post()
  @ApiOperation({ summary: 'Criar nova empresa' })
  @ApiResponse({ status: 201, description: 'Empresa criada com sucesso' })
  create(@Body() createEmpresaDto: CreateEmpresaDto, @Request() req: ExpressRequest & { user: { id: string } }) {
    return this.empresasService.create(createEmpresaDto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'GESTOR')
  @Get()
  @ApiOperation({ summary: 'Listar empresas' })
  @ApiResponse({ status: 200, description: 'Lista de empresas' })
  findAll(@Request() req: ExpressRequest & { user: { empresaId: string; perfil: { codigo: string } } }) {
    // ADMINISTRADOR vê todas as empresas
    if (req.user.perfil.codigo === 'ADMINISTRADOR') {
      return this.empresasService.findAll();
    }
    // GESTOR vê apenas sua empresa
    return this.empresasService.findAllByEmpresa(req.user.empresaId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @Get(':id')
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  findOne(@Param('id') id: string) {
    return this.empresasService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'GESTOR')
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar empresa' })
  @ApiResponse({ status: 200, description: 'Empresa atualizada' })
  update(
    @Param('id') id: string,
    @Body() updateEmpresaDto: UpdateEmpresaDto,
    @Request() req: ExpressRequest & { user: any },
  ) {
    return this.empresasService.update(id, updateEmpresaDto, req.user.id, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR')
  @Delete(':id')
  @ApiOperation({ summary: 'Desativar empresa' })
    @ApiResponse({ status: 200, description: 'Empresa desativada' })
    remove(@Param('id') id: string, @Request() req: ExpressRequest & { user: any }) {
      return this.empresasService.remove(id, req.user.id, req.user);
    }
  
    @Post(':id/pilares')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMINISTRADOR', 'GESTOR')
    @ApiOperation({ summary: 'Vincular pilares à empresa' })
    vincularPilares(
      @Param('id') id: string,
      @Body('pilaresIds') pilaresIds: string[],
      @Request() req: ExpressRequest & { user: any },
    ) {
      return this.empresasService.vincularPilares(id, pilaresIds, req.user.id, req.user);
    }

  @Post(':id/logo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Upload de logotipo da empresa' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/images/logos',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = extname(file.originalname);
          cb(null, `empresa-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(new BadRequestException('Apenas imagens JPG, PNG ou WebP são permitidas'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: ExpressRequest & { user: any },
  ) {
    if (!file) {
      throw new BadRequestException('Nenhuma imagem foi enviada');
    }

    const logoUrl = `/images/logos/${file.filename}`;
    return await this.empresasService.updateLogo(id, logoUrl, req.user.id, req.user);
  }

  @Delete(':id/logo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Deletar logotipo da empresa' })
  async deleteLogo(@Param('id') id: string, @Request() req: ExpressRequest & { user: any }) {
    return this.empresasService.deleteLogo(id, req.user.id, req.user);
  }
}
