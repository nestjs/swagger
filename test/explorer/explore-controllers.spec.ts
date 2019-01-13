import { Controller, Get } from '@nestjs/common';
import { expect } from 'chai';

import { ApiOkResponse, ApiOperation } from '../../lib/decorators';
import { SwaggerExplorer } from '../../lib/swagger-explorer';
import { InstanceWrapper } from '@nestjs/core/injector/container';

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

  it('sees a controller operation and its 200 response', () => {
    const explorer = new SwaggerExplorer();
    const routes = explorer.exploreController(
      {
        instance: new FooController(),
        metatype: FooController
      } as InstanceWrapper<FooController>,
      'path'
    );

    expect(routes.length).to.be.eql(1);
    expect(routes[0].root.method).to.be.eql('get');
    expect(routes[0].root.path).to.be.eql('path//foos/{objectId}');
    expect(routes[0].root.summary).to.be.eql('List all Foos');
  });
});
