import { Controller, Get, Post } from '@nestjs/common';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { ApiOkResponse, ApiOperation } from '../../lib/decorators';
import { SwaggerExplorer } from '../../lib/swagger-explorer';

describe('Explore controllers', () => {
  class Foo {}

  @Controller('')
  class FooController {
    @Get('foos/:objectId')
    @ApiOperation({ title: 'List all Foos' })
    @ApiOkResponse({ type: Foo })
    find(): Promise<Foo> {
      return Promise.resolve({});
    }
  }

  class Bar {}

  @Controller('')
  class BarController {
    @Post('bars/:objectId')
    @ApiOperation({ title: 'Creates a Bar' })
    @ApiOkResponse({ type: Bar })
    create(): Promise<Bar> {
      return Promise.resolve({});
    }
  }

  it('sees a controller operation and its 200 response', () => {
    const explorer = new SwaggerExplorer();
    const routes = explorer.exploreController(
      {
        instance: new FooController(),
        metatype: FooController
      } as InstanceWrapper<FooController>,
      'path'
    );

    expect(routes.length).toEqual(1);
    expect(routes[0].root.method).toEqual('get');
    expect(routes[0].root.path).toEqual('/path/foos/{objectId}');
    expect(routes[0].root.summary).toEqual('List all Foos');
  });

  it('sees a get controller operation without consumes keyword', () => {
    const explorer = new SwaggerExplorer();
    const routes = explorer.exploreController(
      {
        instance: new FooController(),
        metatype: FooController
      } as InstanceWrapper<FooController>,
      'path'
    );
    expect(routes.length).toEqual(1);
    expect(routes[0].root.method).toEqual('get');
    expect(routes[0].consumes).toBeUndefined();
  });

  it('sees a post controller operation with consumes keyword', () => {
    const explorer = new SwaggerExplorer();
    const routes = explorer.exploreController(
      {
        instance: new BarController(),
        metatype: BarController
      } as InstanceWrapper<BarController>,
      'path'
    );
    expect(routes.length).toEqual(1);
    expect(routes[0].root.method).toEqual('post');
    expect(routes[0].consumes).toEqual(['application/json']);
  });
});
