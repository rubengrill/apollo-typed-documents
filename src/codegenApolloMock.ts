import { PluginFunction } from "@graphql-codegen/plugin-helpers";
import { visit } from "graphql";

import MockVisitor from "./visitors/MockVisitor";
import TypedVisitor from "./visitors/TypedVisitor";

export const plugin: PluginFunction = (schema, documents) => {
  const documentNodes = documents.map((document) => document.document!);
  const output: String[] = [];

  output.push('import { createApolloMock } from "apollo-typed-documents";');
  output.push("const operations = {};");
  output.push("export default createApolloMock(operations);");

  documentNodes.forEach((documentNode) => {
    const typedVisitor = new TypedVisitor(schema);
    const mockVisitor = new MockVisitor(output);
    const typedDocumentNode = visit(documentNode, typedVisitor);

    visit(typedDocumentNode, mockVisitor);
  });

  return output.join("\n\n");
};
