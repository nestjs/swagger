import { Injectable } from '@nestjs/common';
import { Dog } from './classes/dog.class';
import { CreateDogDto } from './dto/create-dog.dto';

@Injectable()
export class DogsService {
  private readonly dogs: Dog[] = [];

  getAll(): Dog[] {
    return [...this.dogs];
  }

  create(dog: CreateDogDto): Dog {
    this.dogs.push(dog);
    return dog;
  }
}
