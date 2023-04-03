import { Controller, Get, Query } from '@nestjs/common';
import { PARAMTYPES_METADATA } from '@nestjs/common/constants';
import { ParameterMetadataAccessor } from '../../lib/services/parameter-metadata-accessor';

describe('ParameterMetadataAccessor', () => {
  @Controller()
  class UserController {
    @Get()
    findUser(@Query('userID') userID: string) { }
  }

  let parameterMetadataAccessor: ParameterMetadataAccessor;

  beforeEach(() => {
    parameterMetadataAccessor = new ParameterMetadataAccessor();
  });

  describe('explore', () => {
    it('should handle missing paramtypes metadata', () => {
      const controller = new UserController();
      jest.spyOn(Reflect, 'getMetadata')
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce({
          '4:0': { index: 0, data: 'userID', pipes: [] }
        });

      Reflect.defineMetadata(PARAMTYPES_METADATA, undefined, controller.findUser);

      expect(
        parameterMetadataAccessor.explore(
          controller,
          UserController,
          controller.findUser
        )
      ).toEqual({
        '4:0': { in: 'query', name: 'userID', required: true, type: undefined }
      });
    });
  });
});
