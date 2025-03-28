// @ts-nocheck
export default async () => {
  const t = {
    ['./cats/dto/pagination-query.dto.js']: await import(
      './cats/dto/pagination-query.dto.js'
    ),
    ['./cats/dto/create-cat.dto.js']: await import(
      './cats/dto/create-cat.dto.js'
    ),
    ['./cats/dto/tag.dto.js']: await import('./cats/dto/tag.dto.js'),
    ['./cats/classes/cat.class.js']: await import('./cats/classes/cat.class.js')
  };
  return {
    '@nestjs/swagger': {
      models: [
        [
          import('./cats/dto/pagination-query.dto.js'),
          {
            PaginationQuery: {
              page: { required: true, type: () => Number },
              sortBy: { required: true, type: () => [String] },
              limit: { required: true, type: () => Number },
              constrainedLimit: { required: false, type: () => Number },
              enum: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto.js'].LettersEnum
              },
              enumArr: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto.js'].LettersEnum,
                isArray: true
              },
              letters: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto.js'].LettersEnum,
                isArray: true
              },
              beforeDate: { required: true, type: () => Date },
              filter: { required: true, type: () => Object }
            }
          }
        ],
        [
          import('./cats/classes/cat.class.js'),
          {
            Cat: {
              name: { required: true, type: () => String },
              age: {
                required: true,
                type: () => Number,
                description: 'The age of the Cat',
                example: 4
              },
              breed: {
                required: true,
                type: () => String,
                description: 'The breed of the Cat'
              },
              tags: { required: false, type: () => [String] },
              createdAt: { required: true, type: () => Date },
              urls: { required: false, type: () => [String] },
              options: { required: false, type: () => [Object] },
              enum: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto.js'].LettersEnum
              },
              enumArr: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto.js'].LettersEnum
              },
              uppercaseString: { required: true, type: () => String },
              lowercaseString: { required: true, type: () => String },
              capitalizeString: { required: true, type: () => String },
              uncapitalizeString: { required: true, type: () => String }
            }
          }
        ],
        [
          import('./cats/dto/extra-model.dto.js'),
          {
            ExtraModel: {
              one: { required: true, type: () => String },
              two: { required: true, type: () => Number }
            }
          }
        ],
        [
          import('./cats/dto/tag.dto.js'),
          { TagDto: { name: { required: true, type: () => String } } }
        ],
        [
          import('./cats/dto/create-cat.dto.js'),
          {
            CreateCatDto: {
              isIn: { required: true, type: () => String },
              pattern: {
                required: true,
                type: () => String,
                pattern: '/^[+]?abc$/'
              },
              positive: {
                required: true,
                type: () => Number,
                default: 5,
                minimum: 1
              },
              negative: {
                required: true,
                type: () => Number,
                default: -1,
                maximum: -1
              },
              lengthMin: {
                required: true,
                type: () => String,
                nullable: true,
                default: null,
                minLength: 2
              },
              lengthMinMax: {
                required: true,
                type: () => String,
                minLength: 3,
                maxLength: 5
              },
              date: { required: true, type: () => Object, default: new Date() },
              active: { required: true, type: () => Boolean, default: false },
              name: { required: true, type: () => String },
              age: {
                required: true,
                type: () => Number,
                default: 14,
                minimum: 1
              },
              breed: { required: true, type: () => String, default: 'Persian' },
              tags: { required: false, type: () => [String] },
              createdAt: { required: true, type: () => Date },
              urls: { required: false, type: () => [String] },
              options: { required: false, type: () => [Object] },
              enum: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto.js'].LettersEnum
              },
              state: {
                required: false,
                description: 'Available language in the application',
                example: 'FR',
                enum: t['./cats/dto/create-cat.dto.js'].CategoryState
              },
              enumArr: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto.js'].LettersEnum
              },
              enumArr2: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto.js'].LettersEnum,
                isArray: true
              },
              tag: {
                required: true,
                type: () => t['./cats/dto/tag.dto.js'].TagDto
              },
              multipleTags: {
                required: true,
                type: () => [t['./cats/dto/tag.dto.js'].TagDto]
              },
              nested: {
                required: true,
                type: () => ({
                  first: { required: true, type: () => String },
                  second: { required: true, type: () => Number }
                })
              },
              logger: { required: true, type: () => Object }
            }
          }
        ]
      ],
      controllers: [
        [
          import('./app.controller.js'),
          {
            AppController: {
              getHello: {
                summary: 'Says hello',
                deprecated: true,
                type: String
              },
              withAliases: { type: String },
              withColonExpress: { type: String },
              withColonFastify: {
                summary: 'Returns information about the application',
                type: String
              }
            }
          }
        ],
        [
          import('./cats/cats.controller.js'),
          {
            CatsController: {
              create: { type: t['./cats/classes/cat.class.js'].Cat },
              findOne: { type: t['./cats/classes/cat.class.js'].Cat },
              findAll: {},
              createBulk: { type: t['./cats/classes/cat.class.js'].Cat },
              createAsFormData: { type: t['./cats/classes/cat.class.js'].Cat },
              getWithEnumParam: {},
              getWithRandomQuery: {}
            }
          }
        ]
      ]
    }
  };
};
