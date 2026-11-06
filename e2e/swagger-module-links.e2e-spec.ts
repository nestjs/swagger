import { Controller, Get, Module, Param } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DECORATORS } from '../lib/constants.js';
import {
  ApiExcludeController,
  ApiLink,
  ApiOkResponse,
  ApiProperty,
  DocumentBuilder,
  SwaggerModule
} from '../lib/index.js';

describe('SwaggerModule response links', () => {
  class UserDto {
    @ApiProperty()
    id: string;
  }

  class AdminUserDto extends UserDto {}

  @Controller('users')
  class UsersController {
    @Get(':id')
    @ApiOkResponse({ type: UserDto })
    findOne() {}

    @Get(':userId/posts')
    @ApiLink({ from: UserDto, routeParam: 'userId' })
    listPosts(@Param('userId') userId: string) {}
  }

  @ApiExcludeController()
  @Controller('admin')
  class AdminController {
    @Get('billing/:userId')
    @ApiLink({ from: UserDto, routeParam: 'userId' })
    getBillingAccount(@Param('userId') userId: string) {}

    @Get('audit/:userId')
    @ApiLink({ from: AdminUserDto, routeParam: 'userId' })
    getAuditLog(@Param('userId') userId: string) {}
  }

  @Module({ controllers: [UsersController, AdminController] })
  class AppModule {}

  it('only links to operations that are in the document', async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build()
    );
    await app.close();

    const response = document.paths['/users/{id}'].get!.responses['200'];
    expect(
      Object.values((response as any).links).map(
        (link: any) => link.operationId
      )
    ).toEqual(['UsersController_listPosts']);
  });

  it('does not add the links of a subclass to its parent class', () => {
    const links = Reflect.getMetadata(DECORATORS.API_LINK, UserDto.prototype);

    expect(links.map((link: any) => link.method.name)).toEqual([
      'listPosts',
      'getBillingAccount'
    ]);
  });
});
