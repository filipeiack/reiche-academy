import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { diskStorage, StorageEngine } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';

@ApiTags('usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para criar perfil superior' })
  create(@Body() createUsuarioDto: CreateUsuarioDto, @Request() req: { user: RequestUser }) {
    return this.usuariosService.create(createUsuarioDto, req.user);
  }

  @Get()
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso' })
  findAll(@Request() req: { user: RequestUser }) {
    return this.usuariosService.findAll(req.user);
  }

  @Get('disponiveis/empresa')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Buscar usuários disponíveis (sem empresa associada)' })
  @ApiResponse({ status: 200, description: 'Lista de usuários disponíveis retornada com sucesso' })
  findDisponiveis(@Request() req: { user: RequestUser }) {
    return this.usuariosService.findDisponiveis(req.user);
  }

  @Get(':id')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para visualizar usuário de outra empresa' })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Request() req: { user: RequestUser }) {
    return this.usuariosService.findById(id, req.user);
  }

  @Get(':id/cargos-cockpit')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Listar cargos do usuário via Cockpit' })
  @ApiResponse({ status: 200, description: 'Lista de cargos do usuário retornada com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para visualizar usuário de outra empresa' })
  getCargosCockpit(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Request() req: { user: RequestUser },
  ) {
    return this.usuariosService.getCargosCockpitByUsuario(id, req.user);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado por outro usuário' })
  @ApiResponse({ status: 403, description: 'Sem permissão para editar campos privilegiados ou perfil superior' })
  update(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() updateUsuarioDto: UpdateUsuarioDto, @Request() req: { user: RequestUser }) {
    return this.usuariosService.update(id, updateUsuarioDto, req.user);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Deletar usuário permanentemente' })
  @ApiResponse({ status: 200, description: 'Usuário deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Request() req: { user: RequestUser }) {
    return this.usuariosService.hardDelete(id, req.user);
  }

  @Patch(':id/inativar')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Inativar usuário' })
  @ApiResponse({ status: 200, description: 'Usuário inativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  inactivate(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Request() req: { user: RequestUser }) {
    return this.usuariosService.remove(id, req.user);
  }

  @Post(':id/foto')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Upload de foto de perfil' })
  @ApiResponse({ status: 200, description: 'Foto atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou não enviado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para alterar foto de outro usuário' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        foto: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: 'public/images/faces',
        filename: (req: any, file: Express.Multer.File, cb: any) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
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
  async uploadProfilePhoto(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: RequestUser },
  ) {
    if (!file) {
      throw new BadRequestException('Nenhuma imagem foi enviada');
    }

    const fotoUrl = `/images/faces/${file.filename}`;
    return await this.usuariosService.updateProfilePhoto(id, fotoUrl, req.user);
  }

  @Delete(':id/foto')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Deletar foto de perfil' })
  @ApiResponse({ status: 200, description: 'Foto deletada com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para deletar foto de outro usuário' })
  async deleteProfilePhoto(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Request() req: { user: RequestUser }) {
    return this.usuariosService.deleteProfilePhoto(id, req.user);
  }
}
