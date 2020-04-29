import { OperationDefinitionNode } from "graphql";

import { TypedField, TypedOperationDefinitionNode } from "./TypedVisitor";

export default class MockVisitor {
  readonly inputObjectTypeOutputState: { [name: string]: true } = {};

  constructor(
    readonly output: string[],
    readonly inputObjectTypeOutput: string[]
  ) {}

  OperationDefinition = (_node: OperationDefinitionNode) => {
    const node = _node as TypedOperationDefinitionNode;

    if (!node.name) {
      throw new Error("Operation doesn't have a name");
    }

    const name = node.name.value;
    const output: string[] = [];

    output.push(`operations.${name} = {};\n`);
    output.push(`operations.${name}.variables = `);
    output.push(
      this.getFieldSetOutput(node.typed, { root: true, input: true })
    );
    output.push("\n");
    output.push(`operations.${name}.data = `);
    output.push(this.getFieldSetOutput(node.typed, { root: true }));

    this.output.push(output.join(""));

    return false; // No need to traverse deeper
  };

  getFieldSetOutput(
    field: TypedField,
    { indent = 0, input = false, root = false } = {}
  ) {
    const output: string[] = [];

    output.push("(values = {}, options = {}) => {\n");

    indent += 2;

    if (!field.isFragment) {
      if (root) {
        output.push(" ".repeat(indent));
        output.push("const __typename = '';\n");
      } else if (field.inputObjectType) {
        output.push(" ".repeat(indent));
        output.push(`const __typename = '${field.inputObjectType.name}';\n`);
      } else if (field.objectType) {
        output.push(" ".repeat(indent));
        output.push(`const __typename = '${field.objectType.name}';\n`);
      } else if (field.interfaceType || field.unionType) {
        output.push(" ".repeat(indent));
        output.push("const typenames = [");
        output.push(field.typenames.map((name) => `'${name}'`).join(", "));
        output.push("];\n");

        output.push(" ".repeat(indent));
        output.push(
          "const __typename = typenames.find(typename => typename === values.__typename) || typenames[0];\n"
        );
      }
    }

    const defaultValue = input ? "undefined" : "null";
    const fields = input ? field.inputFields : field.outputFields;
    const fieldNames = fields
      .filter((field) => !field.isFragment)
      .map((field) => field.name);

    output.push(" ".repeat(indent));
    output.push("values = (({ ");
    output.push(
      fieldNames.map((name) => `${name} = ${defaultValue}`).join(", ")
    );
    output.push(" }) => ({ ");
    output.push(fieldNames.join(", "));
    output.push(" }))(values);\n");

    if (!field.isFragment) {
      output.push(" ".repeat(indent));
      output.push("values.__typename = __typename;\n");
    }

    output.push(" ".repeat(indent));
    output.push("return {\n");

    output.push(
      fields
        .map((field) => this.getFieldOutput(field, { indent: indent + 2 }))
        .join(",\n")
    );

    if (!field.isFragment && !root) {
      if (field?.objectType || field?.interfaceType || field?.unionType) {
        output.push(",\n");
        output.push(" ".repeat(indent + 2));
        output.push(`...(options.addTypename ? { __typename } : {})`);
      }
    }

    output.push("\n");
    output.push(" ".repeat(indent));
    output.push("};\n");

    indent -= 2;

    output.push(" ".repeat(indent));
    output.push("}");

    return output.join("");
  }

  getInputFieldSetOutput(field: TypedField) {
    if (!field.inputObjectType) {
      throw new Error("Method must only be used for input object type fields");
    }

    const inputObjectTypeName = field.inputObjectType.name;

    if (!this.inputObjectTypeOutputState[inputObjectTypeName]) {
      const output: string[] = [];

      this.inputObjectTypeOutputState[inputObjectTypeName] = true;

      output.push(`const ${inputObjectTypeName} = `);
      output.push(this.getFieldSetOutput(field, { input: true }));

      this.inputObjectTypeOutput.push(output.join(""));
    }

    return inputObjectTypeName;
  }

  getFieldOutput(field: TypedField, { indent = 0 } = {}) {
    const name = field.name;
    const output: string[] = [];

    output.push(" ".repeat(indent));

    if (field.isFragment) {
      output.push("...([");
      output.push(field.typenames.map((name) => `'${name}'`).join(", "));
      output.push("].find(typename => typename === __typename) ? (");
      output.push(this.getFieldSetOutput(field, { indent }));
      output.push(")(values, options) : {})");
    } else if (
      field.inputObjectType ||
      field.objectType ||
      field.interfaceType ||
      field.unionType
    ) {
      let nestedOutput: string;

      if (field.inputObjectType) {
        nestedOutput = this.getInputFieldSetOutput(field);
      } else {
        nestedOutput = this.getFieldSetOutput(field, { indent });
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
