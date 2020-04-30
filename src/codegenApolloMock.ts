import { PluginFunction } from "@graphql-codegen/plugin-helpers";
import {
  ScalarsMap,
  buildScalars,
} from "@graphql-codegen/visitor-plugin-common";
import { visit } from "graphql";

import MockVisitor from "./visitors/MockVisitor";
import TypedVisitor from "./visitors/TypedVisitor";

export type Config = { scalars?: ScalarsMap };

export const plugin: PluginFunction<Config> = (schema, documents, config) => {
  const documentNodes = documents.map((document) => {
    if (!document.document) {
      throw new Error("Missing document node");
    }
    return document.document;
  });

  const output: string[] = [];
  const inputObjectTypeOutput: string[] = [];
  const scalars = buildScalars(schema, config.scalars || {});
  const mockVisitor = new MockVisitor(output, inputObjectTypeOutput, {
    scalars,
  });

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
