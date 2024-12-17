import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Version,
  VERSION_NEUTRAL
} from '@nestjs/common';
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
} from '../../../lib';
import { DogsService } from './dogs.service';
import { Dog } from './classes/dog.class';
import { CreateDogDto } from './dto/create-dog.dto';

@ApiSecurity('basic')
@ApiBearerAuth()
@ApiSecurity({ key2: [], key1: [] })
@ApiTags('dogs')
@ApiHeader({
  name: 'header',
  required: false,
  description: 'Test',
  schema: { default: 'test' }
})
@Controller('dogs')
export class DogsController {
  constructor(private readonly dogsService: DogsService) {}

  @Get('')
  @Version(VERSION_NEUTRAL)
  @ApiResponse({
    status: 200,
    description: 'The list of all dogs',
    type: Array<Dog>,
  })
  getList(): Dog[] {
    return this.dogsService.getAll();
  }

  @Post('')
  @Version('0')
  @ApiResponse({
    status: 200,
    description: 'The tail array',
    type: Array
  })
  createNewV0(@Body() dogData: CreateDogDto): Dog { return this.dogsService.create(dogData); }

  @Post('')
  @Version('1')
  @ApiResponse({
    status: 200,
    description: 'The tail string',
    type: String
  })
  createNewV1(@Body() dogData: CreateDogDto): Dog { return this.dogsService.create(dogData); }

  @Post('')
  @Version('2')
  @ApiResponse({
    status: 200,
    description: 'The tail array.',
    type: Array,
  })
  createNewV2(@Body() dogData: CreateDogDto): [Dog, boolean] { return [this.dogsService.create(dogData), Math.random() > 0.5]; }

}
