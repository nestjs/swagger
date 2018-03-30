'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const document_base_1 = require('./fixtures/document.base');
class DocumentBuilder {
  constructor() {
    this.document = document_base_1.documentBase;
  }
  setTitle(title) {
    this.document.info.title = title;
    return this;
  }
  setDescription(description) {
    this.document.info.description = description;
    return this;
  }
  setVersion(version) {
    this.document.info.version = version;
    return this;
  }
  setTermsOfService(termsOfService) {
    this.document.info.termsOfService = termsOfService;
    return this;
  }
  setContactEmail(email) {
    this.document.info.contact = { email };
    return this;
  }
  setLicense(name, url) {
    this.document.info.license = { name, url };
    return this;
  }
  setHost(host) {
    this.document.host = host;
    return this;
  }
  setBasePath(basePath) {
    this.document.basePath = basePath.startsWith('/')
      ? basePath
      : '/' + basePath;
    return this;
  }
  setExternalDoc(description, url) {
    this.document.externalDocs = { description, url };
    return this;
  }
  setSchemes(...schemes) {
    this.document.schemes = schemes;
    return this;
  }
  addTag(name, description = '') {
    this.document.tags = this.document.tags.concat({ name, description });
    return this;
  }
  addBearerAuth(name = 'Authorization', location = 'header', type = 'apiKey') {
    this.document.securityDefinitions.bearer = {
      type,
      name,
      in: location,
    };
    return this;
  }
  addOAuth2(flow = 'password', authorizationUrl, tokenUrl, scopes) {
    this.document.securityDefinitions.oauth2 = {
      type: 'oauth2',
      flow,
      authorizationUrl,
      tokenUrl,
      scopes,
    };
    return this;
  }
  build() {
    return this.document;
  }
}
exports.DocumentBuilder = DocumentBuilder;
