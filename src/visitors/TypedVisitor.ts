import {
  DefinitionNode,
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  FragmentSpreadNode,
  GraphQLAbstractType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLUnionType,
  InlineFragmentNode,
  OperationDefinitionNode,
  SelectionNode,
  VariableDefinitionNode,
  isAbstractType,
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
  isNonNull: boolean;
  isList: boolean;
  isFragment: boolean;
  isTypename: boolean;
  typenames: string[];

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
  isNonNull: false,
  isList: false,
  isFragment: false,
  isTypename: false,
  typenames: [],
  ...field,
});

const isFragmentDefinitionNode = (
  node: DefinitionNode
): node is FragmentDefinitionNode => node.kind === "FragmentDefinition";

export default class TypedVisitor {
  readonly inputObjectTypeFields: { [name: string]: TypedField[] } = {};
  readonly fragmentFields: { [name: string]: TypedField } = {};

  constructor(readonly schema: GraphQLSchema) {}

  Document = (node: DocumentNode) => {
    const fragmentNodes = node.definitions.filter(isFragmentDefinitionNode);

    fragmentNodes.forEach((fragmentNode) => {
      const name = fragmentNode.name.value;
      this.fragmentFields[name] = createTypedField({ name });
    });

    fragmentNodes.forEach((fragmentNode) => {
      const name = fragmentNode.name.value;
      const typedField = this.getOutputFieldForFragment(fragmentNode);
      Object.assign(this.fragmentFields[name], typedField);
    });
  };

  OperationDefinition = (_node: OperationDefinitionNode) => {
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
      typenames: this.getTypenames(type),
    });

    typedField.inputFields = this.getInputFields(
      node.variableDefinitions || []
    );

    typedField.outputFields = this.getOutputFields(
      node.selectionSet.selections,
      typedField
    );

    node.typed = typedField;

    return false; // No need to traverse deeper
  };

  getTypenames(type: GraphQLObjectType | GraphQLAbstractType) {
    if (isObjectType(type)) {
      return [type.name];
    } else if (isAbstractType(type)) {
      return this.schema.getPossibleTypes(type).map((type) => type.name);
    } else {
      return [];
    }
  }

  getInputFields(nodes: readonly VariableDefinitionNode[]) {
    return nodes.map((node) => {
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
        typedField.inputFields = this.getInputFieldsForInputObjectType(type);
      } else if (isScalarType(type)) {
        typedField.scalarType = type;
      } else if (isEnumType(type)) {
        typedField.enumType = type;
      }

      return typedField;
    });
  }

  getInputFieldsForInputObjectType(type: GraphQLInputObjectType) {
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
          typedField.inputFields = this.getInputFieldsForInputObjectType(
            fieldType
          );
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

  getOutputFields(nodes: readonly SelectionNode[], parentField: TypedField) {
    return nodes.map((node) => {
      if (node.kind === "Field") {
        return this.getOutputFieldForField(node, parentField);
      } else if (node.kind === "InlineFragment") {
        return this.getOutputFieldForFragment(node);
      } else if (node.kind === "FragmentSpread") {
        return this.getOutputFieldForFragmentSpread(node);
      } else {
        throw new Error("Not supported");
      }
    });
  }

  getOutputFieldForField(node: FieldNode, parentField: TypedField) {
    const name = node.name.value;

    if (name === "__typename") {
      return createTypedField({ name, isTypename: true });
    }

    const parentType = parentField.objectType || parentField.interfaceType;

    if (!parentType) {
      throw new Error("Parent type is not an object or interface type");
    }

    const fields = parentType.getFields();
    const field = fields[name];

    if (!field) {
      throw new Error(
        `Field "${name}" does not exist on type "${parentType.name}"`
      );
    }

    const typedField = createTypedField({ name });

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

    if (isObjectType(type)) {
      typedField.objectType = type;
    } else if (isInterfaceType(type)) {
      typedField.interfaceType = type;
    } else if (isUnionType(type)) {
      typedField.unionType = type;
    } else if (isScalarType(type)) {
      typedField.scalarType = type;
    } else if (isEnumType(type)) {
      typedField.enumType = type;
    }

    if (isObjectType(type) || isAbstractType(type)) {
      typedField.typenames = this.getTypenames(type);
      typedField.outputFields = this.getOutputFields(
        node.selectionSet?.selections || [],
        typedField
      );
    }

    return typedField;
  }

  getOutputFieldForFragment(node: InlineFragmentNode | FragmentDefinitionNode) {
    const typedField = createTypedField({
      name: node.kind,
      isFragment: true,
    });

    if (node.typeCondition) {
      const type = this.schema.getType(node.typeCondition.name.value);

      if (isObjectType(type)) {
        typedField.objectType = type;
        typedField.typenames = this.getTypenames(type);
      } else if (isInterfaceType(type)) {
        typedField.interfaceType = type;
        typedField.typenames = this.getTypenames(type);
      } else if (isUnionType(type)) {
        typedField.unionType = type;
        typedField.typenames = this.getTypenames(type);
      }
    }

    typedField.outputFields = this.getOutputFields(
      node.selectionSet.selections,
      typedField
    );

    return typedField;
  }

  getOutputFieldForFragmentSpread(node: FragmentSpreadNode) {
    const typedField = this.fragmentFields[node.name.value];

    if (!typedField) {
      throw new Error(`Fragment "${node.name.value}" not defined`);
    }

    return typedField;
  }
}
