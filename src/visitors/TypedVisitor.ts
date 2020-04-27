import {
  FieldNode,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  OperationDefinitionNode,
  VariableDefinitionNode,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
} from "graphql";

export interface TypedField {
  name: string;
  isNonNull: boolean;
  isList: boolean;

  scalarType?: GraphQLScalarType;
  enumType?: GraphQLEnumType;
  inputObjectType?: GraphQLInputObjectType;
  objectType?: GraphQLObjectType;
  interfaceType?: GraphQLInterfaceType;

  fields: TypedField[];
}

export interface TypedVariableDefinitionNode extends VariableDefinitionNode {
  typed: TypedField;
}

export interface TypedFieldNode extends FieldNode {
  typed: TypedField;
}

type OutputParentObjectType = GraphQLObjectType | GraphQLInterfaceType;

export default class TypedVisitor {
  schema: GraphQLSchema;
  types: OutputParentObjectType[] = [];
  type?: OutputParentObjectType;
  inputObjectTypeFields: { [inputObjectTypeName: string]: TypedField[] } = {};

  constructor(schema: GraphQLSchema) {
    this.schema = schema;
  }

  putType(type: OutputParentObjectType) {
    this.types.push(type);
    this.type = type;
  }

  popType() {
    this.types.splice(this.types.length - 1, 1);
    this.type = this.types[this.types.length - 1];
  }

  getType() {
    if (!this.type) {
      throw new Error("No type set");
    }
    return this.type;
  }

  getInputObjectTypeFields(type: GraphQLInputObjectType): TypedField[] {
    if (!this.inputObjectTypeFields[type.name]) {
      const fields = Object.values(type.getFields());

      this.inputObjectTypeFields[type.name] = [];

      fields.forEach((field) => {
        const typedField = {} as TypedField;
        let fieldType = field.type;

        typedField.name = field.name;
        typedField.fields = [];
        typedField.isNonNull = false;
        typedField.isList = false;

        if (isNonNullType(fieldType)) {
          typedField.isNonNull = true;
          fieldType = fieldType.ofType;
        }

        if (isListType(fieldType)) {
          typedField.isList = true;
          fieldType = fieldType.ofType;
        }

        if (isNonNullType(fieldType)) {
          fieldType = fieldType.ofType;
        }

        if (isInputObjectType(fieldType)) {
          typedField.inputObjectType = fieldType;
          typedField.fields = this.getInputObjectTypeFields(fieldType);
        } else if (isScalarType(fieldType)) {
          typedField.scalarType = fieldType;
        } else if (isEnumType(fieldType)) {
          typedField.enumType = fieldType;
        }

        this.inputObjectTypeFields[type.name].push(typedField);
      });
    }

    return this.inputObjectTypeFields[type.name];
  }

  get OperationDefinition() {
    return {
      enter: (node: OperationDefinitionNode) => {
        let type: GraphQLObjectType | undefined | null;

        switch (node.operation) {
          case "mutation":
            type = this.schema.getMutationType();
            break;
          case "subscription":
            type = this.schema.getSubscriptionType();
            break;
          default:
            type = this.schema.getQueryType();
        }

        if (!type) {
          throw new Error(`Couldn't find type for ${node.operation}`);
        }

        this.putType(type);
      },
      leave: () => {
        this.popType();
      },
    };
  }

  get VariableDefinition() {
    return {
      enter: (_node: VariableDefinitionNode) => {
        const node = _node as TypedVariableDefinitionNode;
        let nodeType = node.type;

        node.typed = {} as TypedField;
        node.typed.name = node.variable.name.value;
        node.typed.fields = [];
        node.typed.isNonNull = false;
        node.typed.isList = false;

        if (nodeType.kind === "NonNullType") {
          node.typed.isNonNull = true;
          nodeType = nodeType.type;
        }

        if (nodeType.kind === "ListType") {
          node.typed.isList = true;
          nodeType = nodeType.type;
        }

        if (nodeType.kind === "NonNullType") {
          nodeType = nodeType.type;
        }

        if (nodeType.kind !== "NamedType") {
          throw new Error("Not supported");
        }

        const type = this.schema.getType(nodeType.name.value);

        if (isInputObjectType(type)) {
          node.typed.inputObjectType = type;
          node.typed.fields = this.getInputObjectTypeFields(type);
        } else if (isScalarType(type)) {
          node.typed.scalarType = type;
        } else if (isEnumType(type)) {
          node.typed.enumType = type;
        }

        return false; // No need to traverse deeper
      },
    };
  }

  get Field() {
    return {
      enter: (_node: FieldNode) => {
        const node = _node as TypedFieldNode;
        const fields = this.getType().getFields();
        const field = fields[node.name.value];
        let type = field.type;

        node.typed = {} as TypedField;
        node.typed.name = node.name.value;
        node.typed.fields = [];
        node.typed.isNonNull = false;
        node.typed.isList = false;

        if (isNonNullType(type)) {
          node.typed.isNonNull = true;
          type = type.ofType;
        }

        if (isListType(type)) {
          node.typed.isList = true;
          type = type.ofType;
        }

        if (isNonNullType(type)) {
          type = type.ofType;
        }

        if (isObjectType(type)) {
          node.typed.objectType = type;
          this.putType(type);
        } else if (isInterfaceType(type)) {
          node.typed.interfaceType = type;
          this.putType(type);
        } else if (isScalarType(type)) {
          node.typed.scalarType = type;
        } else if (isEnumType(type)) {
          node.typed.enumType = type;
        }
      },
      leave: (_node: FieldNode) => {
        const node = _node as TypedFieldNode;

        if (node.typed.objectType || node.typed.interfaceType) {
          this.popType();

          const selections = node.selectionSet?.selections || [];

          node.typed.fields = selections
            .filter((node) => node.kind === "Field")
            .map((fieldNode) => {
              const typedFieldNode = fieldNode as TypedFieldNode;
              return typedFieldNode.typed;
            });
        }
      },
    };
  }
}
