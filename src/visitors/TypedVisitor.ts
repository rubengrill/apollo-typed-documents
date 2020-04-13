import {
  FieldNode,
  GraphQLEnumType,
  GraphQLList,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLSchema,
  OperationDefinitionNode,
  isEnumType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
} from "graphql";

export interface TypedFieldNode extends FieldNode {
  type: GraphQLOutputType;
  parentObjectType: GraphQLObjectType;
  objectType?: GraphQLObjectType;
  listType?: GraphQLList<any>;
  scalarType?: GraphQLScalarType;
  enumType?: GraphQLEnumType;
}

export default class TypedVisitor {
  schema: GraphQLSchema;
  types: GraphQLObjectType[] = [];
  type: GraphQLObjectType = null as any;

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

  get Field() {
    return {
      enter: (_node: FieldNode) => {
        const node = _node as TypedFieldNode;
        const fields = this.type.getFields();
        const field = fields[node.name.value];
        let type = field.type;

        node.type = type;
        node.parentObjectType = this.type;

        if (isNonNullType(type)) {
          type = type.ofType;
        }

        if (isListType(type)) {
          node.listType = type;
          type = type.ofType;
        }

        if (isNonNullType(type)) {
          type = type.ofType;
        }

        if (isObjectType(type)) {
          node.objectType = type;
          this.putType(type);
        } else if (isScalarType(type)) {
          node.scalarType = type;
        } else if (isEnumType(type)) {
          node.enumType = type;
        }
      },
      leave: (_node: FieldNode) => {
        const node = _node as TypedFieldNode;

        if (node.objectType) {
          this.popType();
        }
      },
    };
  }
}
