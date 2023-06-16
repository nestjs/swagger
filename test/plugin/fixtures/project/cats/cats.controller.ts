import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation } from '../../../../lib';
import { CatsService } from './cats.service';
import { Cat } from './classes/cat.class';
import { CreateCatDto } from './dto/create-cat.dto';
import { LettersEnum, PaginationQuery } from './dto/pagination-query.dto';

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Post()
  @ApiOperation({ summary: 'Create cat' })
  async create(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Cat {
    return this.catsService.findOne(+id);
  }

  @Get()
  findAll(@Query() paginationQuery: PaginationQuery) {}

  @Post('bulk')
  async createBulk(@Body() createCatDto: CreateCatDto[]): Promise<Cat> {
    return null;
  }

  @Post('as-form-data')
  @ApiOperation({ summary: 'Create cat' })
  async createAsFormData(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }

  @Get('with-enum/:type')
  getWithEnumParam(@Param('type') type: LettersEnum) {}

  @Get('with-random-query')
  getWithRandomQuery(@Query('type') type: string) {}
}
