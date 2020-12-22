import { basename, relative } from "path";

import { DefinitionNode, DocumentNode, OperationDefinitionNode } from "graphql";
import { pascalCase } from "pascal-case";

export type Config = {
  typesModule: string;
  modulePathPrefix: string;
  useRelative: boolean;
  prefix: string;
};

const isOperationDefinitionNode = (
  node: DefinitionNode
): node is OperationDefinitionNode => node.kind === "OperationDefinition";

export default class TypedDocumentVisitor {
  constructor(
    readonly output: string[],
    readonly location: string,
    readonly config: Config
  ) {}

  Document = (node: DocumentNode) => {
    const operationNodes = node.definitions.filter(isOperationDefinitionNode);
    const output: string[] = [];

    const filepath = this.config.useRelative
      ? relative(process.cwd(), this.location)
      : basename(this.location);

    const modulePath = `${this.config.prefix}${this.config.modulePathPrefix}${filepath}`;

    output.push(`declare module "${modulePath}" {\n`);
    output.push(
      '  import { TypedDocumentNode } from "apollo-typed-documents";\n'
    );

    operationNodes.forEach((operationNode) => {
      if (!operationNode.name) {
        throw new Error("Operation must have a name");
      }

      const operationName = operationNode.name.value;
      const typeName = pascalCase(operationName);
      const typeNameSuffix = pascalCase(operationNode.operation);

      output.push(
        `  import { ${typeName}${typeNameSuffix}, ${typeName}${typeNameSuffix}Variables } from "${this.config.typesModule}";\n`
      );
      output.push(
        `  export const ${operationName}: TypedDocumentNode<${typeName}${typeNameSuffix}Variables, ${typeName}${typeNameSuffix}>;\n`
      );
    });

    if (operationNodes.length === 1) {
      const operationName = operationNodes[0].name?.value;

      output.push(`  export default ${operationName};\n`);
    }

    output.push(`}`);

    this.output.push(output.join(""));

    return false; // No need to traverse deeper
  };
}
