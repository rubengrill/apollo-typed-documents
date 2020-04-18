import { DocumentNode, OperationDefinitionNode } from "graphql";
import { pascalCase } from "pascal-case";

export type Config = { typesModule: string };

interface OutputNode {
  output: string;
}

export default class TypedDocumentVisitor {
  output: string[];
  basename: string;
  config: Config;

  constructor(output: string[], basename: string, config: Config) {
    this.output = output;
    this.basename = basename;
    this.config = config;
  }

  get Document() {
    return {
      leave: (node: DocumentNode) => {
        const output: string[] = [];

        output.push(`declare module "*/${this.basename}" {`);
        output.push(
          node.definitions
            .map(
              (definitionNode) => ((definitionNode as any) as OutputNode).output
            )
            .join("\n")
        );

        if (node.definitions.length === 1) {
          const definitionNode = node.definitions[0];
          const operationNode = definitionNode as OperationDefinitionNode;
          output.push(`  export default ${operationNode.name!.value}`);
        }

        output.push(`}`);

        this.output.push(output.join("\n"));
      },
    };
  }

  get OperationDefinition() {
    return {
      enter: (_node: OperationDefinitionNode) => {
        const node = _node as OperationDefinitionNode & OutputNode;
        const output: string[] = [];
        const typeName = pascalCase(node.name!.value);
        const typeNameSuffix = pascalCase(node.operation);

        output.push(
          '  import { TypedDocumentNode } from "apollo-typed-documents"'
        );
        output.push(
          `  import {${typeName}${typeNameSuffix}, ${typeName}${typeNameSuffix}Variables} from "${this.config.typesModule}"`
        );
        output.push(
          `  export const ${
            node.name!.value
          }: TypedDocumentNode<${typeName}${typeNameSuffix}Variables, ${typeName}${typeNameSuffix}>`
        );

        node.output = output.join("\n");

        return false; // No need to traverse deeper
      },
    };
  }
}
