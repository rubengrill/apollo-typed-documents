import { PluginFunction } from "@graphql-codegen/plugin-helpers";
import { visit } from "graphql";

import MockVisitor from "./visitors/MockVisitor";
import TypedVisitor from "./visitors/TypedVisitor";

export const plugin: PluginFunction = (schema, documents) => {
  const documentNodes = documents.map((document) => {
    if (!document.document) {
      throw new Error("Missing document node");
    }
    return document.document;
  });

  const output: string[] = [];
  const inputObjectTypeOutput: string[] = [];
  const mockVisitor = new MockVisitor(output, inputObjectTypeOutput);

  output.push("import { createApolloMock } from 'apollo-typed-documents';");
  output.push("const operations = {};");
  output.push("export default createApolloMock(operations);");

  documentNodes.forEach((documentNode) => {
    const typedVisitor = new TypedVisitor(schema);
    const typedDocumentNode = visit(documentNode, typedVisitor);

    visit(typedDocumentNode, mockVisitor);
  });

  return [...output, ...inputObjectTypeOutput].join("\n\n");
};
