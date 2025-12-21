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
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage, StorageEngine } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Criar novo usuário' })
  create(@Body() createUsuarioDto: CreateUsuarioDto, @Request() req: any) {
    return this.usuariosService.create(createUsuarioDto, req.user);
  }

  @Get()
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Listar todos os usuários' })
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get('disponiveis/empresa')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Buscar usuários disponíveis (sem empresa associada)' })
  findDisponiveis() {
    return this.usuariosService.findDisponiveis();
  }

  @Get(':id')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.usuariosService.findById(id, req.user);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto, @Request() req: any) {
    return this.usuariosService.update(id, updateUsuarioDto, req.user);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Deletar usuário permanentemente' })
  remove(@Param('id') id: string) {
    return this.usuariosService.hardDelete(id);
  }

  @Patch(':id/inativar')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Inativar usuário' })
  inactivate(@Param('id') id: string) {
    return this.usuariosService.remove(id);
  }

  @Post(':id/foto')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Upload de foto de perfil' })
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
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
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
  async deleteProfilePhoto(@Param('id') id: string, @Request() req: any) {
    return this.usuariosService.deleteProfilePhoto(id, req.user);
  }
}
