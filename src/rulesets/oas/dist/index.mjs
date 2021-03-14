import * as AJV from 'ajv';
import * as betterAjvErrors from '@stoplight/better-ajv-errors';
import { pointerToPath, extractPointerFromRef } from '@stoplight/json';
import '@stoplight/path';

function isObject(value) {
    return value !== null && typeof value === 'object';
}

const oasOpSuccessResponse = targetVal => {
    if (!isObject(targetVal)) {
        return;
    }
    for (const response of Object.keys(targetVal)) {
        if (Number(response) >= 200 && Number(response) < 400) {
            return;
        }
    }
    return [
        {
            message: 'operations must define at least one 2xx or 3xx response',
        },
    ];
};

const isOpenApiv2 = (document) => isObject(document) && 'swagger' in document && parseInt(String(document.swagger)) === 2;
const isOpenApiv3 = (document) => isObject(document) && 'openapi' in document && parseFloat(String(document.openapi)) === 3;

const validConsumeValue = /(application\/x-www-form-urlencoded|multipart\/form-data)/;
const oasOpFormDataConsumeCheck = targetVal => {
    const parameters = targetVal.parameters;
    const consumes = targetVal.consumes;
    if (!Array.isArray(parameters) || !Array.isArray(consumes)) {
        return;
    }
    if (parameters.some(p => (p === null || p === void 0 ? void 0 : p.in) === 'formData') && !validConsumeValue.test(consumes === null || consumes === void 0 ? void 0 : consumes.join(','))) {
        return [
            {
                message: 'Consumes must include urlencoded, multipart, or form-data media type when using formData parameter.',
            },
        ];
    }
    return;
};

const compare = (a, b) => {
    if ((typeof a === 'number' || Number.isNaN(Number(a))) && (typeof b === 'number' || !Number.isNaN(Number(b)))) {
        return Math.min(1, Math.max(-1, Number(a) - Number(b)));
    }
    if (typeof a !== 'string' || typeof b !== 'string') {
        return 0;
    }
    return a.localeCompare(b);
};
const getUnsortedItems = (arr, compareFn) => {
    for (let i = 0; i < arr.length - 1; i += 1) {
        if (compareFn(arr[i], arr[i + 1]) >= 1) {
            return [i, i + 1];
        }
    }
    return null;
};
const alphabetical = (targetVal, opts, paths, { documentInventory }) => {
    var _a, _b, _c;
    if (!isObject(targetVal))
        return;
    let targetArray;
    if (Array.isArray(targetVal)) {
        targetArray = targetVal;
    }
    else {
        targetVal = (_b = (_a = documentInventory.findAssociatedItemForPath(paths.given, true)) === null || _a === void 0 ? void 0 : _a.document.trapAccess(targetVal)) !== null && _b !== void 0 ? _b : targetVal;
        targetArray = Object.keys(targetVal);
    }
    if (targetArray.length < 2) {
        return;
    }
    const keyedBy = opts === null || opts === void 0 ? void 0 : opts.keyedBy;
    const unsortedItems = getUnsortedItems(targetArray, keyedBy !== void 0
        ? (a, b) => {
            if (!isObject(a) || !isObject(b))
                return 0;
            return compare(a[keyedBy], b[keyedBy]);
        }
        :
            compare);
    if (unsortedItems != null) {
        const path = (_c = paths.target) !== null && _c !== void 0 ? _c : paths.given;
        return [
            Object.assign(Object.assign({}, (keyedBy === void 0
                ? {
                    path: [...path, Array.isArray(targetVal) ? unsortedItems[0] : targetArray[unsortedItems[0]]],
                }
                : null)), { message: keyedBy !== void 0
                    ? 'properties are not in alphabetical order'
                    : `at least 2 properties are not in alphabetical order: "${targetArray[unsortedItems[0]]}" should be placed after "${targetArray[unsortedItems[1]]}"` }),
        ];
    }
    return;
};

var CasingType;
(function (CasingType) {
    CasingType["flat"] = "flat";
    CasingType["camel"] = "camel";
    CasingType["pascal"] = "pascal";
    CasingType["kebab"] = "kebab";
    CasingType["cobol"] = "cobol";
    CasingType["snake"] = "snake";
    CasingType["macro"] = "macro";
})(CasingType || (CasingType = {}));
const CASES = {
    [CasingType.flat]: '[a-z][a-z{__DIGITS__}]*',
    [CasingType.camel]: '[a-z][a-z{__DIGITS__}]*(?:[A-Z{__DIGITS__}][a-z{__DIGITS__}]+)*',
    [CasingType.pascal]: '[A-Z][a-z{__DIGITS__}]*(?:[A-Z{__DIGITS__}][a-z{__DIGITS__}]+)*',
    [CasingType.kebab]: '[a-z][a-z{__DIGITS__}]*(?:-[a-z{__DIGITS__}]+)*',
    [CasingType.cobol]: '[A-Z][A-Z{__DIGITS__}]*(?:-[A-Z{__DIGITS__}]+)*',
    [CasingType.snake]: '[a-z][a-z{__DIGITS__}]*(?:_[a-z{__DIGITS__}]+)*',
    [CasingType.macro]: '[A-Z][A-Z{__DIGITS__}]*(?:_[A-Z{__DIGITS__}]+)*',
};

const length = (targetVal, opts) => {
    if (targetVal === void 0 || targetVal === null)
        return;
    const { min, max } = opts;
    let value;
    const valueType = typeof targetVal;
    if (valueType === 'object') {
        value = Object.keys(targetVal).length;
    }
    else if (Array.isArray(targetVal)) {
        value = targetVal.length + 1;
    }
    else if (valueType === 'number') {
        value = targetVal;
    }
    else if (valueType === 'string') {
        value = targetVal.length;
    }
    if (typeof value === 'undefined')
        return;
    const results = [];
    if (typeof min !== 'undefined' && value < min) {
        results.push({
            message: `min length is ${min}`,
        });
    }
    if (typeof max !== 'undefined' && value > max) {
        results.push({
            message: `max length is ${max}`,
        });
    }
    return results;
};

const REGEXP_PATTERN = /^\/(.+)\/([a-z]*)$/;
function getFromCache(cache, pattern) {
    const existingPattern = cache.get(pattern);
    if (existingPattern !== void 0) {
        return existingPattern;
    }
    const newPattern = createRegex(pattern);
    cache.set(pattern, newPattern);
    return newPattern;
}
function createRegex(pattern) {
    const splitRegex = REGEXP_PATTERN.exec(pattern);
    if (splitRegex !== null) {
        return new RegExp(splitRegex[1], splitRegex[2]);
    }
    else {
        return new RegExp(pattern);
    }
}
const pattern = function (targetVal, opts) {
    if (typeof targetVal !== 'string')
        return;
    let results;
    const { match, notMatch } = opts;
    const cache = this.cache;
    if (match !== void 0) {
        const pattern = getFromCache(cache, match);
        if (!pattern.test(targetVal)) {
            results = [
                {
                    message: `must match the pattern '${match}'`,
                },
            ];
        }
    }
    if (notMatch !== void 0) {
        const pattern = getFromCache(cache, notMatch);
        if (pattern.test(targetVal)) {
            const result = {
                message: `must not match the pattern '${notMatch}'`,
            };
            if (results === void 0) {
                results = [result];
            }
            else {
                results.push(result);
            }
        }
    }
    return results;
};

var id = "http://json-schema.org/draft-04/schema#";
var $schema = "http://json-schema.org/draft-04/schema#";
var description = "Core schema meta-schema";
var definitions = {
	schemaArray: {
		type: "array",
		minItems: 1,
		items: {
			$ref: "#"
		}
	},
	positiveInteger: {
		type: "integer",
		minimum: 0
	},
	positiveIntegerDefault0: {
		allOf: [
			{
				$ref: "#/definitions/positiveInteger"
			},
			{
				"default": 0
			}
		]
	},
	simpleTypes: {
		"enum": [
			"array",
			"boolean",
			"integer",
			"null",
			"number",
			"object",
			"string"
		]
	},
	stringArray: {
		type: "array",
		items: {
			type: "string"
		},
		minItems: 1,
		uniqueItems: true
	}
};
var type = "object";
var properties = {
	id: {
		type: "string"
	},
	$schema: {
		type: "string"
	},
	title: {
		type: "string"
	},
	description: {
		type: "string"
	},
	"default": {
	},
	multipleOf: {
		type: "number",
		minimum: 0,
		exclusiveMinimum: true
	},
	maximum: {
		type: "number"
	},
	exclusiveMaximum: {
		type: "boolean",
		"default": false
	},
	minimum: {
		type: "number"
	},
	exclusiveMinimum: {
		type: "boolean",
		"default": false
	},
	maxLength: {
		$ref: "#/definitions/positiveInteger"
	},
	minLength: {
		$ref: "#/definitions/positiveIntegerDefault0"
	},
	pattern: {
		type: "string",
		format: "regex"
	},
	additionalItems: {
		anyOf: [
			{
				type: "boolean"
			},
			{
				$ref: "#"
			}
		],
		"default": {
		}
	},
	items: {
		anyOf: [
			{
				$ref: "#"
			},
			{
				$ref: "#/definitions/schemaArray"
			}
		],
		"default": {
		}
	},
	maxItems: {
		$ref: "#/definitions/positiveInteger"
	},
	minItems: {
		$ref: "#/definitions/positiveIntegerDefault0"
	},
	uniqueItems: {
		type: "boolean",
		"default": false
	},
	maxProperties: {
		$ref: "#/definitions/positiveInteger"
	},
	minProperties: {
		$ref: "#/definitions/positiveIntegerDefault0"
	},
	required: {
		$ref: "#/definitions/stringArray"
	},
	additionalProperties: {
		anyOf: [
			{
				type: "boolean"
			},
			{
				$ref: "#"
			}
		],
		"default": {
		}
	},
	definitions: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	properties: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	patternProperties: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	dependencies: {
		type: "object",
		additionalProperties: {
			anyOf: [
				{
					$ref: "#"
				},
				{
					$ref: "#/definitions/stringArray"
				}
			]
		}
	},
	"enum": {
		type: "array",
		minItems: 1,
		uniqueItems: true
	},
	type: {
		anyOf: [
			{
				$ref: "#/definitions/simpleTypes"
			},
			{
				type: "array",
				items: {
					$ref: "#/definitions/simpleTypes"
				},
				minItems: 1,
				uniqueItems: true
			}
		]
	},
	format: {
		type: "string"
	},
	allOf: {
		$ref: "#/definitions/schemaArray"
	},
	anyOf: {
		$ref: "#/definitions/schemaArray"
	},
	oneOf: {
		$ref: "#/definitions/schemaArray"
	},
	not: {
		$ref: "#"
	}
};
var dependencies = {
	exclusiveMaximum: [
		"maximum"
	],
	exclusiveMinimum: [
		"minimum"
	]
};
var jsonSchemaDraft04 = {
	id: id,
	$schema: $schema,
	description: description,
	definitions: definitions,
	type: type,
	properties: properties,
	dependencies: dependencies,
	"default": {
}
};

var jsonSpecV4 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  id: id,
  $schema: $schema,
  description: description,
  definitions: definitions,
  type: type,
  properties: properties,
  dependencies: dependencies,
  'default': jsonSchemaDraft04
});

var $schema$1 = "http://json-schema.org/draft-06/schema#";
var $id = "http://json-schema.org/draft-06/schema#";
var title = "Core schema meta-schema";
var definitions$1 = {
	schemaArray: {
		type: "array",
		minItems: 1,
		items: {
			$ref: "#"
		}
	},
	nonNegativeInteger: {
		type: "integer",
		minimum: 0
	},
	nonNegativeIntegerDefault0: {
		allOf: [
			{
				$ref: "#/definitions/nonNegativeInteger"
			},
			{
				"default": 0
			}
		]
	},
	simpleTypes: {
		"enum": [
			"array",
			"boolean",
			"integer",
			"null",
			"number",
			"object",
			"string"
		]
	},
	stringArray: {
		type: "array",
		items: {
			type: "string"
		},
		uniqueItems: true,
		"default": [
		]
	}
};
var type$1 = [
	"object",
	"boolean"
];
var properties$1 = {
	$id: {
		type: "string",
		format: "uri-reference"
	},
	$schema: {
		type: "string",
		format: "uri"
	},
	$ref: {
		type: "string",
		format: "uri-reference"
	},
	title: {
		type: "string"
	},
	description: {
		type: "string"
	},
	"default": {
	},
	examples: {
		type: "array",
		items: {
		}
	},
	multipleOf: {
		type: "number",
		exclusiveMinimum: 0
	},
	maximum: {
		type: "number"
	},
	exclusiveMaximum: {
		type: "number"
	},
	minimum: {
		type: "number"
	},
	exclusiveMinimum: {
		type: "number"
	},
	maxLength: {
		$ref: "#/definitions/nonNegativeInteger"
	},
	minLength: {
		$ref: "#/definitions/nonNegativeIntegerDefault0"
	},
	pattern: {
		type: "string",
		format: "regex"
	},
	additionalItems: {
		$ref: "#"
	},
	items: {
		anyOf: [
			{
				$ref: "#"
			},
			{
				$ref: "#/definitions/schemaArray"
			}
		],
		"default": {
		}
	},
	maxItems: {
		$ref: "#/definitions/nonNegativeInteger"
	},
	minItems: {
		$ref: "#/definitions/nonNegativeIntegerDefault0"
	},
	uniqueItems: {
		type: "boolean",
		"default": false
	},
	contains: {
		$ref: "#"
	},
	maxProperties: {
		$ref: "#/definitions/nonNegativeInteger"
	},
	minProperties: {
		$ref: "#/definitions/nonNegativeIntegerDefault0"
	},
	required: {
		$ref: "#/definitions/stringArray"
	},
	additionalProperties: {
		$ref: "#"
	},
	definitions: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	properties: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	patternProperties: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	dependencies: {
		type: "object",
		additionalProperties: {
			anyOf: [
				{
					$ref: "#"
				},
				{
					$ref: "#/definitions/stringArray"
				}
			]
		}
	},
	propertyNames: {
		$ref: "#"
	},
	"const": {
	},
	"enum": {
		type: "array",
		minItems: 1,
		uniqueItems: true
	},
	type: {
		anyOf: [
			{
				$ref: "#/definitions/simpleTypes"
			},
			{
				type: "array",
				items: {
					$ref: "#/definitions/simpleTypes"
				},
				minItems: 1,
				uniqueItems: true
			}
		]
	},
	format: {
		type: "string"
	},
	allOf: {
		$ref: "#/definitions/schemaArray"
	},
	anyOf: {
		$ref: "#/definitions/schemaArray"
	},
	oneOf: {
		$ref: "#/definitions/schemaArray"
	},
	not: {
		$ref: "#"
	}
};
var jsonSchemaDraft06 = {
	$schema: $schema$1,
	$id: $id,
	title: title,
	definitions: definitions$1,
	type: type$1,
	properties: properties$1,
	"default": {
}
};

var jsonSpecV6 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $schema: $schema$1,
  $id: $id,
  title: title,
  definitions: definitions$1,
  type: type$1,
  properties: properties$1,
  'default': jsonSchemaDraft06
});

var $schema$2 = "http://json-schema.org/draft-07/schema#";
var $id$1 = "http://json-schema.org/draft-07/schema#";
var title$1 = "Core schema meta-schema";
var definitions$2 = {
	schemaArray: {
		type: "array",
		minItems: 1,
		items: {
			$ref: "#"
		}
	},
	nonNegativeInteger: {
		type: "integer",
		minimum: 0
	},
	nonNegativeIntegerDefault0: {
		allOf: [
			{
				$ref: "#/definitions/nonNegativeInteger"
			},
			{
				"default": 0
			}
		]
	},
	simpleTypes: {
		"enum": [
			"array",
			"boolean",
			"integer",
			"null",
			"number",
			"object",
			"string"
		]
	},
	stringArray: {
		type: "array",
		items: {
			type: "string"
		},
		uniqueItems: true,
		"default": [
		]
	}
};
var type$2 = [
	"object",
	"boolean"
];
var properties$2 = {
	$id: {
		type: "string",
		format: "uri-reference"
	},
	$schema: {
		type: "string",
		format: "uri"
	},
	$ref: {
		type: "string",
		format: "uri-reference"
	},
	$comment: {
		type: "string"
	},
	title: {
		type: "string"
	},
	description: {
		type: "string"
	},
	"default": true,
	readOnly: {
		type: "boolean",
		"default": false
	},
	examples: {
		type: "array",
		items: true
	},
	multipleOf: {
		type: "number",
		exclusiveMinimum: 0
	},
	maximum: {
		type: "number"
	},
	exclusiveMaximum: {
		type: "number"
	},
	minimum: {
		type: "number"
	},
	exclusiveMinimum: {
		type: "number"
	},
	maxLength: {
		$ref: "#/definitions/nonNegativeInteger"
	},
	minLength: {
		$ref: "#/definitions/nonNegativeIntegerDefault0"
	},
	pattern: {
		type: "string",
		format: "regex"
	},
	additionalItems: {
		$ref: "#"
	},
	items: {
		anyOf: [
			{
				$ref: "#"
			},
			{
				$ref: "#/definitions/schemaArray"
			}
		],
		"default": true
	},
	maxItems: {
		$ref: "#/definitions/nonNegativeInteger"
	},
	minItems: {
		$ref: "#/definitions/nonNegativeIntegerDefault0"
	},
	uniqueItems: {
		type: "boolean",
		"default": false
	},
	contains: {
		$ref: "#"
	},
	maxProperties: {
		$ref: "#/definitions/nonNegativeInteger"
	},
	minProperties: {
		$ref: "#/definitions/nonNegativeIntegerDefault0"
	},
	required: {
		$ref: "#/definitions/stringArray"
	},
	additionalProperties: {
		$ref: "#"
	},
	definitions: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	properties: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		"default": {
		}
	},
	patternProperties: {
		type: "object",
		additionalProperties: {
			$ref: "#"
		},
		propertyNames: {
			format: "regex"
		},
		"default": {
		}
	},
	dependencies: {
		type: "object",
		additionalProperties: {
			anyOf: [
				{
					$ref: "#"
				},
				{
					$ref: "#/definitions/stringArray"
				}
			]
		}
	},
	propertyNames: {
		$ref: "#"
	},
	"const": true,
	"enum": {
		type: "array",
		items: true,
		minItems: 1,
		uniqueItems: true
	},
	type: {
		anyOf: [
			{
				$ref: "#/definitions/simpleTypes"
			},
			{
				type: "array",
				items: {
					$ref: "#/definitions/simpleTypes"
				},
				minItems: 1,
				uniqueItems: true
			}
		]
	},
	format: {
		type: "string"
	},
	contentMediaType: {
		type: "string"
	},
	contentEncoding: {
		type: "string"
	},
	"if": {
		$ref: "#"
	},
	then: {
		$ref: "#"
	},
	"else": {
		$ref: "#"
	},
	allOf: {
		$ref: "#/definitions/schemaArray"
	},
	anyOf: {
		$ref: "#/definitions/schemaArray"
	},
	oneOf: {
		$ref: "#/definitions/schemaArray"
	},
	not: {
		$ref: "#"
	}
};
var jsonSchemaDraft07 = {
	$schema: $schema$2,
	$id: $id$1,
	title: title$1,
	definitions: definitions$2,
	type: type$2,
	properties: properties$2,
	"default": true
};

var jsonSpecV7 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  $schema: $schema$2,
  $id: $id$1,
  title: title$1,
  definitions: definitions$2,
  type: type$2,
  properties: properties$2,
  'default': jsonSchemaDraft07
});

const logger = {
    warn(...args) {
        const firstArg = args[0];
        if (typeof firstArg === 'string') {
            if (firstArg.startsWith('unknown format'))
                return;
            console.warn(...args);
        }
    },
    log: console.log,
    error: console.error,
};
const ajvInstances = {};
function getAjv(oasVersion, allErrors) {
    const type = oasVersion !== void 0 && oasVersion >= 2 ? 'oas' + oasVersion : 'jsonschema';
    if (typeof ajvInstances[type] !== 'undefined') {
        return ajvInstances[type];
    }
    const ajvOpts = {
        meta: true,
        schemaId: 'auto',
        allErrors,
        jsonPointers: true,
        unknownFormats: 'ignore',
        nullable: oasVersion === 3,
        xNullable: oasVersion === 2,
        logger,
    };
    const ajv = schema.createAJVInstance(ajvOpts);
    ajv.addMetaSchema(jsonSpecV4);
    ajv.addMetaSchema(jsonSpecV6);
    ajv._opts.defaultMeta = id;
    ajv._refs['http://json-schema.org/schema'] = 'http://json-schema.org/draft-04/schema';
    ajvInstances[type] = ajv;
    return ajv;
}
function getSchemaId(schemaObj) {
    if ('$id' in schemaObj) {
        return schemaObj.$id;
    }
    if ('id' in schemaObj) {
        return schemaObj.id;
    }
}
const validators = new (class extends WeakMap {
    get({ schema: schemaObj, oasVersion, allErrors }) {
        const ajv = getAjv(oasVersion, allErrors);
        const schemaId = getSchemaId(schemaObj);
        let validator;
        try {
            validator = schemaId !== void 0 ? ajv.getSchema(schemaId) : void 0;
        }
        catch (_a) {
            validator = void 0;
        }
        if (validator !== void 0) {
            return validator;
        }
        validator = super.get(schemaObj);
        if (validator === void 0) {
            validator = ajv.compile(schemaObj);
            super.set(schemaObj, validator);
        }
        return validator;
    }
})();
const schema = (targetVal, opts, paths, { rule }) => {
    var _a, _b, _c;
    const path = (_a = paths.target) !== null && _a !== void 0 ? _a : paths.given;
    if (targetVal === void 0) {
        return [
            {
                path,
                message: `#{{print("property")}}does not exist`,
            },
        ];
    }
    const results = [];
    const { schema: schemaObj } = opts;
    try {
        const validator = (_b = opts.ajv) !== null && _b !== void 0 ? _b : validators.get(opts);
        if (validator(targetVal) === false && Array.isArray(validator.errors)) {
            (_c = opts.prepareResults) === null || _c === void 0 ? void 0 : _c.call(opts, validator.errors);
            results.push(...betterAjvErrors(schemaObj, validator.errors, {
                propertyPath: path,
                targetValue: targetVal,
            }).map(({ suggestion, error, path: errorPath }) => ({
                message: suggestion !== void 0 ? `${error}. ${suggestion}` : error,
                path: [...path, ...(errorPath !== '' ? errorPath.replace(/^\//, '').split('/') : [])],
            })));
        }
    }
    catch (ex) {
        if (!(ex instanceof AJV.MissingRefError)) {
            throw ex;
        }
        else if (!rule.resolved) {
            results.push({
                message: ex.message,
                path,
            });
        }
    }
    return results;
};
schema.Ajv = AJV;
schema.createAJVInstance = (opts) => {
    const ajv = new AJV(opts);
    ajv.addFormat('int32', { type: 'number', validate: oasFormatValidator.int32 });
    ajv.addFormat('int64', { type: 'number', validate: oasFormatValidator.int64 });
    ajv.addFormat('float', { type: 'number', validate: oasFormatValidator.float });
    ajv.addFormat('double', { type: 'number', validate: oasFormatValidator.double });
    ajv.addFormat('byte', { type: 'string', validate: oasFormatValidator.byte });
    return ajv;
};
schema.specs = {
    v4: jsonSpecV4,
    v6: jsonSpecV6,
    v7: jsonSpecV7,
};

const truthy = (targetVal) => {
    if (!targetVal) {
        return [
            {
                message: '#{{print("property")}}is not truthy',
            },
        ];
    }
};

const undefined$1 = (targetVal) => {
    if (typeof targetVal !== 'undefined') {
        return [
            {
                message: '#{{print("property")}}should be undefined',
            },
        ];
    }
};

const safePointerToPath = (pointer) => {
    const rawPointer = extractPointerFromRef(pointer);
    return rawPointer !== null ? pointerToPath(rawPointer) : [];
};

const unreferencedReusableObject = (data, opts, _paths, otherValues) => {
    var _a;
    if (!isObject(data))
        return;
    const graph = otherValues.documentInventory.graph;
    if (graph === null) {
        return [{ message: 'unreferencedReusableObject requires dependency graph' }];
    }
    const normalizedSource = (_a = otherValues.documentInventory.source) !== null && _a !== void 0 ? _a : '';
    const defined = Object.keys(data).map(name => `${normalizedSource}${opts.reusableObjectsLocation}/${name}`);
    const orphans = defined.filter(defPath => !graph.hasNode(defPath));
    return orphans.map(orphanPath => {
        return {
            message: 'Potential orphaned reusable object has been detected.',
            path: safePointerToPath(orphanPath),
        };
    });
};

const xor = (targetVal, opts) => {
    const { properties } = opts;
    if (targetVal === null || typeof targetVal !== 'object' || properties.length !== 2)
        return;
    const results = [];
    const intersection = Object.keys(targetVal).filter(value => -1 !== properties.indexOf(value));
    if (intersection.length !== 1) {
        results.push({
            message: `${properties[0]} and ${properties[1]} cannot be both defined or both undefined`,
        });
    }
    return results;
};

function computeFingerprint(param) {
    return `${param.in}-${param.name}`;
}
const oasOpParams = (params, _opts, { given }) => {
    if (!Array.isArray(params))
        return;
    if (params.length < 2)
        return;
    const results = [];
    const count = {
        body: [],
        formData: [],
    };
    const list = [];
    const duplicates = [];
    let index = -1;
    for (const param of params) {
        index++;
        if (param === null || typeof param !== 'object')
            continue;
        if ('$ref' in param)
            continue;
        const fingerprint = computeFingerprint(param);
        if (list.includes(fingerprint)) {
            duplicates.push(index);
        }
        else {
            list.push(fingerprint);
        }
        if (param.in in count) {
            count[param.in].push(index);
        }
    }
    if (duplicates.length > 0) {
        for (const i of duplicates) {
            results.push({
                message: 'A parameter in this operation already exposes the same combination of `name` and `in` values.',
                path: [...given, i],
            });
        }
    }
    if (count.body.length > 0 && count.formData.length > 0) {
        results.push({
            message: 'Operation cannot have both `in:body` and `in:formData` parameters.',
        });
    }
    if (count.body.length > 1) {
        for (let i = 1; i < count.body.length; i++) {
            results.push({
                message: 'Operation has already at least one instance of the `in:body` parameter.',
                path: [...given, count.body[i]],
            });
        }
    }
    return results;
};

function shouldIgnoreError(error) {
    return (error.keyword === 'oneOf' ||
        (error.keyword === 'required' && error.params.missingProperty === '$ref'));
}
const ERROR_MAP = [
    {
        path: /^components\/securitySchemes\/[^/]+$/,
        message: 'Invalid security scheme',
    },
    {
        path: /^securityDefinitions\/[^/]+$/,
        message: 'Invalid security definition',
    },
];
function prepareResults(errors) {
    for (let i = 0; i < errors.length; i++) {
        const error = errors[i];
        if (i + 1 < errors.length && errors[i + 1].dataPath === error.dataPath) {
            errors.splice(i + 1, 1);
            i--;
        }
        else if (i > 0 && shouldIgnoreError(error) && errors[i - 1].dataPath.startsWith(error.dataPath)) {
            errors.splice(i, 1);
            i--;
        }
    }
}
function applyManualReplacements(errors) {
    for (const error of errors) {
        if (error.path === void 0)
            continue;
        const joinedPath = error.path.join('/');
        for (const mappedError of ERROR_MAP) {
            if (mappedError.path.test(joinedPath)) {
                error.message = mappedError.message;
                break;
            }
        }
    }
}
const oasDocumentSchema = function (targetVal, opts, ...args) {
    const errors = schema.call(this, targetVal, Object.assign(Object.assign({}, opts), { prepareResults }), ...args);
    if (Array.isArray(errors)) {
        applyManualReplacements(errors);
    }
    return errors;
};

const MEDIA_VALIDATION_ITEMS = {
    2: [
        {
            field: 'examples',
            multiple: true,
            keyed: false,
        },
    ],
    3: [
        {
            field: 'example',
            multiple: false,
            keyed: false,
        },
        {
            field: 'examples',
            multiple: true,
            keyed: true,
        },
    ],
};
const SCHEMA_VALIDATION_ITEMS = {
    2: ['example', 'x-example', 'default'],
    3: ['example', 'default'],
};
function* getMediaValidationItems(items, targetVal, givenPath, oasVersion) {
    for (const { field, keyed, multiple } of items) {
        if (!(field in targetVal)) {
            continue;
        }
        const value = targetVal[field];
        if (multiple) {
            if (!isObject(value))
                continue;
            for (const exampleKey of Object.keys(value)) {
                const exampleValue = value[exampleKey];
                if (oasVersion === 3 && keyed && (!isObject(exampleValue) || 'externalValue' in exampleValue)) {
                    continue;
                }
                const targetPath = [...givenPath, field, exampleKey];
                if (keyed) {
                    targetPath.push('value');
                }
                yield {
                    value: keyed && isObject(exampleValue) ? exampleValue.value : exampleValue,
                    path: targetPath,
                };
            }
            return;
        }
        else {
            return yield {
                value,
                path: [...givenPath, field],
            };
        }
    }
}
function* getSchemaValidationItems(fields, targetVal, givenPath) {
    for (const field of fields) {
        if (!(field in targetVal)) {
            continue;
        }
        yield {
            value: targetVal[field],
            path: [...givenPath, field],
        };
    }
}
const oasExample = function (targetVal, opts, paths, otherValues) {
    if (!isObject(targetVal)) {
        return;
    }
    const schemaOpts = {
        schema: opts.schemaField === '$' ? targetVal : targetVal[opts.schemaField],
        oasVersion: opts.oasVersion,
    };
    let results = void 0;
    const validationItems = opts.type === 'schema'
        ? getSchemaValidationItems(SCHEMA_VALIDATION_ITEMS[opts.oasVersion], targetVal, paths.given)
        : getMediaValidationItems(MEDIA_VALIDATION_ITEMS[opts.oasVersion], targetVal, paths.given, opts.oasVersion);
    for (const validationItem of validationItems) {
        const result = schema.call(this, validationItem.value, schemaOpts, {
            given: paths.given,
            target: validationItem.path,
        }, otherValues);
        if (Array.isArray(result)) {
            if (results === void 0)
                results = [];
            results.push(...result);
        }
    }
    return results;
};

const validOperationKeys = ['get', 'head', 'post', 'put', 'patch', 'delete', 'options', 'trace'];
function* getAllOperations(paths) {
    if (!isObject(paths)) {
        return;
    }
    const item = {
        path: '',
        operation: '',
    };
    for (const path of Object.keys(paths)) {
        const operations = paths[path];
        if (!isObject(operations)) {
            continue;
        }
        item.path = path;
        for (const operation of Object.keys(operations)) {
            if (!isObject(operations[operation]) || !validOperationKeys.includes(operation)) {
                continue;
            }
            item.operation = operation;
            yield item;
        }
    }
}

function _get(value, path) {
    for (const segment of path) {
        if (!isObject(value)) {
            break;
        }
        value = value[segment];
    }
    return value;
}
const oasOpSecurityDefined = (targetVal, options) => {
    const results = [];
    const { schemesPath } = options;
    const { paths } = targetVal;
    const schemes = _get(targetVal, schemesPath);
    const allDefs = isObject(schemes) ? Object.keys(schemes) : [];
    for (const { path, operation } of getAllOperations(paths)) {
        const { security } = paths[path][operation];
        if (!Array.isArray(security)) {
            continue;
        }
        for (const [index, value] of security.entries()) {
            if (!isObject(value)) {
                continue;
            }
            const securityKeys = Object.keys(value);
            if (securityKeys.length > 0 && !allDefs.includes(securityKeys[0])) {
                results.push({
                    message: 'Operation referencing undefined security scheme.',
                    path: ['paths', path, operation, 'security', index],
                });
            }
        }
    }
    return results;
};

const typedEnum = function (targetVal, opts, paths, otherValues) {
    var _a, _b, _c;
    if (targetVal === null || typeof targetVal !== 'object') {
        return;
    }
    if (targetVal.enum === null || targetVal.enum === void 0 || targetVal.type === null || targetVal.type === void 0) {
        return;
    }
    const { enum: enumValues } = targetVal;
    const initialSchema = Object.assign({}, targetVal);
    delete initialSchema.enum;
    if (!Array.isArray(enumValues)) {
        return;
    }
    const isOAS3 = ((_a = otherValues.documentInventory.document.formats) === null || _a === void 0 ? void 0 : _a.includes('oas3')) === true;
    const isOAS2 = ((_b = otherValues.documentInventory.document.formats) === null || _b === void 0 ? void 0 : _b.includes('oas2')) === true;
    let innerSchema;
    if ((isOAS3 && targetVal.nullable === true) || (isOAS2 && targetVal['x-nullable'] === true)) {
        const type = Array.isArray(initialSchema.type)
            ? [...initialSchema.type]
            : initialSchema.type !== void 0
                ? [initialSchema.type]
                : [];
        if (!type.includes('null')) {
            type.push('null');
        }
        innerSchema = { type, enum: initialSchema.enum };
    }
    else {
        innerSchema = { type: initialSchema.type, enum: initialSchema.enum };
    }
    const schemaObject = { schema: innerSchema };
    const incorrectValues = [];
    enumValues.forEach((val, index) => {
        const res = schema(val, schemaObject, paths, otherValues);
        if (Array.isArray(res) && res.length !== 0) {
            incorrectValues.push({ index, val });
        }
    });
    if (incorrectValues.length === 0) {
        return;
    }
    const { type } = initialSchema;
    const rootPath = (_c = paths.target) !== null && _c !== void 0 ? _c : paths.given;
    return incorrectValues.map(bad => {
        return {
            message: `Enum value \`${bad.val}\` does not respect the specified type \`${type}\`.`,
            path: [...rootPath, 'enum', bad.index],
        };
    });
};

function isObject$1(maybeObj) {
    return typeof maybeObj === 'object' && maybeObj !== null;
}
function getParentValue(document, path) {
    if (path.length === 0) {
        return null;
    }
    let piece = document;
    for (let i = 0; i < path.length - 1; i += 1) {
        if (!isObject$1(piece)) {
            return null;
        }
        piece = piece[path[i]];
    }
    return piece;
}
const refSiblings = (targetVal, opts, paths, { documentInventory }) => {
    const value = getParentValue(documentInventory.unresolved, paths.given);
    if (!isObject$1(value)) {
        return;
    }
    const keys = Object.keys(value);
    if (keys.length === 1) {
        return;
    }
    const results = [];
    const actualObjPath = paths.given.slice(0, -1);
    for (const key of keys) {
        if (key === '$ref') {
            continue;
        }
        results.push({
            message: '$ref cannot be placed next to any other properties',
            path: [...actualObjPath, key],
        });
    }
    return results;
};

const pathRegex = /(\{[a-zA-Z0-9_-]+\})+/g;
const isNamedPathParam = (p) => {
    return p.in !== void 0 && p.in === 'path' && p.name !== void 0;
};
const isUnknownNamedPathParam = (p, path, results, seen) => {
    if (!isNamedPathParam(p)) {
        return false;
    }
    if (!p.required) {
        results.push(generateResult(requiredMessage(p.name), path));
    }
    if (p.name in seen) {
        results.push(generateResult(uniqueDefinitionMessage(p.name), path));
        return false;
    }
    return true;
};
const ensureAllDefinedPathParamsAreUsedInPath = (path, params, expected, results) => {
    for (const p in params) {
        if (!params[p]) {
            continue;
        }
        if (!expected.includes(p)) {
            const resPath = params[p];
            results.push(generateResult(`Parameter \`${p}\` is not used in the path \`${path}\`.`, resPath));
        }
    }
};
const ensureAllExpectedParamsinPathAreDefined = (path, params, expected, operationPath, results) => {
    for (const p of expected) {
        if (!(p in params)) {
            results.push(generateResult(`The operation does not define the parameter \`{${p}}\` expected by path \`${path}\`.`, operationPath));
        }
    }
};
const oasPathParam = targetVal => {
    if (!isObject(targetVal.paths)) {
        return;
    }
    const results = [];
    const uniquePaths = {};
    const validOperationKeys = ['get', 'head', 'post', 'put', 'patch', 'delete', 'options', 'trace'];
    for (const path of Object.keys(targetVal.paths)) {
        if (!isObject(targetVal.paths[path]))
            continue;
        const normalized = path.replace(pathRegex, '%');
        if (normalized in uniquePaths) {
            results.push(generateResult(`The paths \`${uniquePaths[normalized]}\` and \`${path}\` are equivalent.`, ['paths', path]));
        }
        else {
            uniquePaths[normalized] = path;
        }
        const pathElements = [];
        let match;
        while ((match = pathRegex.exec(path))) {
            const p = match[0].replace(/[{}]/g, '');
            if (pathElements.includes(p)) {
                results.push(generateResult(`The path \`${path}\` uses the parameter \`{${p}}\` multiple times. Path parameters must be unique.`, ['paths', path]));
            }
            else {
                pathElements.push(p);
            }
        }
        const topParams = {};
        if (Array.isArray(targetVal.paths[path].parameters)) {
            for (const [i, value] of targetVal.paths[path].parameters.entries()) {
                if (!isObject(value))
                    continue;
                const fullParameterPath = ['paths', path, 'parameters', i];
                if (isUnknownNamedPathParam(value, fullParameterPath, results, topParams)) {
                    topParams[value.name] = fullParameterPath;
                }
            }
        }
        if (isObject(targetVal.paths[path])) {
            for (const op of Object.keys(targetVal.paths[path])) {
                if (!isObject(targetVal.paths[path][op]))
                    continue;
                if (op === 'parameters' || !validOperationKeys.includes(op)) {
                    continue;
                }
                const operationParams = {};
                const parameters = targetVal.paths[path][op].parameters;
                const operationPath = ['paths', path, op];
                if (Array.isArray(parameters)) {
                    for (const [i, p] of parameters.entries()) {
                        if (!isObject(p))
                            continue;
                        const fullParameterPath = [...operationPath, 'parameters', i];
                        if (isUnknownNamedPathParam(p, fullParameterPath, results, operationParams)) {
                            operationParams[p.name] = fullParameterPath;
                        }
                    }
                }
                const definedParams = Object.assign(Object.assign({}, topParams), operationParams);
                ensureAllDefinedPathParamsAreUsedInPath(path, definedParams, pathElements, results);
                ensureAllExpectedParamsinPathAreDefined(path, definedParams, pathElements, operationPath, results);
            }
        }
    }
    return results;
};
function generateResult(message, path) {
    return {
        message,
        path,
    };
}
const requiredMessage = (name) => `Path parameter \`${name}\` must have a \`required\` property that is set to \`true\`.`;
const uniqueDefinitionMessage = (name) => `Path parameter \`${name}\` is defined multiple times. Path parameters must be unique.`;

const oasTagDefined = targetVal => {
    const results = [];
    const globalTags = [];
    if (Array.isArray(targetVal.tags)) {
        for (const tag of targetVal.tags) {
            if (isObject(tag) && typeof tag.name === 'string') {
                globalTags.push(tag.name);
            }
        }
    }
    const { paths } = targetVal;
    for (const { path, operation } of getAllOperations(paths)) {
        const { tags } = paths[path][operation];
        if (!Array.isArray(tags)) {
            continue;
        }
        for (const [i, tag] of tags.entries()) {
            if (!globalTags.includes(tag)) {
                results.push({
                    message: 'Operation tags should be defined in global tags.',
                    path: ['paths', path, operation, 'tags', i],
                });
            }
        }
    }
    return results;
};

const oasOpIdUnique = targetVal => {
    const results = [];
    const { paths } = targetVal;
    const seenIds = [];
    for (const { path, operation } of getAllOperations(paths)) {
        if (!('operationId' in paths[path][operation])) {
            continue;
        }
        const { operationId } = paths[path][operation];
        if (seenIds.includes(operationId)) {
            results.push({
                message: 'operationId must be unique.',
                path: ['paths', path, operation, 'operationId'],
            });
        }
        else {
            seenIds.push(operationId);
        }
    }
    return results;
};

const ruleset = {
    documentationUrl: 'https://meta.stoplight.io/docs/spectral/docs/reference/openapi-rules.md',
    formats: [isOpenApiv2, isOpenApiv3],
    rules: {
        'operation-success-response': {
            description: 'Operation must have at least one `2xx` or `3xx` response.',
            recommended: true,
            type: 'style',
            given: "$.paths.*[?( @property === 'get' || @property === 'put' || @property === 'post' || @property === 'delete' || @property === 'options' || @property === 'head' || @property === 'patch' || @property === 'trace' )]",
            then: {
                field: 'responses',
                function: oasOpSuccessResponse,
            },
        },
        'oas2-operation-formData-consume-check': {
            description: 'Operations with an `in: formData` parameter must include `application/x-www-form-urlencoded` or `multipart/form-data` in their `consumes` property.',
            recommended: true,
            formats: [isOpenApiv2],
            type: 'validation',
            given: "$.paths.*[?( @property === 'get' || @property === 'put' || @property === 'post' || @property === 'delete' || @property === 'options' || @property === 'head' || @property === 'patch' || @property === 'trace' )]",
            then: {
                function: oasOpFormDataConsumeCheck,
            },
        },
        'operation-operationId-unique': {
            description: 'Every operation must have a unique `operationId`.',
            recommended: true,
            type: 'validation',
            severity: 0,
            given: '$',
            then: {
                function: oasOpIdUnique,
            },
        },
        'operation-parameters': {
            description: 'Operation parameters are unique and non-repeating.',
            message: '{{error}}',
            recommended: true,
            type: 'validation',
            given: "$.paths.*[?( @property === 'get' || @property === 'put' || @property === 'post' || @property === 'delete' || @property === 'options' || @property === 'head' || @property === 'patch' || @property === 'trace' )].parameters",
            then: {
                function: oasOpParams,
            },
        },
        'operation-tag-defined': {
            description: 'Operation tags should be defined in global tags.',
            recommended: true,
            type: 'validation',
            given: '$',
            then: {
                function: oasTagDefined,
            },
        },
        'path-params': {
            description: 'Path parameters should be defined and valid.',
            message: '{{error}}',
            type: 'validation',
            severity: 0,
            recommended: true,
            given: '$',
            then: {
                function: oasPathParam,
            },
        },
        'contact-properties': {
            description: 'Contact object should have `name`, `url` and `email`.',
            recommended: false,
            type: 'style',
            given: '$.info.contact',
            then: [
                {
                    field: 'name',
                    function: truthy,
                },
                {
                    field: 'url',
                    function: truthy,
                },
                {
                    field: 'email',
                    function: truthy,
                },
            ],
        },
        'info-contact': {
            description: 'Info object should contain `contact` object.',
            recommended: true,
            type: 'style',
            given: '$',
            then: {
                field: 'info.contact',
                function: truthy,
            },
        },
        'info-description': {
            description: 'OpenAPI object info `description` must be present and non-empty string.',
            recommended: true,
            type: 'style',
            given: '$',
            then: {
                field: 'info.description',
                function: truthy,
            },
        },
        'info-license': {
            description: 'OpenAPI object `info` should contain a `license` object.',
            recommended: false,
            type: 'style',
            given: '$',
            then: {
                field: 'info.license',
                function: truthy,
            },
        },
        'license-url': {
            description: 'License object should include `url`.',
            recommended: false,
            type: 'style',
            given: '$',
            then: {
                field: 'info.license.url',
                function: truthy,
            },
        },
        'no-eval-in-markdown': {
            description: 'Markdown descriptions should not contain `eval(`.',
            recommended: true,
            type: 'style',
            given: "$..[?(@property === 'description' || @property === 'title')]",
            then: {
                function: pattern,
                functionOptions: {
                    notMatch: 'eval\\(',
                },
            },
        },
        'no-script-tags-in-markdown': {
            description: 'Markdown descriptions should not contain `<script>` tags.',
            recommended: true,
            type: 'style',
            given: "$..[?(@property === 'description' || @property === 'title')]",
            then: {
                function: pattern,
                functionOptions: {
                    notMatch: '<script',
                },
            },
        },
        'openapi-tags-alphabetical': {
            description: 'OpenAPI object should have alphabetical `tags`.',
            recommended: false,
            type: 'style',
            given: '$',
            then: {
                field: 'tags',
                function: alphabetical,
                functionOptions: {
                    keyedBy: 'name',
                },
            },
        },
        'openapi-tags': {
            description: 'OpenAPI object should have non-empty `tags` array.',
            recommended: false,
            type: 'style',
            given: '$',
            then: {
                field: 'tags',
                function: schema,
                functionOptions: {
                    schema: {
                        type: 'array',
                        minItems: 1,
                    },
                },
            },
        },
        'operation-description': {
            description: 'Operation `description` must be present and non-empty string.',
            recommended: true,
            type: 'style',
            given: "$.paths.*[?( @property === 'get' || @property === 'put' || @property === 'post' || @property === 'delete' || @property === 'options' || @property === 'head' || @property === 'patch' || @property === 'trace' )]",
            then: {
                field: 'description',
                function: truthy,
            },
        },
        'operation-operationId': {
            description: 'Operation should have an `operationId`.',
            recommended: true,
            type: 'style',
            given: "$.paths.*[?( @property === 'get' || @property === 'put' || @property === 'post' || @property === 'delete' || @property === 'options' || @property === 'head' || @property === 'patch' || @property === 'trace' )]",
            then: {
                field: 'operationId',
                function: truthy,
            },
        },
        'operation-operationId-valid-in-url': {
            description: 'operationId may only use characters that are valid when used in a URL.',
            recommended: true,
            type: 'validation',
            given: "$.paths.*[?( @property === 'get' || @property === 'put' || @property === 'post' || @property === 'delete' || @property === 'options' || @property === 'head' || @property === 'patch' || @property === 'trace' )]",
            then: {
                field: 'operationId',
                function: pattern,
                functionOptions: {
                    match: "^[A-Za-z0-9-._~:/?#\\[\\]@!\\$&'()*+,;=]*$",
                },
            },
        },
        'operation-singular-tag': {
            description: 'Operation may only have one tag.',
            recommended: false,
            type: 'style',
            given: "$.paths.*[?( @property === 'get' || @property === 'put' || @property === 'post' || @property === 'delete' || @property === 'options' || @property === 'head' || @property === 'patch' || @property === 'trace' )]",
            then: {
                field: 'tags',
                function: length,
                functionOptions: {
                    max: 1,
                },
            },
        },
        'operation-tags': {
            description: 'Operation should have non-empty `tags` array.',
            recommended: true,
            type: 'style',
            given: "$.paths.*[?( @property === 'get' || @property === 'put' || @property === 'post' || @property === 'delete' || @property === 'options' || @property === 'head' || @property === 'patch' || @property === 'trace' )]",
            then: {
                field: 'tags',
                function: truthy,
            },
        },
        'path-declarations-must-exist': {
            description: 'Path parameter declarations cannot be empty, ex.`/given/{}` is invalid.',
            recommended: true,
            type: 'style',
            given: '$.paths',
            then: {
                field: '@key',
                function: pattern,
                functionOptions: {
                    notMatch: '{}',
                },
            },
        },
        'path-keys-no-trailing-slash': {
            description: 'paths should not end with a slash.',
            recommended: true,
            type: 'style',
            given: '$.paths',
            then: {
                field: '@key',
                function: pattern,
                functionOptions: {
                    notMatch: '.+\\/$',
                },
            },
        },
        'path-not-include-query': {
            description: 'given keys should not include a query string.',
            recommended: true,
            type: 'style',
            given: '$.paths',
            then: {
                field: '@key',
                function: pattern,
                functionOptions: {
                    notMatch: '\\?',
                },
            },
        },
        'tag-description': {
            description: 'Tag object should have a `description`.',
            recommended: false,
            type: 'style',
            given: '$.tags[*]',
            then: {
                field: 'description',
                function: truthy,
            },
        },
        'no-$ref-siblings': {
            description: 'Property cannot be placed among $ref',
            message: '{{error}}',
            type: 'validation',
            severity: 0,
            recommended: true,
            resolved: false,
            given: "$..[?(@property === '$ref')]",
            then: {
                function: refSiblings,
            },
        },
        'typed-enum': {
            description: 'Enum values should respect the specified type.',
            message: '{{error}}',
            recommended: true,
            type: 'validation',
            given: '$..[?(@.enum && @.type)]',
            then: {
                function: typedEnum,
            },
        },
        'oas2-api-host': {
            description: 'OpenAPI `host` must be present and non-empty string.',
            recommended: true,
            formats: [isOpenApiv2],
            type: 'style',
            given: '$',
            then: {
                field: 'host',
                function: truthy,
            },
        },
        'oas2-api-schemes': {
            description: 'OpenAPI host `schemes` must be present and non-empty array.',
            recommended: true,
            formats: [isOpenApiv2],
            type: 'style',
            given: '$',
            then: {
                field: 'schemes',
                function: schema,
                functionOptions: {
                    schema: {
                        items: {
                            type: 'string',
                        },
                        minItems: 1,
                        type: 'array',
                    },
                },
            },
        },
        'oas2-host-not-example': {
            description: 'Host URL should not point at example.com.',
            recommended: false,
            formats: [isOpenApiv2],
            given: '$',
            type: 'style',
            then: {
                field: 'host',
                function: pattern,
                functionOptions: {
                    notMatch: 'example\\.com',
                },
            },
        },
        'oas2-host-trailing-slash': {
            description: 'Server URL should not have a trailing slash.',
            recommended: true,
            formats: [isOpenApiv2],
            given: '$',
            type: 'style',
            then: {
                field: 'host',
                function: pattern,
                functionOptions: {
                    notMatch: '/$',
                },
            },
        },
        'oas2-parameter-description': {
            description: 'Parameter objects should have a `description`.',
            recommended: false,
            formats: [isOpenApiv2],
            given: '$..parameters[?(@.in)]',
            type: 'style',
            then: {
                field: 'description',
                function: truthy,
            },
        },
        'oas2-operation-security-defined': {
            description: 'Operation `security` values must match a scheme defined in the `securityDefinitions` object.',
            recommended: true,
            formats: [isOpenApiv2],
            type: 'validation',
            given: '$',
            then: {
                function: oasOpSecurityDefined,
                functionOptions: {
                    schemesPath: ['securityDefinitions'],
                },
            },
        },
        'oas2-valid-schema-example': {
            description: 'Examples must be valid against their defined schema.',
            message: '{{error}}',
            recommended: true,
            formats: [isOpenApiv2],
            severity: 0,
            type: 'validation',
            given: [
                "$..definitions..[?(@property !== 'properties' && (@.example !== void 0 || @['x-example'] !== void 0 || @.default !== void 0) && (@.enum || @.type || @.format || @.$ref || @.properties || @.items))]",
                "$..parameters..[?(@property !== 'properties' && (@.example !== void 0 || @['x-example'] !== void 0 || @.default !== void 0) && (@.enum || @.type || @.format || @.$ref || @.properties || @.items))]",
                "$..responses..[?(@property !== 'properties' && (@.example !== void 0 || @['x-example'] !== void 0 || @.default !== void 0) && (@.enum || @.type || @.format || @.$ref || @.properties || @.items))]",
            ],
            then: {
                function: oasExample,
                functionOptions: {
                    schemaField: '$',
                    oasVersion: 2,
                    type: 'schema',
                },
            },
        },
        'oas2-valid-media-example': {
            description: 'Examples must be valid against their defined schema.',
            message: '{{error}}',
            recommended: true,
            formats: [isOpenApiv2],
            severity: 0,
            type: 'validation',
            given: '$..responses..[?(@.schema && @.examples)]',
            then: {
                function: oasExample,
                functionOptions: {
                    schemaField: 'schema',
                    oasVersion: 2,
                    type: 'media',
                },
            },
        },
        'oas2-anyOf': {
            description: 'OpenAPI v3 keyword `anyOf` detected in OpenAPI v2 document.',
            message: 'anyOf is not available in OpenAPI v2, it was added in OpenAPI v3',
            recommended: true,
            formats: [isOpenApiv2],
            type: 'validation',
            given: '$..anyOf',
            then: {
                function: undefined$1,
            },
        },
        'oas2-oneOf': {
            description: 'OpenAPI v3 keyword `oneOf` detected in OpenAPI v2 document.',
            message: 'oneOf is not available in OpenAPI v2, it was added in OpenAPI v3',
            recommended: true,
            formats: [isOpenApiv2],
            type: 'validation',
            given: '$..oneOf',
            then: {
                function: undefined$1,
            },
        },
        'oas2-schema': {
            description: 'Validate structure of OpenAPI v2 specification.',
            message: '{{error}}.',
            recommended: true,
            formats: [isOpenApiv2],
            severity: 0,
            type: 'validation',
            given: '$',
            then: {
                function: oasDocumentSchema,
                functionOptions: {
                    allErrors: true,
                    // schema: require('./schemas/schema.oas2.json'),
                },
            },
        },
        'oas2-unused-definition': {
            description: 'Potentially unused definition has been detected.',
            recommended: true,
            resolved: false,
            formats: [isOpenApiv2],
            type: 'style',
            given: '$.definitions',
            then: {
                function: unreferencedReusableObject,
                functionOptions: {
                    reusableObjectsLocation: '#/definitions',
                },
            },
        },
        'oas3-api-servers': {
            description: 'OpenAPI `servers` must be present and non-empty array.',
            recommended: true,
            formats: [isOpenApiv3],
            type: 'style',
            given: '$',
            then: {
                field: 'servers',
                function: schema,
                functionOptions: {
                    schema: {
                        items: {
                            type: 'object',
                        },
                        minItems: 1,
                        type: 'array',
                    },
                },
            },
        },
        'oas3-examples-value-or-externalValue': {
            description: 'Examples should have either a `value` or `externalValue` field.',
            recommended: true,
            formats: [isOpenApiv3],
            type: 'style',
            given: [
                '$.components.examples[*]',
                '$.paths[*][*]..content[*].examples[*]',
                '$.paths[*][*]..parameters[*].examples[*]',
                '$.components.parameters[*].examples[*]',
                '$.paths[*][*]..headers[*].examples[*]',
                '$.components.headers[*].examples[*]',
            ],
            then: {
                function: xor,
                functionOptions: {
                    properties: ['externalValue', 'value'],
                },
            },
        },
        'oas3-operation-security-defined': {
            description: 'Operation `security` values must match a scheme defined in the `components.securitySchemes` object.',
            recommended: true,
            formats: [isOpenApiv3],
            type: 'validation',
            given: '$',
            then: {
                function: oasOpSecurityDefined,
                functionOptions: {
                    schemesPath: ['components', 'securitySchemes'],
                },
            },
        },
        'oas3-parameter-description': {
            description: 'Parameter objects should have a `description`.',
            recommended: false,
            formats: [isOpenApiv3],
            type: 'style',
            given: "$..[?(@parentProperty !== 'links' && @.parameters)]['parameters'].[?(@.in)]",
            then: {
                field: 'description',
                function: truthy,
            },
        },
        'oas3-server-not-example.com': {
            description: 'Server URL should not point at example.com.',
            recommended: false,
            formats: [isOpenApiv3],
            type: 'style',
            given: '$.servers[*].url',
            then: {
                function: pattern,
                functionOptions: {
                    notMatch: 'example\\.com',
                },
            },
        },
        'oas3-server-trailing-slash': {
            description: 'Server URL should not have a trailing slash.',
            recommended: true,
            formats: [isOpenApiv3],
            type: 'style',
            given: '$.servers[*].url',
            then: {
                function: pattern,
                functionOptions: {
                    notMatch: './$',
                },
            },
        },
        'oas3-valid-media-example': {
            description: 'Examples must be valid against their defined schema.',
            message: '{{error}}',
            recommended: true,
            severity: 0,
            formats: [isOpenApiv3],
            type: 'validation',
            given: [
                '$..content..[?(@.schema && (@.example !== void 0 || @.examples))]',
                '$..headers..[?(@.schema && (@.example !== void 0 || @.examples))]',
                '$..parameters..[?(@.schema && (@.example !== void 0 || @.examples))]',
            ],
            then: {
                function: oasExample,
                functionOptions: {
                    schemaField: 'schema',
                    oasVersion: 3,
                    type: 'media',
                },
            },
        },
        'oas3-valid-schema-example': {
            description: 'Examples must be valid against their defined schema.',
            message: '{{error}}',
            severity: 0,
            formats: [isOpenApiv3],
            recommended: true,
            type: 'validation',
            given: [
                "$.components.schemas..[?(@property !== 'properties' && (@.example !== void 0 || @.default !== void 0) && (@.enum || @.type || @.format || @.$ref || @.properties || @.items))]",
                "$..content..[?(@property !== 'properties' && (@.example !== void 0 || @.default !== void 0) && (@.enum || @.type || @.format || @.$ref || @.properties || @.items))]",
                "$..headers..[?(@property !== 'properties' && (@.example !== void 0 || @.default !== void 0) && (@.enum || @.type || @.format || @.$ref || @.properties || @.items))]",
                "$..parameters..[?(@property !== 'properties' && (@.example !== void 0 || @.default !== void 0) && (@.enum || @.type || @.format || @.$ref || @.properties || @.items))]",
            ],
            then: {
                function: oasExample,
                functionOptions: {
                    schemaField: '$',
                    oasVersion: 3,
                    type: 'schema',
                },
            },
        },
        'oas3-schema': {
            description: 'Validate structure of OpenAPI v3 specification.',
            message: '{{error}}.',
            severity: 0,
            formats: [isOpenApiv3],
            recommended: true,
            type: 'validation',
            given: '$',
            then: {
                function: oasDocumentSchema,
                functionOptions: {
                    allErrors: true,
                    // schema: require('./schemas/schema.oas3.json'),
                },
            },
        },
        'oas3-unused-components-schema': {
            description: 'Potentially unused components schema has been detected.',
            recommended: true,
            formats: [isOpenApiv3],
            type: 'style',
            resolved: false,
            given: '$.components.schemas',
            then: {
                function: unreferencedReusableObject,
                functionOptions: {
                    reusableObjectsLocation: '#/components/schemas',
                },
            },
        },
    },
};

export default ruleset;
