import { compact, head, flatten } from 'lodash';
import { posix } from 'path';
import * as ts from 'typescript';
import { ApiOperation, ApiResponse } from '../../decorators';
import { PluginOptions } from '../merge-options';
import { OPENAPI_NAMESPACE, METADATA_FACTORY_NAME } from '../plugin-constants';
import {
  createLiteralFromAnyValue,
  getDecoratorArguments,
  getDecoratorName,
  getMainCommentOfNode,
  getTsDocErrorsOfNode,
  getTsDocTagsOfNode,
  isGeneric,
  isGenericType,
  getTypeArguments,
  createBooleanLiteral,
  isTypeParameter,
  getText
} from '../utils/ast-utils';
import {
  convertPath,
  getDecoratorOrUndefinedByNames,
  getOutputExtension,
  getTypeReferenceAsString,
  hasPropertyKey
} from '../utils/plugin-utils';
import { typeReferenceToIdentifier } from '../utils/type-reference-to-identifier.util';
import { AbstractFileVisitor } from './abstract.visitor';
import { ModelClassVisitor } from './model-class.visitor';

type ClassMetadata = Record<string, ts.ObjectLiteralExpression>;

export class ControllerClassVisitor extends AbstractFileVisitor {
  private readonly _collectedMetadata: Record<
    string,
    Record<string, ClassMetadata>
  > = {};
  private readonly _typeImports: Record<string, string> = {};
  private readonly _generatedClasses: Map<
    string,
    { baseType: ts.Type; typeArguments: ts.Type[] }
  > = new Map();
  private readonly _modelClassVisitor: ModelClassVisitor;
  private readonly _generatedClassMetadata: Record<
    string,
    Record<string, ts.ObjectLiteralExpression>
  > = {};
  private _currentOptions: PluginOptions = {};

  constructor() {
    super();
    this._modelClassVisitor = new ModelClassVisitor();
  }

  get typeImports() {
    return this._typeImports;
  }

  collectedMetadata(
    options: PluginOptions
  ): Array<[ts.CallExpression, Record<string, ClassMetadata>]> {
    const metadataWithImports = [];
    Object.keys(this._collectedMetadata).forEach((filePath) => {
      const metadata = this._collectedMetadata[filePath];
      const fileExt = options.esmCompatible ? getOutputExtension(filePath) : '';
      const path = filePath.replace(/\.[jt]s$/, fileExt);
      const importExpr = ts.factory.createCallExpression(
        ts.factory.createToken(ts.SyntaxKind.ImportKeyword) as ts.Expression,
        undefined,
        [ts.factory.createStringLiteral(path)]
      );
      metadataWithImports.push([importExpr, metadata]);
    });
    return metadataWithImports;
  }

  visit(
    sourceFile: ts.SourceFile,
    ctx: ts.TransformationContext,
    program: ts.Program,
    options: PluginOptions
  ) {
    const typeChecker = program.getTypeChecker();

    // 현재 options 저장
    this._currentOptions = options;

    // 매번 visit할 때마다 생성된 클래스를 초기화
    this._generatedClasses.clear();

    if (!options.readonly) {
      sourceFile = this.updateImports(sourceFile, ctx.factory, program);
    }

    const visitNode = (node: ts.Node): ts.Node => {
      if (ts.isMethodDeclaration(node)) {
        try {
          const metadata: ClassMetadata = {};
          const updatedNode = this.addDecoratorToNode(
            ctx.factory,
            node,
            typeChecker,
            options,
            sourceFile,
            metadata
          );
          if (!options.readonly) {
            return updatedNode;
          } else {
            const filePath = this.normalizeImportPath(
              options.pathToSource,
              sourceFile.fileName
            );

            if (!this._collectedMetadata[filePath]) {
              this._collectedMetadata[filePath] = {};
            }

            const parent = node.parent as ts.ClassDeclaration;
            const clsName = parent.name?.getText();

            if (clsName) {
              if (!this._collectedMetadata[filePath][clsName]) {
                this._collectedMetadata[filePath][clsName] = {};
              }
              Object.assign(
                this._collectedMetadata[filePath][clsName],
                metadata
              );
            }
          }
        } catch {
          if (!options.readonly) {
            return node;
          }
        }
      }

      if (options.readonly) {
        ts.forEachChild(node, visitNode);
      } else {
        return ts.visitEachChild(node, visitNode, ctx);
      }
    };

    const visitedSourceFile = ts.visitNode(
      sourceFile,
      visitNode
    ) as ts.SourceFile;

    // readonly 모드가 아닐 때만 임시 클래스들을 소스 파일에 추가
    if (!options.readonly) {
      return this.addTemporaryClassesToSourceFile(
        visitedSourceFile,
        ctx.factory,
        typeChecker
      );
    }

    return visitedSourceFile;
  }

  addDecoratorToNode(
    factory: ts.NodeFactory,
    compilerNode: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    options: PluginOptions,
    sourceFile: ts.SourceFile,
    metadata: ClassMetadata
  ): ts.MethodDeclaration {
    const hostFilename = sourceFile.fileName;
    const decorators =
      ts.canHaveDecorators(compilerNode) && ts.getDecorators(compilerNode);

    if (!decorators) {
      return compilerNode;
    }

    const apiOperationDecoratorsArray = this.createApiOperationDecorator(
      factory,
      compilerNode,
      decorators,
      options,
      sourceFile,
      typeChecker,
      metadata
    );

    const apiResponseDecoratorsArray = this.createApiResponseDecorator(
      factory,
      compilerNode,
      options,
      metadata
    );

    const removeExistingApiOperationDecorator =
      apiOperationDecoratorsArray.length > 0;

    const existingDecorators = removeExistingApiOperationDecorator
      ? decorators.filter(
          (item) => getDecoratorName(item) !== ApiOperation.name
        )
      : decorators;

    const modifiers = ts.getModifiers(compilerNode) ?? [];
    const objectLiteralExpr = this.createDecoratorObjectLiteralExpr(
      factory,
      compilerNode,
      typeChecker,
      factory.createNodeArray(),
      hostFilename,
      metadata,
      options
    );
    const updatedDecorators = [
      ...apiOperationDecoratorsArray,
      ...apiResponseDecoratorsArray,
      ...existingDecorators,
      factory.createDecorator(
        factory.createCallExpression(
          factory.createIdentifier(`${OPENAPI_NAMESPACE}.${ApiResponse.name}`),
          undefined,
          [factory.createObjectLiteralExpression(objectLiteralExpr.properties)]
        )
      )
    ];

    if (!options.readonly) {
      return factory.updateMethodDeclaration(
        compilerNode,
        [...updatedDecorators, ...modifiers],
        compilerNode.asteriskToken,
        compilerNode.name,
        compilerNode.questionToken,
        compilerNode.typeParameters,
        compilerNode.parameters,
        compilerNode.type,
        compilerNode.body
      );
    } else {
      return compilerNode;
    }
  }

  createApiOperationDecorator(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    decorators: readonly ts.Decorator[],
    options: PluginOptions,
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker,
    metadata: ClassMetadata
  ) {
    if (!options.introspectComments) {
      return [];
    }

    const apiOperationDecorator = getDecoratorOrUndefinedByNames(
      [ApiOperation.name],
      decorators,
      factory
    );
    let apiOperationExistingProps:
      | ts.NodeArray<ts.PropertyAssignment>
      | undefined = undefined;

    if (apiOperationDecorator && !options.readonly) {
      const apiOperationExpr = head(
        getDecoratorArguments(apiOperationDecorator)
      );
      if (apiOperationExpr) {
        apiOperationExistingProps =
          apiOperationExpr.properties as ts.NodeArray<ts.PropertyAssignment>;
      }
    }

    const extractedComments = getMainCommentOfNode(node);
    if (!extractedComments) {
      return [];
    }
    const properties = [
      ...(apiOperationExistingProps ?? factory.createNodeArray())
    ];

    const tags = getTsDocTagsOfNode(node, typeChecker);
    const hasRemarksKey = hasPropertyKey(
      'description',
      factory.createNodeArray(apiOperationExistingProps)
    );
    if (!hasRemarksKey && tags.remarks) {
      // When the @remarks tag is used in the comment, it will be added to the description property of the @ApiOperation decorator.
      // In this case, even when the "controllerKeyOfComment" option is set to "description", the "summary" property will be used.
      const remarksPropertyAssignment = factory.createPropertyAssignment(
        'description',
        createLiteralFromAnyValue(factory, tags.remarks)
      );
      properties.push(remarksPropertyAssignment);

      if (options.controllerKeyOfComment === 'description') {
        properties.unshift(
          factory.createPropertyAssignment(
            'summary',
            factory.createStringLiteral(extractedComments)
          )
        );
      } else {
        const keyToGenerate = options.controllerKeyOfComment;
        properties.unshift(
          factory.createPropertyAssignment(
            keyToGenerate,
            factory.createStringLiteral(extractedComments)
          )
        );
      }
    } else {
      // No @remarks tag was found in the comment so use the attribute set by the user
      const keyToGenerate = options.controllerKeyOfComment;
      properties.unshift(
        factory.createPropertyAssignment(
          keyToGenerate,
          factory.createStringLiteral(extractedComments)
        )
      );
    }

    const hasDeprecatedKey = hasPropertyKey(
      'deprecated',
      factory.createNodeArray(apiOperationExistingProps)
    );
    if (!hasDeprecatedKey && tags.deprecated) {
      const deprecatedPropertyAssignment = factory.createPropertyAssignment(
        'deprecated',
        createLiteralFromAnyValue(factory, tags.deprecated)
      );
      properties.push(deprecatedPropertyAssignment);
    }

    const objectLiteralExpr = factory.createObjectLiteralExpression(
      compact(properties)
    );
    const apiOperationDecoratorArguments: ts.NodeArray<ts.Expression> =
      factory.createNodeArray([objectLiteralExpr]);

    const methodKey = node.name.getText();
    if (metadata[methodKey]) {
      const existingObjectLiteralExpr = metadata[methodKey];
      const existingProperties = existingObjectLiteralExpr.properties;
      const updatedProperties = factory.createNodeArray([
        ...existingProperties,
        ...compact(properties)
      ]);
      const updatedObjectLiteralExpr =
        factory.createObjectLiteralExpression(updatedProperties);
      metadata[methodKey] = updatedObjectLiteralExpr;
    } else {
      metadata[methodKey] = objectLiteralExpr;
    }

    if (apiOperationDecorator) {
      const expr = apiOperationDecorator.expression as any as ts.CallExpression;
      const updatedCallExpr = factory.updateCallExpression(
        expr,
        expr.expression,
        undefined,
        apiOperationDecoratorArguments
      );
      return [factory.updateDecorator(apiOperationDecorator, updatedCallExpr)];
    } else {
      return [
        factory.createDecorator(
          factory.createCallExpression(
            factory.createIdentifier(
              `${OPENAPI_NAMESPACE}.${ApiOperation.name}`
            ),
            undefined,
            apiOperationDecoratorArguments
          )
        )
      ];
    }
  }

  createApiResponseDecorator(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    options: PluginOptions,
    metadata: ClassMetadata
  ) {
    if (!options.introspectComments) {
      return [];
    }

    const tags = getTsDocErrorsOfNode(node);
    if (!tags.length) {
      return [];
    }

    return tags.map((tag) => {
      const properties = [];
      properties.push(
        factory.createPropertyAssignment(
          'status',
          factory.createNumericLiteral(tag.status)
        )
      );
      properties.push(
        factory.createPropertyAssignment(
          'description',
          factory.createNumericLiteral(tag.description)
        )
      );
      const objectLiteralExpr = factory.createObjectLiteralExpression(
        compact(properties)
      );
      const methodKey = node.name.getText();
      metadata[methodKey] = objectLiteralExpr;

      const apiResponseDecoratorArguments: ts.NodeArray<ts.Expression> =
        factory.createNodeArray([objectLiteralExpr]);
      return factory.createDecorator(
        factory.createCallExpression(
          factory.createIdentifier(`${OPENAPI_NAMESPACE}.${ApiResponse.name}`),
          undefined,
          apiResponseDecoratorArguments
        )
      );
    });
  }

  createDecoratorObjectLiteralExpr(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment> = factory.createNodeArray(),
    hostFilename: string,
    metadata: ClassMetadata,
    options: PluginOptions
  ): ts.ObjectLiteralExpression {
    let properties = [];

    if (!options.readonly && !options.skipAutoHttpCode) {
      properties = properties.concat(
        existingProperties,
        this.createStatusPropertyAssignment(factory, node, existingProperties)
      );
    }

    const signature = typeChecker.getSignatureFromDeclaration(node);
    const type = typeChecker.getReturnTypeOfSignature(signature);

    if (isGenericType(type, typeChecker, 0)) {
      // 제네릭 타입 처리
      const genericTypeProperty = this.createGenericTypePropertyAssignment(
        factory,
        node,
        type,
        typeChecker,
        hostFilename,
        options
      );
      if (genericTypeProperty) {
        properties = properties.concat([genericTypeProperty]);
      }
    } else {
      properties = properties.concat([
        this.createTypePropertyAssignment(
          factory,
          node,
          typeChecker,
          existingProperties,
          hostFilename,
          options
        )
      ]);
    }
    const objectLiteralExpr = factory.createObjectLiteralExpression(
      compact(properties)
    );

    const methodKey = node.name.getText();
    const existingExprOrUndefined = metadata[methodKey];
    if (existingExprOrUndefined) {
      const existingProperties = existingExprOrUndefined.properties;
      const updatedProperties = factory.createNodeArray([
        ...existingProperties,
        ...compact(properties)
      ]);
      const updatedObjectLiteralExpr =
        factory.createObjectLiteralExpression(updatedProperties);
      metadata[methodKey] = updatedObjectLiteralExpr;
    } else {
      metadata[methodKey] = objectLiteralExpr;
    }
    return objectLiteralExpr;
  }

  createTypePropertyAssignment(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
    hostFilename: string,
    options: PluginOptions
  ) {
    if (hasPropertyKey('type', existingProperties)) {
      return undefined;
    }
    const signature = typeChecker.getSignatureFromDeclaration(node);
    const type = typeChecker.getReturnTypeOfSignature(signature);
    if (!type) {
      return undefined;
    }

    const typeReferenceDescriptor = getTypeReferenceAsString(type, typeChecker);
    if (!typeReferenceDescriptor.typeName) {
      return undefined;
    }
    if (typeReferenceDescriptor.typeName.includes('node_modules')) {
      return undefined;
    }
    const identifier = typeReferenceToIdentifier(
      typeReferenceDescriptor,
      hostFilename,
      options,
      factory,
      type,
      this._typeImports
    );
    return factory.createPropertyAssignment('type', identifier);
  }

  createGenericTypePropertyAssignment(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    type: ts.Type,
    typeChecker: ts.TypeChecker,
    hostFilename: string,
    options: PluginOptions
  ) {
    // Promise 타입인 경우 내부 타입을 추출
    const typeSymbol = type.getSymbol();
    if (!typeSymbol) {
      return undefined;
    }

    const typeArguments = getTypeArguments(type);
    if (typeArguments.length === 0) {
      return undefined;
    }

    // Promise 타입인 경우 첫 번째 타입 인수를 사용
    const baseTypeName = typeSymbol.getName();
    if (baseTypeName === 'Promise' && typeArguments.length === 1) {
      const promiseInnerType = typeArguments[0];
      const innerTypeSymbol = promiseInnerType.getSymbol();

      // Promise 내부 타입이 제네릭인지 확인
      if (innerTypeSymbol && isGeneric(promiseInnerType)) {
        const innerTypeArguments = getTypeArguments(promiseInnerType);
        const innerBaseTypeName = innerTypeSymbol.getName();

        // 내부 제네릭 타입의 타입 인수들의 이름 가져오기
        const innerTypeArgumentNames = innerTypeArguments.map(
          (argType: ts.Type) => {
            const argSymbol = argType.getSymbol();
            return argSymbol
              ? argSymbol.getName()
              : typeChecker.typeToString(argType);
          }
        );

        // 임시 클래스 이름 생성 (예: GenericCat_Cat)
        const temporaryClassName = `${innerBaseTypeName}_${innerTypeArgumentNames.join('_')}`;

        // 생성된 클래스 정보 저장
        this._generatedClasses.set(temporaryClassName, {
          baseType: promiseInnerType,
          typeArguments: innerTypeArguments
        });

        // TypeScript import에 추가
        this._typeImports[temporaryClassName] = temporaryClassName;

        // 임시 클래스 식별자 생성
        const identifier = factory.createIdentifier(temporaryClassName);
        return factory.createPropertyAssignment('type', identifier);
      } else if (innerTypeSymbol) {
        // Promise 내부 타입이 일반 타입인 경우 기존 로직 사용
        return this.createTypePropertyAssignment(
          factory,
          node,
          typeChecker,
          factory.createNodeArray(),
          hostFilename,
          options
        );
      }
    }

    // 기타 제네릭 타입 처리
    const typeArgumentNames = typeArguments.map((argType: ts.Type) => {
      const argSymbol = argType.getSymbol();
      return argSymbol
        ? argSymbol.getName()
        : typeChecker.typeToString(argType);
    });

    // 임시 클래스 이름 생성
    const temporaryClassName = `${baseTypeName}_${typeArgumentNames.join('_')}`;

    // 생성된 클래스 정보 저장
    this._generatedClasses.set(temporaryClassName, {
      baseType: type,
      typeArguments: typeArguments
    });

    // TypeScript import에 추가
    this._typeImports[temporaryClassName] = temporaryClassName;

    // 임시 클래스 식별자 생성
    const identifier = factory.createIdentifier(temporaryClassName);
    return factory.createPropertyAssignment('type', identifier);
  }

  createStatusPropertyAssignment(
    factory: ts.NodeFactory,
    node: ts.MethodDeclaration,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>
  ) {
    if (hasPropertyKey('status', existingProperties)) {
      return undefined;
    }
    const statusNode = this.getStatusCodeIdentifier(factory, node);
    return factory.createPropertyAssignment('status', statusNode);
  }

  getStatusCodeIdentifier(factory: ts.NodeFactory, node: ts.MethodDeclaration) {
    const decorators = ts.canHaveDecorators(node) && ts.getDecorators(node);
    const httpCodeDecorator = getDecoratorOrUndefinedByNames(
      ['HttpCode'],
      decorators,
      factory
    );
    if (httpCodeDecorator) {
      const argument = head(getDecoratorArguments(httpCodeDecorator));
      if (argument) {
        return argument;
      }
    }
    const postDecorator = getDecoratorOrUndefinedByNames(
      ['Post'],
      decorators,
      factory
    );
    if (postDecorator) {
      return factory.createIdentifier('201');
    }
    return factory.createIdentifier('200');
  }

  private normalizeImportPath(pathToSource: string, path: string) {
    let relativePath = posix.relative(
      convertPath(pathToSource),
      convertPath(path)
    );
    relativePath = relativePath[0] !== '.' ? './' + relativePath : relativePath;
    return relativePath;
  }

  /**
   * 임시 제네릭 클래스 정의 생성
   */
  private createTemporaryClassDefinition(
    factory: ts.NodeFactory,
    className: string,
    baseType: ts.Type,
    typeArguments: ts.Type[],
    typeChecker: ts.TypeChecker,
    hostFilename: string,
    options: PluginOptions
  ): ts.ClassDeclaration {
    // 베이스 타입의 식별자 생성
    const baseTypeSymbol = baseType.getSymbol();
    if (!baseTypeSymbol) {
      throw new Error('Base type symbol not found');
    }

    const typeReferenceDescriptor = getTypeReferenceAsString(
      baseType,
      typeChecker
    );
    const baseTypeIdentifier = typeReferenceToIdentifier(
      typeReferenceDescriptor,
      hostFilename,
      options,
      factory,
      baseType,
      this._typeImports
    );

    // 타입 인수들의 식별자 생성
    const typeArgumentNodes = typeArguments.map((argType) => {
      const argSymbol = argType.getSymbol();
      const argTypeName = argSymbol
        ? argSymbol.getName()
        : typeChecker.typeToString(argType);
      return factory.createTypeReferenceNode(
        factory.createIdentifier(argTypeName),
        undefined
      );
    });

    // 메타데이터 팩토리 메서드 생성
    const metadataMethod = this.createMetadataFactoryMethod(
      factory,
      className,
      baseType,
      typeArguments,
      typeChecker,
      hostFilename,
      options
    );

    // 클래스 정의 생성
    const classDeclaration = factory.createClassDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)], // export 키워드 추가
      factory.createIdentifier(className),
      undefined, // 타입 매개변수 없음
      [], // 상속 구문
      [metadataMethod] // 메타데이터 팩토리 메서드 포함
    );

    return classDeclaration;
  }

  /**
   * 임시 클래스에 대한 메타데이터 팩토리 메서드 생성
   */
  private createMetadataFactoryMethod(
    factory: ts.NodeFactory,
    className: string,
    baseType: ts.Type,
    typeArguments: ts.Type[],
    typeChecker: ts.TypeChecker,
    hostFilename: string,
    options: PluginOptions
  ): ts.MethodDeclaration {
    // 베이스 타입의 메타데이터를 상속받거나 기본 메타데이터 생성
    const baseTypeMetadata = this.createBaseTypeMetadata(
      factory,
      baseType,
      typeArguments,
      typeChecker,
      hostFilename,
      options
    );

    // 메타데이터 객체 생성
    const returnValue = factory.createObjectLiteralExpression(baseTypeMetadata);

    // static _OPENAPI_METADATA_FACTORY() 메서드 생성
    return factory.createMethodDeclaration(
      [factory.createModifier(ts.SyntaxKind.StaticKeyword)],
      undefined,
      factory.createIdentifier(METADATA_FACTORY_NAME),
      undefined,
      undefined,
      [],
      undefined,
      factory.createBlock([factory.createReturnStatement(returnValue)], true)
    );
  }

  /**
   * 베이스 타입 기반 메타데이터 생성
   */
  private createBaseTypeMetadata(
    factory: ts.NodeFactory,
    baseType: ts.Type,
    typeArguments: ts.Type[],
    typeChecker: ts.TypeChecker,
    hostFilename: string,
    options: PluginOptions
  ): ts.PropertyAssignment[] {
    const properties: ts.PropertyAssignment[] = [];

    // 베이스 타입의 심볼 가져오기
    const baseTypeSymbol = baseType.getSymbol();
    if (!baseTypeSymbol || !baseTypeSymbol.valueDeclaration) {
      return properties;
    }

    // 클래스 선언인지 확인
    const classDeclaration = baseTypeSymbol.valueDeclaration;
    if (!ts.isClassDeclaration(classDeclaration)) {
      return properties;
    }

    // 타입 매개변수 맵 생성
    const typeParameterMap = this.createTypeParameterMapForClass(
      classDeclaration,
      typeArguments,
      typeChecker
    );

    // 클래스의 각 속성에 대해 메타데이터 생성
    for (const member of classDeclaration.members) {
      if (ts.isPropertyDeclaration(member)) {
        const propertyName = member.name?.getText();
        if (!propertyName) continue;

        // 정적 속성은 제외
        const isStatic = member.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword
        );
        if (isStatic) continue;

        // private 속성은 제외
        if (ts.isPrivateIdentifier(member.name)) continue;

        // 속성의 메타데이터 생성
        const propertyMetadata = this.createPropertyMetadata(
          factory,
          member,
          typeChecker,
          typeParameterMap,
          hostFilename,
          options
        );

        if (propertyMetadata) {
          properties.push(
            factory.createPropertyAssignment(
              factory.createIdentifier(propertyName),
              propertyMetadata
            )
          );
        }
      }
    }

    return properties;
  }

  /**
   * 클래스의 타입 매개변수 맵 생성
   */
  private createTypeParameterMapForClass(
    classDeclaration: ts.ClassDeclaration,
    typeArguments: ts.Type[],
    typeChecker: ts.TypeChecker
  ): Map<string, { typeName: string }> {
    const map = new Map<string, { typeName: string }>();

    if (classDeclaration.typeParameters) {
      classDeclaration.typeParameters.forEach((typeParam, index) => {
        if (index < typeArguments.length) {
          const paramName = typeParam.name.getText();
          const typeDescriptor = getTypeReferenceAsString(
            typeArguments[index],
            typeChecker
          );
          const argTypeName = typeDescriptor.typeName;
          map.set(paramName, typeDescriptor);
        }
      });
    }

    return map;
  }

  /**
   * 속성별 메타데이터 생성
   */
  private createPropertyMetadata(
    factory: ts.NodeFactory,
    property: ts.PropertyDeclaration,
    typeChecker: ts.TypeChecker,
    typeParameterMap: Map<string, { typeName: string }>,
    hostFilename: string,
    options: PluginOptions
  ): ts.ObjectLiteralExpression | null {
    const properties: ts.PropertyAssignment[] = [];

    // required 속성 추가
    const isRequired = !property.questionToken;
    properties.push(
      factory.createPropertyAssignment(
        'required',
        createBooleanLiteral(factory, isRequired)
      )
    );

    // 타입 속성 추가
    const typeProperty = this.createTypePropertyForProperty(
      factory,
      property,
      typeChecker,
      typeParameterMap,
      hostFilename,
      options
    );

    if (typeProperty) {
      properties.push(typeProperty);
    }

    return factory.createObjectLiteralExpression(compact(properties));
  }

  /**
   * 속성의 타입 정보 생성
   */
  private createTypePropertyForProperty(
    factory: ts.NodeFactory,
    property: ts.PropertyDeclaration,
    typeChecker: ts.TypeChecker,
    typeParameterMap: Map<string, { typeName: string }>,
    hostFilename: string,
    options: PluginOptions
  ): ts.PropertyAssignment | null {
    if (!property.type) return null;

    // 속성의 타입을 가져오기
    const type = typeChecker.getTypeAtLocation(property.type);
    if (!type) return null;

    // 타입 매개변수 치환 후 타입 참조 문자열 생성
    const resolvedTypeName = this.resolvePropertyType(
      property.type,
      typeParameterMap,
      typeChecker
    );

    if (resolvedTypeName) {
      // 치환된 타입의 실제 타입 정보 찾기
      let targetType = type;

      // getTypeReferenceAsString을 사용하여 올바른 타입 참조 생성
      const typeReferenceDescriptor = typeParameterMap.has(resolvedTypeName)
        ? typeParameterMap.get(resolvedTypeName)!
        : getTypeReferenceAsString(targetType, typeChecker);

      if (typeReferenceDescriptor.typeName) {
        // ModelClassVisitor와 같은 방식으로 식별자 생성
        const identifier = typeReferenceToIdentifier(
          typeReferenceDescriptor,
          hostFilename,
          options,
          factory,
          targetType,
          this._typeImports
        );

        const initializer = factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          undefined,
          identifier
        );

        return factory.createPropertyAssignment('type', initializer);
      } else {
        // fallback: 단순한 타입 이름 사용
        return factory.createPropertyAssignment(
          'type',
          factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            undefined,
            factory.createIdentifier(resolvedTypeName)
          )
        );
      }
    }

    return null;
  }

  /**
   * 속성 타입을 실제 타입으로 치환
   */
  private resolvePropertyType(
    typeNode: ts.TypeNode,
    typeParameterMap: Map<string, { typeName: string }>,
    typeChecker: ts.TypeChecker
  ): string | null {
    if (ts.isTypeReferenceNode(typeNode)) {
      const typeName = typeNode.typeName.getText();

      // 타입 매개변수인 경우 치환
      if (typeName in typeParameterMap) {
        return typeParameterMap.get(typeName)!.typeName;
      }

      return typeName;
    }

    // 기타 타입 노드 처리
    return typeNode.getText();
  }

  /**
   * 소스 파일에 임시 클래스들을 추가
   */
  private addTemporaryClassesToSourceFile(
    sourceFile: ts.SourceFile,
    factory: ts.NodeFactory,
    typeChecker: ts.TypeChecker
  ): ts.SourceFile {
    if (this._generatedClasses.size === 0) {
      return sourceFile;
    }

    const statements = [...sourceFile.statements];

    // 임포트문의 마지막 인덱스 찾기
    let lastImportIndex = -1;
    for (let i = 0; i < statements.length; i++) {
      if (ts.isImportDeclaration(statements[i])) {
        lastImportIndex = i;
      } else if (lastImportIndex >= 0) {
        // 임포트문이 아닌 다른 문을 만나면 중단
        break;
      }
    }

    // 임시 클래스들 생성
    const temporaryClasses: ts.ClassDeclaration[] = [];
    this._generatedClasses.forEach(({ baseType, typeArguments }, className) => {
      const classDeclaration = this.createTemporaryClassDefinition(
        factory,
        className,
        baseType,
        typeArguments,
        typeChecker,
        sourceFile.fileName,
        this._currentOptions
      );
      temporaryClasses.push(classDeclaration);
    });

    // 임포트문 뒤에 임시 클래스들 삽입
    const insertIndex = lastImportIndex + 1;
    const newStatements = [
      ...statements.slice(0, insertIndex),
      ...temporaryClasses,
      ...statements.slice(insertIndex)
    ];

    return factory.updateSourceFile(sourceFile, newStatements);
  }
}
