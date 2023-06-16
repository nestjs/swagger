// @ts-nocheck
export default async () => {
  const t = {
    ['./cats/dto/pagination-query.dto']: await import(
      './cats/dto/pagination-query.dto'
    ).then((f) => f.LettersEnum),
    ['./cats/dto/tag.dto']: await import('./cats/dto/tag.dto').then(
      (f) => f.TagDto
    )
  };
  return {
    '@nestjs/swagger': {
      models: [
        [
          import('./cats/dto/pagination-query.dto'),
          {
            PaginationQuery: {
              page: { required: true, type: () => Number },
              sortBy: { required: true, type: () => [String] },
              limit: { required: true, type: () => Number },
              enum: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto']
              },
              enumArr: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto'],
                isArray: true
              },
              letters: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto'],
                isArray: true
              },
              beforeDate: { required: true, type: () => Date },
              filter: { required: true, type: () => Object }
            }
          }
        ],
        [
          import('./cats/classes/cat.class'),
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
                enum: t['./cats/dto/pagination-query.dto']
              },
              enumArr: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto']
              }
            }
          }
        ],
        [
          import('./cats/dto/extra-model.dto'),
          {
            ExtraModel: {
              one: { required: true, type: () => String },
              two: { required: true, type: () => Number }
            }
          }
        ],
        [
          import('./cats/dto/tag.dto'),
          { TagDto: { name: { required: true, type: () => String } } }
        ],
        [
          import('./cats/dto/create-cat.dto'),
          {
            CreateCatDto: {
              name: { required: true, type: () => String },
              age: { required: true, type: () => Number },
              breed: { required: true, type: () => String },
              tags: { required: false, type: () => [String] },
              createdAt: { required: true, type: () => Date },
              urls: { required: false, type: () => [String] },
              options: { required: false, type: () => [Object] },
              enum: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto']
              },
              enumArr: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto']
              },
              enumArr2: {
                required: true,
                enum: t['./cats/dto/pagination-query.dto'],
                isArray: true
              },
              tag: { required: true, type: () => t['./cats/dto/tag.dto'] },
              multipleTags: {
                required: true,
                type: () => [t['./cats/dto/tag.dto']]
              },
              nested: {
                required: true,
                type: () => ({
                  first: { required: true, type: () => String },
                  second: { required: true, type: () => Number }
                })
              }
            }
          }
        ]
      ],
      controllers: [
        [
          import('./app.controller'),
          {
            AppController: {
              getHello: {
                description: 'Says hello',
                deprecated: true,
                type: String
              },
              withAliases: { type: String },
              withColonExpress: { type: String },
              withColonFastify: { type: String }
            }
          }
        ],
        [
          import('./cats/cats.controller'),
          {
            CatsController: {
              create: { type: t['./cats/classes/cat.class'] },
              findOne: { type: t['./cats/classes/cat.class'] },
              findAll: {},
              createBulk: { type: t['./cats/classes/cat.class'] },
              createAsFormData: { type: t['./cats/classes/cat.class'] },
              getWithEnumParam: {},
              getWithRandomQuery: {}
            }
          }
        ]
      ]
    }
  };
};
