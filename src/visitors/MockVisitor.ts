import {
  FieldNode,
  OperationDefinitionNode,
  SelectionSetNode,
  isNonNullType,
} from "graphql";

import { TypedFieldNode } from "./TypedVisitor";

interface OutputNode {
  output: String;
}

export default class MockVisitor {
  output: String[];
  indent = 0;

  constructor(output: String[]) {
    this.output = output;
  }

  get OperationDefinition() {
    return {
      leave: (_node: OperationDefinitionNode) => {
        const node = _node as OperationDefinitionNode & OutputNode;
        const output: String[] = [];

        output.push(`operations["${node.name!.value}"] = `);
        output.push(((node.selectionSet as any) as OutputNode).output);

        this.output.push(output.join(""));
      },
    };
  }

  get SelectionSet() {
    return {
      enter: () => {
        this.indent += 2;
      },
      leave: (_node: SelectionSetNode) => {
        const node = _node as SelectionSetNode & OutputNode;
        const output: String[] = [];

        this.indent -= 2;

        output.push("({ ");
        output.push(
          node.selections
            .map((selectionNode) => {
              if (selectionNode.kind === "Field") {
                return `${selectionNode.name.value} = null`;
              }
            })
            .filter((v) => v)
            .join(", ")
        );
        output.push(" } = {}) => ({\n");
        output.push(
          node.selections
            .map(
              (selectionNode) => ((selectionNode as any) as OutputNode).output
            )
            .join(",\n")
        );
        output.push("\n");
        output.push(" ".repeat(this.indent));
        output.push("})");

        node.output = output.join("");
      },
    };
  }

  get Field() {
    return {
      leave: (_node: FieldNode) => {
        const node = _node as TypedFieldNode & OutputNode;
        const name = node.name.value;
        const output: String[] = [];

        output.push(" ".repeat(this.indent));

        if (node.objectType) {
          const selectionSet = node.selectionSet;
          const nestedOutput = ((selectionSet as any) as OutputNode).output;

          output.push(`${name}: `);

          if (isNonNullType(node.type)) {
            if (node.listType) {
              output.push(`(${name} || []).map(`);
              output.push(nestedOutput);
              output.push(`)`);
            } else {
              output.push("(");
              output.push(nestedOutput);
              output.push(`)(${name} || undefined)`);
            }
          } else {
            if (node.listType) {
              output.push(`!${name} ? null : ${name}.map(`);
              output.push(nestedOutput);
              output.push(`)`);
            } else {
              output.push(`!${name} ? null : (`);
              output.push(nestedOutput);
              output.push(`)(${name})`);
            }
          }
        } else if (node.scalarType || node.enumType) {
          let defaultValue = "null";

          if (node.scalarType) {
            switch (node.scalarType.name) {
              case "Int":
              case "Float":
                defaultValue = "1";
                break;
              case "String":
              case "ID":
              case "UUID":
                defaultValue = `"${node.parentObjectType.name}-${name}"`;
                break;
              case "Boolean":
                defaultValue = "false";
                break;
            }
          } else if (node.enumType) {
            defaultValue = `"${node.enumType.getValues()[0].value}"`;
          }

          if (isNonNullType(node.type)) {
            if (node.listType) {
              output.push(`${name}: ${name} || []`);
            } else {
              output.push(
                `${name}: ${name} === null ? ${defaultValue} : ${name}`
              );
            }
          } else {
            if (node.listType) {
              output.push(`${name}: ${name} || null`);
            } else {
              output.push(name);
            }
          }
        } else {
          output.push(name);
        }

        node.output = output.join("");
      },
    };
  }
}
