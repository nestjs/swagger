import { Controller, Get, Query, Body } from '@nestjs/common';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import {
  ApiImplicitQuery,
  ApiModelProperty,
  ApiOkResponse,
  ApiOperation
} from '../../lib/decorators';
import { SwaggerExplorer } from '../../lib/swagger-explorer';
export class SampleDto {
  @ApiModelProperty({ type: String, required: true })
  readonly prop1: string;

  @ApiModelProperty({ type: Number, required: true })
  readonly prop2: number;

  @ApiModelProperty({ type: String, required: true })
  readonly cc: string;

  @ApiModelProperty({ type: SampleDto, required: false })
  readonly object: SampleDto;
}
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
  @Controller('')
  class QueryController {
    @Get('foos/:objectId')
    @ApiOperation({ title: 'Test Query' })
    @ApiOkResponse({ type: Foo })
    find1(@Query() dto: SampleDto): Promise<{}> {
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
  it('check generated doc', () => {
    const explorer = new SwaggerExplorer();
    const routes = explorer.exploreController(
      {
        instance: new QueryController(),
        metatype: QueryController
      } as InstanceWrapper<QueryController>,
      'path'
    );

    expect(routes.length).toEqual(1);
    expect(routes[0].root.parameters[0].schema.$ref).toEqual(
      '#/definitions/SampleDto'
    );
  });
});
