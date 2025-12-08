import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsEmail, IsObject, IsOptional } from 'class-validator';

export class CreateAuditLogDto {
  @ApiProperty({ example: 'uuid-do-usuario' })
  @IsUUID()
  @IsNotEmpty()
  usuarioId: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  usuarioNome: string;

  @ApiProperty({ example: 'joao.silva@reiche.com.br' })
  @IsEmail()
  @IsNotEmpty()
  usuarioEmail: string;

  @ApiProperty({ example: 'empresas', description: 'Nome da tabela' })
  @IsString()
  @IsNotEmpty()
  entidade: string;

  @ApiProperty({ example: 'uuid-do-registro' })
  @IsUUID()
  @IsNotEmpty()
  entidadeId: string;

  @ApiProperty({ example: 'CREATE', enum: ['CREATE', 'UPDATE', 'DELETE'] })
  @IsString()
  @IsNotEmpty()
  acao: string;

  @ApiPropertyOptional({ example: { nome: 'Empresa Antiga' }, description: 'Estado anterior' })
  @IsObject()
  @IsOptional()
  dadosAntes?: Record<string, any>;

  @ApiPropertyOptional({ example: { nome: 'Empresa Nova' }, description: 'Estado posterior' })
  @IsObject()
  @IsOptional()
  dadosDepois?: Record<string, any>;
}
