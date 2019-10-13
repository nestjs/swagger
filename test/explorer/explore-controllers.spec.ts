import { Controller, Get } from '@nestjs/common';
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

    @Get(['foos/find-all', 'foos/find_all'])
    @ApiOperation({ title: 'List all Foos' })
    @ApiOkResponse({ type: Foo })
    findAll(): Promise<Foo> {
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

    expect(routes.length).toEqual(2);
    expect(routes[0].root.method).toEqual('get');
    expect(routes[0].root.path).toEqual('/path/foos/{objectId}');
    expect(routes[0].root.summary).toEqual('List all Foos');

    expect(routes[1].root.method).toEqual('get');
    expect(routes[1].root.path).toContain('find-all');
    expect(routes[1].root.path).toContain('find_all');
    expect(routes[1].root.summary).toEqual('List all Foos');
  });
});
