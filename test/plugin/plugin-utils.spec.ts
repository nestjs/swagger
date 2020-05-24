import { replaceImportPath } from '../../lib/plugin/utils/plugin-utils';

describe('Plugin utils', () => {
  const params = [
    {
      description:
        'should replace import path correctly when absolute pathes passed on windows',
      typeReference:
        '[import("d:\\Projects\\PG\\src\\services\\users\\users.dto").UserDto]',
      fileName: 'd:\\Projects\\PG\\src\\services\\users\\users.controller.ts',
      expected: '[require("./users.dto").UserDto]'
    },
    {
      description:
        'should replace import path correctly when relative pathes passed on windows',
      typeReference: '[import(".\\src\\services\\users\\users.dto").UserDto]',
      fileName: '.\\src\\services\\users\\users.controller.ts',
      expected: '[require("./users.dto").UserDto]'
    },
    {
      description:
        'should replace import path correctly when absolute pathes passed on posix systems',
      typeReference:
        '[import("/home/Projects/PG/src/services/users/users.dto").UserDto]',
      fileName: '/home/Projects/PG/src/services/users/users.controller.ts',
      expected: '[require("./users.dto").UserDto]'
    },
    {
      description:
        'should replace import path correctly when relative pathes passed on posix systems',
      typeReference: '[import("./services/users/users.dto").UserDto]',
      fileName: './services/users/users.controller.ts',
      expected: '[require("./users.dto").UserDto]'
    }
  ];

  params.forEach((x) => {
    it(x.description, () => {
      const res = replaceImportPath(x.typeReference, x.fileName);
      expect(res).toEqual(x.expected);
    });
  });
});
