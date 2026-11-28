import { Controller, Get } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { CatDto } from './cat.dto';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(): Observable<CatDto[]> {
    return of([]);
  }

  @Get(':id')
  findOne(): Observable<CatDto> {
    return of(new CatDto());
  }

  @Get('nested')
  findNested(): Promise<Observable<CatDto>> {
    return Promise.resolve(of(new CatDto()));
  }
}
