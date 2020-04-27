import { FieldNode, GraphQLSchema, OperationDefinitionNode } from "graphql";

import {
  TypedField,
  TypedFieldNode,
  TypedVariableDefinitionNode,
} from "./TypedVisitor";

export default class MockVisitor {
  schema: GraphQLSchema;
  output: string[];
  inputObjectTypeOutput: string[];
  inputObjectTypeOutputState: { [inputObjectTypeName: string]: true } = {};

  constructor(
    schema: GraphQLSchema,
    output: string[],
    inputObjectTypeOutput: string[]
  ) {
    this.schema = schema;
    this.output = output;
    this.inputObjectTypeOutput = inputObjectTypeOutput;
  }

  get OperationDefinition() {
    return {
      leave: (node: OperationDefinitionNode) => {
        if (!node.name) {
          throw new Error("Operation doesn't have a name");
        }

        const name = node.name.value;
        const output: string[] = [];

        output.push(`operations.${name} = {};\n`);
        output.push(`operations.${name}.variables = `);
        output.push(
          this.getTypedFieldSetOutput(
            (node.variableDefinitions || []).map((variableDefinitionNode) => {
              const typedNode = variableDefinitionNode as TypedVariableDefinitionNode;
              return typedNode.typed;
            }),
            { input: true }
          )
        );
        output.push("\n");
        output.push(`operations.${name}.data = `);
        output.push(
          this.getTypedFieldSetOutput(
            node.selectionSet.selections
              .filter((selectionNode) => selectionNode.kind === "Field")
              .map((selectionNode) => {
                const fieldNode = (selectionNode as FieldNode) as TypedFieldNode;
                return fieldNode.typed;
              })
          )
        );

        this.output.push(output.join(""));
      },
    };
  }

  getTypedFieldSetOutput(
    fields: TypedField[],
    {
      indent = 0,
      input = false,
      parent = undefined,
    }: { indent?: number; input?: boolean; parent?: TypedField } = {}
  ) {
    const output: string[] = [];
    const defaultValue = input ? "undefined" : "null";

    output.push("(values = {}, options = {}) => {\n");

    indent += 2;

    if (!parent) {
      output.push(" ".repeat(indent));
      output.push("const __typename = '';\n");
    } else if (parent.inputObjectType) {
      output.push(" ".repeat(indent));
      output.push(`const __typename = '${parent.inputObjectType.name}';\n`);
    } else if (parent.objectType) {
      output.push(" ".repeat(indent));
      output.push(`const __typename = '${parent.objectType.name}';\n`);
    } else if (parent.interfaceType) {
      const typenames = this.schema
        .getPossibleTypes(parent.interfaceType)
        .map((type) => type.name);

      output.push(" ".repeat(indent));
      output.push("const typenames = [");
      output.push(typenames.map((typename) => `'${typename}'`).join(", "));
      output.push("];\n");

      output.push(" ".repeat(indent));
      output.push(
        "const __typename = typenames.find(typename => typename === values.__typename) || typenames[0];\n"
      );
    }

    output.push(" ".repeat(indent));
    output.push("values = (({ ");
    output.push(
      fields.map((field) => `${field.name} = ${defaultValue}`).join(", ")
    );
    output.push(" }) => ({ ");
    output.push(fields.map((field) => `${field.name}`).join(", "));
    output.push(" }))(values);\n");

    output.push(" ".repeat(indent));
    output.push("return {\n");

    output.push(
      fields
        .map((field) => this.getTypedFieldOutput(field, { indent: indent + 2 }))
        .join(",\n")
    );

    if (parent?.objectType || parent?.interfaceType) {
      output.push(",\n");
      output.push(" ".repeat(indent + 2));
      output.push(`...(options.addTypename ? { __typename } : {})`);
    }

    output.push("\n");
    output.push(" ".repeat(indent));
    output.push("};\n");

    indent -= 2;

    output.push(" ".repeat(indent));
    output.push("}");

    return output.join("");
  }

  getTypedInputFieldSetOutput(field: TypedField) {
    if (!field.inputObjectType) {
      throw new Error("Method must only be used for input object type fields");
    }

    const inputObjectTypeName = field.inputObjectType.name;

    if (!this.inputObjectTypeOutputState[inputObjectTypeName]) {
      const output: string[] = [];

      this.inputObjectTypeOutputState[inputObjectTypeName] = true;

      output.push(`const ${inputObjectTypeName} = `);
      output.push(
        this.getTypedFieldSetOutput(field.fields, {
          input: true,
          parent: field,
        })
      );

      this.inputObjectTypeOutput.push(output.join(""));
    }

    return inputObjectTypeName;
  }

  getTypedFieldOutput(field: TypedField, { indent = 0 } = {}) {
    const name = field.name;
    const output: string[] = [];

    output.push(" ".repeat(indent));

    if (field.inputObjectType || field.objectType || field.interfaceType) {
      let nestedOutput: string;

      if (field.inputObjectType) {
        nestedOutput = this.getTypedInputFieldSetOutput(field);
      } else {
        nestedOutput = this.getTypedFieldSetOutput(field.fields, {
          indent,
          parent: field,
        });
      }

      output.push(`${name}: `);

      if (field.isNonNull) {
        if (field.isList) {
          output.push(`(values.${name} || []).map(item => (`);
          output.push(nestedOutput);
          output.push(`)(item, options))`);
        } else {
          output.push("(");
          output.push(nestedOutput);
          output.push(`)(values.${name} || undefined, options)`);
        }
      } else {
        if (field.isList) {
          output.push(
            `!values.${name} ? values.${name} : values.${name}.map(item => (`
          );
          output.push(nestedOutput);
          output.push(`)(item, options))`);
        } else {
          output.push(`!values.${name} ? values.${name} : (`);
          output.push(nestedOutput);
          output.push(`)(values.${name}, options)`);
        }
      }
    } else if (field.scalarType || field.enumType) {
      let defaultValue = "null";

      if (field.scalarType) {
        switch (field.scalarType.name) {
          case "Int":
          case "Float":
            defaultValue = "1";
            break;
          case "String":
          case "ID":
          case "UUID":
            defaultValue = `[__typename, '${name}'].filter(v => v).join('-')`;
            break;
          case "Boolean":
            defaultValue = "false";
            break;
        }
      } else if (field.enumType) {
        defaultValue = `"${field.enumType.getValues()[0].value}"`;
      }

      if (field.isNonNull) {
        if (field.isList) {
          output.push(`${name}: values.${name} || []`);
        } else {
          output.push(
            `${name}: (values.${name} === null || values.${name} === undefined) ? ${defaultValue} : values.${name}`
          );
        }
      } else {
        output.push(`${name}: values.${name}`);
      }
    } else {
      output.push(`${name}: values.${name}`);
    }

    return output.join("");
  }
}
