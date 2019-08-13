import { Controller, Get, Body, Post, Req, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiImplicitBody,
  ApiImplicitQuery
} from '../../lib/decorators';
import { SwaggerExplorer } from '../../lib/swagger-explorer';

import { ApiModelProperty } from '../../lib/decorators/api-model-property.decorator';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

export class UserPayload {
  @ApiModelProperty()
  public name: string;
}

describe('@Body without @ApiImplicitBody', () => {
  @Controller('')
  class FooController {
    @Post('/')
    public create(@Body() payload: UserPayload) {}
  }

  it('output @Body refelected paramter', () => {
    const explorer = new SwaggerExplorer();
    const routes = explorer.exploreController(
      {
        instance: new FooController(),
        metatype: FooController
      } as InstanceWrapper<FooController>,
      'path'
    );

    expect(routes.length).toEqual(1);
    expect(routes[0].root.method).toEqual('post');
    expect(routes[0].root.parameters.length).toEqual(1);
    expect(routes[0].root.parameters[0].name).toEqual('UserPayload');
    expect(routes[0].root.parameters[0].required).toEqual(true);
    expect(routes[0].root.parameters[0].in).toEqual('body');
    expect(routes[0].root.parameters[0].schema).toEqual({
      $ref: '#/definitions/UserPayload'
    });
  });
});

describe('@Body with name', () => {
  @Controller('')
  class FooController {
    @Post('/')
    public create(@Body('body') payload: UserPayload) {}
  }

  it('ignores @Body', () => {
    const explorer = new SwaggerExplorer();
    const routes = explorer.exploreController(
      {
        instance: new FooController(),
        metatype: FooController
      } as InstanceWrapper<FooController>,
      'path'
    );

    expect(routes.length).toEqual(1);
    expect(routes[0].root.method).toEqual('post');
    expect(routes[0].root.parameters).toEqual(undefined);
  });
});

describe('@Body with @ApiImplicitBody', () => {
  @Controller('')
  class FooController {
    @ApiImplicitBody({ name: 'body', type: UserPayload })
    @Post('/')
    public create(@Body() payload: UserPayload) {}
  }

  it('drops @Body reflected parameter when @ApiImplicitBody is described', () => {
    const explorer = new SwaggerExplorer();
    const routes = explorer.exploreController(
      {
        instance: new FooController(),
        metatype: FooController
      } as InstanceWrapper<FooController>,
      'path'
    );

    expect(routes.length).toEqual(1);
    expect(routes[0].root.method).toEqual('post');
    expect(routes[0].root.parameters.length).toEqual(1);
    expect(routes[0].root.parameters[0].name).toEqual('body');
    expect(routes[0].root.parameters[0].required).toEqual(true);
    expect(routes[0].root.parameters[0].in).toEqual('body');
    expect(routes[0].root.parameters[0].isArray).toEqual(false);
    expect(routes[0].root.parameters[0].schema).toEqual({
      $ref: '#/definitions/UserPayload'
    });
  });
});
