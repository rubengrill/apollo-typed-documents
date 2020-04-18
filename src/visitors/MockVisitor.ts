import { FieldNode, OperationDefinitionNode } from "graphql";

import {
  TypedField,
  TypedFieldNode,
  TypedVariableDefinitionNode,
} from "./TypedVisitor";

export default class MockVisitor {
  output: string[];
  inputObjectTypeOutput: string[];
  inputObjectTypeOutputState: { [inputObjectTypeName: string]: true } = {};

  constructor(output: string[], inputObjectTypeOutput: string[]) {
    this.output = output;
    this.inputObjectTypeOutput = inputObjectTypeOutput;
  }

  get OperationDefinition() {
    return {
      leave: (node: OperationDefinitionNode) => {
        const name = node.name!.value;
        const output: string[] = [];

        output.push(`operations.${name} = {};\n`);
        output.push(`operations.${name}.variables = `);
        output.push(
          this.getTypedFieldSetOutput(
            (node.variableDefinitions || []).map((variableDefinitionNode) => {
              const typedNode = variableDefinitionNode as TypedVariableDefinitionNode;
              return typedNode.typed;
            }),
            undefined,
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
    fields: TypedField<any>[],
    parent?: TypedField<any>,
    { indent = 0, input = false } = {}
  ) {
    const output: string[] = [];
    const defaultValue = input ? "undefined" : "null";

    output.push("(values = {}, options = {}) => {\n");

    indent += 2;

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
        .map((field) =>
          this.getTypedFieldOutput(field, { indent: indent + 2, input })
        )
        .join(",\n")
    );

    if (parent && !input) {
      const typename = parent.objectType!.name;

      output.push(",\n");
      output.push(" ".repeat(indent + 2));
      output.push(
        `...(options.addTypename ? {__typename: "${typename}"} : {})`
      );
    }

    output.push("\n");
    output.push(" ".repeat(indent));
    output.push("};\n");

    indent -= 2;

    output.push(" ".repeat(indent));
    output.push("}");

    return output.join("");
  }

  getTypedInputFieldSetOutput(field: TypedField<any>) {
    const inputObjectTypeName = field.objectType!.name;

    if (!this.inputObjectTypeOutputState[inputObjectTypeName]) {
      const output: string[] = [];

      this.inputObjectTypeOutputState[inputObjectTypeName] = true;

      output.push(`const ${inputObjectTypeName} = `);
      output.push(
        this.getTypedFieldSetOutput(field.fields, undefined, { input: true })
      );

      this.inputObjectTypeOutput.push(output.join(""));
    }

    return inputObjectTypeName;
  }

  getTypedFieldOutput(
    field: TypedField<any>,
    { indent = 0, input = false } = {}
  ) {
    const name = field.name;
    const output: string[] = [];

    output.push(" ".repeat(indent));

    if (field.objectType) {
      let nestedOutput: string;

      if (input) {
        nestedOutput = this.getTypedInputFieldSetOutput(field);
      } else {
        nestedOutput = this.getTypedFieldSetOutput(field.fields, field, {
          indent,
          input,
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
            defaultValue = [field.parentObjectType?.name, name]
              .filter((v) => v)
              .join("-");
            defaultValue = `"${defaultValue}"`;
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
