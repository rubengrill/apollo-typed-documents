import {
  FieldNode,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLUnionType,
  InlineFragmentNode,
  OperationDefinitionNode,
  VariableDefinitionNode,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
  isUnionType,
} from "graphql";

export interface TypedField {
  name: string;
  inputFields: TypedField[];
  outputFields: TypedField[];
  fragments: { typenames: string[]; field: TypedField }[];
  isNonNull: boolean;
  isList: boolean;

  scalarType?: GraphQLScalarType;
  enumType?: GraphQLEnumType;
  inputObjectType?: GraphQLInputObjectType;
  objectType?: GraphQLObjectType;
  interfaceType?: GraphQLInterfaceType;
  unionType?: GraphQLUnionType;
}

export interface TypedOperationDefinitionNode extends OperationDefinitionNode {
  typed: TypedField;
}

const createTypedField = (
  field: Partial<TypedField> & { name: string }
): TypedField => ({
  inputFields: [],
  outputFields: [],
  fragments: [],
  isNonNull: false,
  isList: false,
  ...field,
});

export default class TypedVisitor {
  schema: GraphQLSchema;
  parentFields: TypedField[] = [];
  parentField?: TypedField;
  inputObjectTypeFields: { [inputObjectTypeName: string]: TypedField[] } = {};
  leaveCallbacks = new Map<unknown, () => void>();

  constructor(schema: GraphQLSchema) {
    this.schema = schema;
  }

  putParentField(parentField: TypedField) {
    this.parentFields.push(parentField);
    this.parentField = parentField;
  }

  popParentField() {
    this.parentFields.splice(this.parentFields.length - 1, 1);
    this.parentField = this.parentFields[this.parentFields.length - 1];
  }

  getParentField() {
    if (!this.parentField) {
      throw new Error("No parent field set");
    }
    return this.parentField;
  }

  invokeLeaveCallback(node: unknown) {
    const leaveCallback = this.leaveCallbacks.get(node);

    if (leaveCallback) {
      leaveCallback();
      this.leaveCallbacks.delete(node);
    }
  }

  getInputObjectTypeFields(type: GraphQLInputObjectType): TypedField[] {
    if (!this.inputObjectTypeFields[type.name]) {
      const fields = Object.values(type.getFields());

      this.inputObjectTypeFields[type.name] = [];

      fields.forEach((field) => {
        const typedField = createTypedField({ name: field.name });

        let fieldType = field.type;

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
          typedField.inputFields = this.getInputObjectTypeFields(fieldType);
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
      enter: (_node: OperationDefinitionNode) => {
        const node = _node as TypedOperationDefinitionNode;

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

        const typedField = createTypedField({
          name: type.name,
          objectType: type,
        });

        node.typed = typedField;

        this.putParentField(typedField);
      },
      leave: () => {
        this.popParentField();
      },
    };
  }

  get VariableDefinition() {
    return {
      enter: (node: VariableDefinitionNode) => {
        const typedField = createTypedField({ name: node.variable.name.value });

        let nodeType = node.type;

        if (nodeType.kind === "NonNullType") {
          typedField.isNonNull = true;
          nodeType = nodeType.type;
        }

        if (nodeType.kind === "ListType") {
          typedField.isList = true;
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
          typedField.inputObjectType = type;
          typedField.inputFields = this.getInputObjectTypeFields(type);
        } else if (isScalarType(type)) {
          typedField.scalarType = type;
        } else if (isEnumType(type)) {
          typedField.enumType = type;
        }

        const parentField = this.getParentField();

        parentField.inputFields.push(typedField);

        return false; // No need to traverse deeper
      },
    };
  }

  get Field() {
    return {
      enter: (node: FieldNode) => {
        const parentField = this.getParentField();
        const parentType = parentField.objectType || parentField.interfaceType;

        if (!parentType) {
          throw new Error("Parent type is not an object or interface type");
        }

        const fields = parentType.getFields();
        const field = fields[node.name.value];
        const typedField = createTypedField({ name: node.name.value });

        let type = field.type;

        if (isNonNullType(type)) {
          typedField.isNonNull = true;
          type = type.ofType;
        }

        if (isListType(type)) {
          typedField.isList = true;
          type = type.ofType;
        }

        if (isNonNullType(type)) {
          type = type.ofType;
        }

        let newParentField;

        if (isObjectType(type)) {
          typedField.objectType = type;
          newParentField = typedField;
        } else if (isInterfaceType(type)) {
          typedField.interfaceType = type;
          newParentField = typedField;
        } else if (isUnionType(type)) {
          typedField.unionType = type;
          newParentField = typedField;
        } else if (isScalarType(type)) {
          typedField.scalarType = type;
        } else if (isEnumType(type)) {
          typedField.enumType = type;
        }

        parentField.outputFields.push(typedField);

        if (newParentField) {
          this.putParentField(newParentField);
          this.leaveCallbacks.set(node, () => this.popParentField());
        }
      },
      leave: (node: FieldNode) => {
        this.invokeLeaveCallback(node);
      },
    };
  }

  get InlineFragment() {
    return {
      enter: (node: InlineFragmentNode) => {
        if (!node.typeCondition) {
          return;
        }

        const type = this.schema.getType(node.typeCondition.name.value);

        if (isObjectType(type) || isInterfaceType(type)) {
          const typedField = createTypedField({ name: "InlineFragment" });

          let typenames: string[] = [];

          if (isObjectType(type)) {
            typedField.objectType = type;
            typenames = [type.name];
          } else if (isInterfaceType(type)) {
            typedField.interfaceType = type;
            typenames = this.schema
              .getPossibleTypes(type)
              .map((field) => field.name);
          }

          const parentField = this.getParentField();

          parentField.fragments.push({ typenames, field: typedField });

          this.putParentField(typedField);
          this.leaveCallbacks.set(node, () => this.popParentField());
        }
      },
      leave: (node: InlineFragmentNode) => {
        this.invokeLeaveCallback(node);
      },
    };
  }
}
