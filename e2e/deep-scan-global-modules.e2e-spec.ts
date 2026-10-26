import { Controller, forwardRef, Get, Global, Module } from '@nestjs/common';
import type { DynamicModule, INestApplication, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ApiOkResponse,
  ApiProperty,
  DocumentBuilder,
  SwaggerModule
} from '../lib/index.js';

class GlobalResponse {
  @ApiProperty()
  value: string;
}

@Controller('explicit-static-global')
class ExplicitStaticGlobalController {
  @Get()
  @ApiOkResponse({ type: GlobalResponse })
  get() {
    return 'explicit static global';
  }
}

@Global()
@Module({ controllers: [ExplicitStaticGlobalController] })
class ExplicitStaticGlobalModule {}

@Controller('implicit-static-global')
class ImplicitStaticGlobalController {
  @Get()
  get() {
    return 'implicit static global';
  }
}

@Global()
@Module({ controllers: [ImplicitStaticGlobalController] })
class ImplicitStaticGlobalModule {}

@Controller('explicit-dynamic-global')
class ExplicitDynamicGlobalController {
  @Get()
  get() {
    return 'explicit dynamic global';
  }
}

@Controller('implicit-dynamic-global')
class ImplicitDynamicGlobalController {
  @Get()
  get() {
    return 'implicit dynamic global';
  }
}

@Module({})
class DynamicGlobalModule {
  static register(controller: Type<unknown>): DynamicModule {
    return {
      module: DynamicGlobalModule,
      global: true,
      controllers: [controller]
    };
  }
}

@Controller('ordinary')
class OrdinaryController {
  @Get()
  get() {
    return 'ordinary import';
  }
}

@Module({ controllers: [OrdinaryController] })
class OrdinaryModule {}

@Controller('forward-reference')
class ForwardReferenceController {
  @Get()
  get() {
    return 'forward reference import';
  }
}

@Module({ controllers: [ForwardReferenceController] })
class ForwardReferenceModule {}

@Controller('selected')
class SelectedController {
  @Get()
  get() {
    return 'selected module';
  }
}

@Module({
  imports: [
    ExplicitStaticGlobalModule,
    DynamicGlobalModule.register(ExplicitDynamicGlobalController),
    OrdinaryModule,
    forwardRef(() => ForwardReferenceModule)
  ],
  controllers: [SelectedController]
})
class SelectedModule {}

@Module({
  imports: [
    ImplicitStaticGlobalModule,
    DynamicGlobalModule.register(ImplicitDynamicGlobalController)
  ]
})
class SiblingModule {}

@Module({})
class DynamicSelectedModule {
  static register(): DynamicModule {
    return {
      module: DynamicSelectedModule,
      imports: [forwardRef(() => ExplicitStaticGlobalModule)]
    };
  }
}

@Module({
  imports: [
    Promise.resolve(
      DynamicGlobalModule.register(ExplicitDynamicGlobalController)
    )
  ]
})
class AsyncSelectedModule {}

@Module({
  imports: [
    SelectedModule,
    SiblingModule,
    DynamicSelectedModule.register(),
    AsyncSelectedModule
  ]
})
class RootModule {}

describe('Swagger deep scan global modules', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await NestFactory.create(RootModule, { logger: false });
  });

  afterEach(async () => {
    await app.close();
  });

  it('retains directly declared globals and excludes globals bound by Nest', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Deep scan').setVersion('1').build(),
      { include: [SelectedModule], deepScanRoutes: true }
    );

    expect(document.components.schemas.GlobalResponse).toBeDefined();
    const response = document.paths['/explicit-static-global'].get.responses[
      '200'
    ] as any;
    expect(response.content['application/json'].schema.$ref).toBe(
      '#/components/schemas/GlobalResponse'
    );
    expect(Object.keys(document.paths).sort()).toEqual([
      '/explicit-dynamic-global',
      '/explicit-static-global',
      '/forward-reference',
      '/ordinary',
      '/selected'
    ]);
  });
  it('preserves shallow scans', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
      { include: [SelectedModule] }
    );
    expect(Object.keys(document.paths)).toEqual(['/selected']);
  });

  it('retains an explicitly included global root', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
      { include: [ExplicitStaticGlobalModule], deepScanRoutes: true }
    );
    expect(Object.keys(document.paths)).toEqual(['/explicit-static-global']);
  });

  it('reads dynamic parent imports and resolves global forward references', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
      { include: [DynamicSelectedModule], deepScanRoutes: true }
    );
    expect(Object.keys(document.paths)).toEqual(['/explicit-static-global']);
  });

  it('preserves existing behavior when an async import cannot be identified synchronously', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
      { include: [AsyncSelectedModule], deepScanRoutes: true }
    );
    expect(Object.keys(document.paths).sort()).toEqual([
      '/explicit-dynamic-global',
      '/explicit-static-global',
      '/implicit-dynamic-global',
      '/implicit-static-global'
    ]);
  });
});
