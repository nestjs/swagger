import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags
} from '../../../lib';
import { CatsService } from './cats.service';
import { Cat } from './classes/cat.class';
import { CreateCatDto } from './dto/create-cat.dto';
import { PaginationQuery } from './dto/pagination-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiSecurity('basic')
@ApiBearerAuth()
@ApiTags('cats')
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @ApiTags('create cats')
  @Post()
  @ApiOperation({ summary: 'Create cat' })
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: () => Cat
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'The found record',
    type: Cat
  })
  findOne(@Param('id') id: string): Cat {
    return this.catsService.findOne(+id);
  }

  @Get()
  findAll(@Query() paginationQuery: PaginationQuery) {}

  @Get('bulk')
  findAllBulk(@Query() paginationQuery: PaginationQuery[]) {}

  @Post('bulk')
  async createBulk(@Body() createCatDto: CreateCatDto[]): Promise<Cat> {
    return null;
  }

  @ApiConsumes('application/x-www-form-urlencoded')
  @Post('as-form-data')
  @ApiOperation({ summary: 'Create cat' })
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: Cat
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createAsFormData(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }

  @Get('site*')
  getSite() {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    type: 'multipart/form-data',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  uploadFile(@UploadedFile() file) {
    return file;
  }
}
