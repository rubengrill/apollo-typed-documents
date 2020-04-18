import {
  FieldNode,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  OperationDefinitionNode,
  VariableDefinitionNode,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
} from "graphql";

export interface TypedField<ObjectType> {
  kind: string;
  name: string;
  parentObjectType?: ObjectType;
  isNonNull: boolean;
  isList: boolean;

  scalarType?: GraphQLScalarType;
  enumType?: GraphQLEnumType;
  objectType?: ObjectType;

  fields: TypedField<ObjectType>[];
}

export interface TypedInputField extends TypedField<GraphQLInputObjectType> {
  kind: "TypedInputField";
  fields: TypedInputField[];
}

export interface TypedOutputField extends TypedField<GraphQLObjectType> {
  kind: "TypedOutputField";
  fields: TypedOutputField[];
}

export interface TypedVariableDefinitionNode extends VariableDefinitionNode {
  typed: TypedInputField;
}

export interface TypedFieldNode extends FieldNode {
  typed: TypedOutputField;
}

export default class TypedVisitor {
  schema: GraphQLSchema;
  types: GraphQLObjectType[] = [];
  type: GraphQLObjectType = null as any;
  inputObjectTypeFields: {
    [inputObjectTypeName: string]: TypedInputField[];
  } = {};

  constructor(schema: GraphQLSchema) {
    this.schema = schema;
  }

  putType(type: GraphQLObjectType) {
    this.types.push(type);
    this.type = type;
  }

  popType() {
    this.types.splice(this.types.length - 1, 1);
    this.type = this.types[this.types.length - 1];
  }

  getInputObjectTypeFields(type: GraphQLInputObjectType): TypedInputField[] {
    if (!this.inputObjectTypeFields[type.name]) {
      const fields = Object.values(type.getFields());

      this.inputObjectTypeFields[type.name] = [];

      fields.forEach((field) => {
        const typedField = {} as TypedInputField;
        let fieldType = field.type;

        typedField.kind = "TypedInputField";
        typedField.name = field.name;
        typedField.parentObjectType = type;
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
          typedField.objectType = fieldType;
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
        switch (node.operation) {
          case "mutation":
            this.putType(this.schema.getMutationType()!);
            break;
          case "subscription":
            this.putType(this.schema.getSubscriptionType()!);
            break;
          default:
            this.putType(this.schema.getQueryType()!);
        }
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

        node.typed = {} as TypedInputField;
        node.typed.kind = "TypedInputField";
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
          node.typed.objectType = type;
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
        const fields = this.type.getFields();
        const field = fields[node.name.value];
        let type = field.type;

        node.typed = {} as TypedOutputField;
        node.typed.kind = "TypedOutputField";
        node.typed.name = node.name.value;
        node.typed.parentObjectType = this.type;
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
        } else if (isScalarType(type)) {
          node.typed.scalarType = type;
        } else if (isEnumType(type)) {
          node.typed.enumType = type;
        }
      },
      leave: (_node: FieldNode) => {
        const node = _node as TypedFieldNode;

        if (node.typed.objectType) {
          this.popType();

          const selections = node.selectionSet!.selections;

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
