import {
  Body,
  Controller,
  Get,
  Module,
  RequestMapping,
  RequestMethod
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '../lib';

const hasQueryMethod = 'QUERY' in RequestMethod;

describe.runIf(hasQueryMethod)('SwaggerModule QUERY method handling', () => {
  class FooFilterDto {
    name: string;
  }

  @Controller('foos')
  class QueryMethodController {
    @Get()
    findAll() {
      return [];
    }

    @RequestMapping({ path: 'filtered', method: RequestMethod.QUERY })
    getFiltered(@Body() filters: FooFilterDto) {
      return [];
    }
  }

  @Module({ controllers: [QueryMethodController] })
  class AppModule {}

  const createDocument = async (openApiVersion: string) => {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();

    const config = new DocumentBuilder()
      .setTitle('t')
      .setVersion('1')
      .setOpenAPIVersion(openApiVersion)
      .build();
    const document = SwaggerModule.createDocument(app, config);

    await app.close();
    return document;
  };

  it('omits the query operation for OAS < 3.2', async () => {
    const document = await createDocument('3.0.0');

    expect(document.paths['/foos/filtered']).toBeUndefined();
  });

  it('omits the query operation for OAS 3.1', async () => {
    const document = await createDocument('3.1.0');

    expect(document.paths['/foos/filtered']).toBeUndefined();
  });

  it('keeps sibling operations when dropping the query operation', async () => {
    const document = await createDocument('3.0.0');

    expect(document.paths['/foos'].get).toBeDefined();
    expect(document.paths['/foos'].query).toBeUndefined();
  });

  it('emits the query operation for OAS >= 3.2', async () => {
    const document = await createDocument('3.2.0');

    expect(document.paths['/foos/filtered'].query).toBeDefined();
  });
});
