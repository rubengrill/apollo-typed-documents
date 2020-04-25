import { OperationDefinitionNode } from "graphql";
import { pascalCase } from "pascal-case";

export interface Config {
  typesModule: string;
}

export default class TypedDocumentVisitor {
  output: string[];
  basename: string;
  config: Config;
  operationOutput: { [operationName: string]: string } = {};

  constructor(output: string[], basename: string, config: Config) {
    this.output = output;
    this.basename = basename;
    this.config = config;
  }

  get Document() {
    return {
      leave: () => {
        const output: string[] = [];
        const operationOutputKeys = Object.keys(this.operationOutput);
        const operationOutputValues = Object.values(this.operationOutput);

        output.push(`declare module "*/${this.basename}" {\n`);
        output.push(
          '  import { TypedDocumentNode } from "apollo-typed-documents";\n'
        );

        operationOutputValues.forEach((operationOutput) => {
          output.push(operationOutput);
          output.push("\n");
        });

        if (operationOutputKeys.length === 1) {
          const [operationName] = operationOutputKeys;
          output.push(`  export default ${operationName};\n`);
        }

        output.push(`}`);

        this.output.push(output.join(""));
      },
    };
  }

  get OperationDefinition() {
    return {
      enter: (node: OperationDefinitionNode) => {
        if (!node.name) {
          throw new Error("Operation must have a name");
        }

        const operationName = node.name.value;
        const typeName = pascalCase(operationName);
        const typeNameSuffix = pascalCase(node.operation);
        const output: string[] = [];

        output.push(
          `  import { ${typeName}${typeNameSuffix}, ${typeName}${typeNameSuffix}Variables } from "${this.config.typesModule}";\n`
        );
        output.push(
          `  export const ${operationName}: TypedDocumentNode<${typeName}${typeNameSuffix}Variables, ${typeName}${typeNameSuffix}>;`
        );

        this.operationOutput[operationName] = output.join("");

        return false; // No need to traverse deeper
      },
    };
  }
}
