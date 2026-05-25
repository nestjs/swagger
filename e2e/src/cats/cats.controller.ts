import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query
} from '@nestjs/common';
import * as v from 'valibot';
import { z } from 'zod';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCallbacks,
  ApiConsumes,
  ApiDefaultGetter,
  ApiExtension,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  getSchemaPath
} from '../../../lib/index.js';
import { CatsService } from './cats.service.js';
import { Cat } from './classes/cat.class.js';
import { CreateCatDto } from './dto/create-cat.dto.js';
import { LettersEnum, PaginationQuery } from './dto/pagination-query.dto.js';
import { TagDto } from './dto/tag.dto.js';
import { CatBreed } from './enums/cat-breed.enum.js';

const standardBodySchema = z.object({
  name: z.string().min(1).meta({
    description: 'Cat name from Zod',
    example: 'Milo'
  }),
  age: z.number().int().min(1),
  breed: z.string(),
  tags: z.array(z.string()).optional()
});

const standardBodyRichSchema = z.object({
  species: z.enum(['cat', 'dog']).meta({
    description: 'Species enum from Zod',
    title: 'Species',
    example: 'cat'
  }),
  contact: z
    .union([
      z.string().email(),
      z.object({
        phone: z.string().meta({
          description: 'Phone number from Zod',
          example: '123-456'
        })
      })
    ])
    .meta({
      description: 'Preferred contact from Zod',
      title: 'PreferredContact',
      examples: ['owner@example.com']
    }),
  profile: z.object({
    nickname: z.string().meta({
      description: 'Nested nickname from Zod',
      example: 'Captain Whiskers'
    }),
    temperament: z.enum(['playful', 'calm']).meta({
      description: 'Nested temperament from Zod',
      example: 'playful'
    }),
    notes: z.string().default('Indoor only').meta({
      description: 'Nested notes from Zod',
      example: 'Indoor only',
      deprecated: true
    }),
    traits: z.array(
      z.object({
        label: z.string().meta({
          description: 'Trait label from Zod',
          example: 'affectionate'
        }),
        score: z.number().min(0).max(10).meta({
          description: 'Trait score from Zod',
          example: 8
        })
      })
    ).meta({
      description: 'Nested trait list from Zod'
    })
  }).meta({
    title: 'CatProfile',
    description: 'Nested cat profile from Zod'
  })
});

const standardQuerySchema = v.object({
  page: v.pipe(v.number(), v.description('Page number from Valibot')),
  search: v.pipe(v.optional(v.string()), v.title('Search term'))
});

const standardQueryRichSchema = v.object({
  mode: v.pipe(
    v.picklist(['simple', 'advanced']),
    v.description('Mode enum from Valibot'),
    v.examples(['simple'])
  ),
  filter: v.pipe(
    v.union([
      v.string(),
      v.object({
        nested: v.pipe(
          v.string(),
          v.description('Nested filter from Valibot'),
          v.examples(['persian'])
        )
      })
    ]),
    v.description('Filter union from Valibot'),
    v.title('FilterTitle')
  ),
  details: v.pipe(
    v.object({
      label: v.pipe(
        v.string(),
        v.description('Nested label from Valibot'),
        v.examples(['primary'])
      ),
      flags: v.pipe(v.array(v.boolean()), v.title('Flag list from Valibot'))
    }),
    v.title('Details title from Valibot'),
    v.description('Nested details from Valibot')
  )
});

const standardParamSchema = z
  .string()
  .min(3)
  .regex(/^cat_[0-9]+$/)
  .meta({ description: 'Cat identifier from Zod' });

const standardParamRichSchema = z.enum(['available', 'resting']).meta({
  description: 'Cat state enum from Zod',
  title: 'CatState',
  examples: ['available']
});

const standardResponseRichSchema = z.object({
  status: z.enum(['available', 'resting']).meta({
    title: 'CatResponseState',
    description: 'Response status enum from Zod',
    example: 'available'
  }),
  result: z
    .union([
      z.object({
        kind: z.literal('cat'),
        cat: z.object({
          name: z.string().meta({
            description: 'Returned cat name from Zod',
            example: 'Milo'
          })
        })
      }),
      z.object({
        kind: z.literal('message'),
        message: z.string().meta({
          description: 'Returned message from Zod',
          example: 'No cat available'
        })
      })
    ])
    .meta({
      title: 'StandardResponseResult',
      description: 'Response union from Zod',
      examples: [{ kind: 'message', message: 'No cat available' }]
    }),
  meta: z.object({
    source: z.string().meta({
      description: 'Nested response source from Zod',
      example: 'cache'
    }),
    tags: z.array(
      z.object({
        label: z.string().meta({
          description: 'Response tag label from Zod',
          example: 'featured'
        })
      })
    ).meta({ description: 'Response tags from Zod' })
  }).meta({
    title: 'ResponseMeta',
    description: 'Nested response metadata from Zod'
  })
});

@ApiSecurity('basic')
@ApiBearerAuth()
@ApiSecurity({ key2: [], key1: [] })
@ApiTags('cats')
@ApiHeader({
  name: 'header',
  required: false,
  description: 'Test',
  schema: { default: 'test' },
  example: 'test'
})
@ApiExtension('x-foo', { 'from-controller': true })
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @ApiCallbacks({
    name: 'mySecondEvent',
    callbackUrl: '{$request.body#/callbackUrl}',
    method: 'post',
    requestBody: {
      type: Cat
    },
    expectedResponse: {
      status: 200
    }
  })
  @ApiCallbacks({
    name: 'myEvent',
    callbackUrl: '{$request.body#/callbackUrl}',
    method: 'post',
    requestBody: {
      type: Cat
    },
    expectedResponse: {
      status: 200
    }
  })
  @ApiTags('create cats')
  @Post()
  @ApiOperation({ summary: 'Create cat' })
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: () => Cat
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiExtension('x-foo', { 'from-method': 'bar' })
  async create(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }

  @Post('explicit-body')
  @ApiBody({
    type: CreateCatDto,
    examples: {
      mau: {
        summary: 'Mau example',
        value: {
          name: 'Mau cat',
          age: 5,
          breed: 'Mau'
        }
      }
    }
  })
  async createExplicitBody(@Body() createCatDto: CreateCatDto): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }

  @Post('standard-body')
  async createWithStandardBody(
    @Body({
      schema: standardBodySchema
    })
    createCatDto: CreateCatDto
  ): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }

  @Post('standard-body-rich')
  async createWithRichStandardBody(
    @Body({
      schema: standardBodyRichSchema
    })
    createCatDto: CreateCatDto
  ): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }

  @Post('standard-body-conflict')
  @ApiBody({
    type: TagDto,
    description: 'Explicit body decorator metadata',
    required: false,
    examples: {
      legacy: {
        summary: 'Explicit body example',
        value: { legacy: true }
      }
    }
  })
  async createWithConflictingStandardBody(
    @Body({
      schema: z.object({
        override: z.string().meta({
          description: 'Body override from Zod',
          example: 'zod-body'
        }),
        count: z.number().int().min(1)
      })
    })
    createCatDto: CreateCatDto
  ): Promise<Cat> {
    return this.catsService.create(createCatDto);
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'The found record',
    type: Cat
  })
  @ApiExtension('x-auth-type', 'NONE')
  @ApiDefaultGetter(Cat, 'id')
  findOne(@Param('id') id: string): Cat {
    return this.catsService.findOne(+id);
  }

  @Get()
  @ApiExtension('x-codeSamples', [
    { lang: 'JavaScript', source: "console.log('Hello World');" }
  ])
  @ApiExtension('x-multiple', { test: 'test' })
  @ApiQuery({
    name: 'catBreeds',
    enum: CatBreed,
    isArray: true
  })
  @ApiTags('tag1')
  @ApiTags('tag2')
  findAll(@Query() paginationQuery: PaginationQuery) {}

  @ApiQuery({ type: PaginationQuery })
  @Get('explicit-query')
  findAllWithExplicitQuery(paginationQuery: PaginationQuery) {}

  @Get('standard-query')
  findAllWithStandardQuery(
    @Query({
      schema: standardQuerySchema
    })
    query: PaginationQuery
  ) {}

  @Get('standard-query-rich')
  findAllWithRichStandardQuery(
    @Query({
      schema: standardQueryRichSchema
    })
    query: PaginationQuery
  ) {}

  @Get('standard-query-conflict')
  @ApiQuery({
    name: 'filter',
    type: String,
    required: false,
    description: 'Explicit query decorator description'
  })
  findAllWithConflictingStandardQuery(
    @Query({
      schema: z.object({
        filter: z.number().int().min(1).meta({
          description: 'Query override from Zod',
          example: 3
        }),
        active: z.boolean().meta({
          description: 'Boolean flag from Zod',
          example: true
        })
      })
    })
    query: PaginationQuery
  ) {}

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

  @Get('wildcard/*')
  getWildcard() {}

  @Get('with-enum/:type')
  @ApiParam({
    name: 'type',
    enum: LettersEnum
  })
  getWithEnumParam(@Param('type') type: LettersEnum) {}

  @Get('standard-param/:id')
  getWithStandardParam(
    @Param('id', { schema: standardParamSchema })
    id: string
  ) {}

  @Get('standard-param-rich/:state')
  getWithRichStandardParam(
    @Param('state', {
      schema: standardParamRichSchema
    })
    state: string
  ) {}

  @Get('standard-param-conflict/:state')
  @ApiParam({
    name: 'state',
    type: String,
    description: 'Explicit param decorator description'
  })
  getWithConflictingStandardParam(
    @Param('state', {
      schema: z.enum(['available', 'resting']).meta({
        description: 'Param override from Zod',
        example: 'resting'
      })
    })
    state: string
  ) {}

  @Get('standard-response')
  @ApiResponse({
    status: 200,
    standardSchema: standardResponseRichSchema,
    description: 'Standard schema response override'
  })
  getWithStandardResponse(): Cat {
    return this.catsService.findOne(1);
  }

  @Get('standard-response-conflict')
  @ApiResponse({
    status: 200,
    type: Number,
    description: 'Standard schema response conflict override',
    examples: {
      legacy: {
        summary: 'Decorator response example',
        value: { legacy: true }
      }
    },
    standardSchema: z.object({
      result: z.string().meta({
        description: 'Response override from Zod',
        example: 'ok'
      }),
      count: z.number().int().min(1)
    })
  })
  getWithConflictingStandardResponse(): Cat {
    return this.catsService.findOne(1);
  }

  @Get('with-enum-named/:type')
  @ApiParam({
    name: 'type',
    enum: LettersEnum,
    enumName: 'Letter',
    enumSchema: {
      description: 'This is a description for the Letters schema',
      deprecated: true
    },
    description: "This is a description for 'type' query parameter",
    deprecated: false
  })
  getWithEnumNamedParam(@Param('type') type: LettersEnum) {}

  @Get('with-named-type-example')
  @ApiQuery({
    name: 'filter',
    type: TagDto,
    example: 'example-tag'
  })
  getWithNamedTypeExample(@Query('filter') filter: TagDto) {}

  @Get('with-random-query')
  @ApiQuery({
    name: 'type',
    type: String,
    minLength: 10,
    maxLength: 100
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    content: {
      'application/json': {
        schema: {
          type: 'string'
        }
      }
    }
  })
  getWithRandomQuery(@Query('type') type: string) {}

  @Get('download')
  @ApiOperation({
    responses: {
      '200': {
        description: 'binary file for download',
        content: {
          'application/pdf': { schema: { type: 'string', format: 'binary' } },
          'image/jpeg': { schema: { type: 'string', format: 'binary' } }
        }
      }
    }
  })
  download() {}

  @Get('raw-schema-response')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The paginated response',

    schema: {
      type: 'object',

      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Cat) }
        },
        pageInfo: {
          type: 'object',
          properties: {
            hasPreviousPage: { type: 'boolean' },
            hasNextPage: { type: 'boolean' },
            startCursor: { type: 'string' },
            endCursor: { type: 'string' }
          }
        }
      }
    }
  })
  rawSchemaResponse() {}

  @Get('scalar-with-example')
  @ApiResponse({ status: 200, type: Number, example: 42 })
  scalarWithExample(): number {
    return 42;
  }

  @Get('scalar-with-examples')
  @ApiResponse({
    status: 200,
    type: Number,
    examples: {
      adult: { value: 5, summary: 'Adult cat age' },
      kitten: { value: 1, summary: 'Kitten age' }
    }
  })
  scalarWithExamples(): number {
    return 5;
  }

  @Get('array-of-scalar-with-example')
  @ApiResponse({
    status: 200,
    type: String,
    isArray: true,
    example: ['Mau', 'Persian']
  })
  arrayOfScalarWithExample(): string[] {
    return ['Mau', 'Persian'];
  }
}
