import path from "path";

import {
  PluginFunction,
  PluginValidateFn,
} from "@graphql-codegen/plugin-helpers";
import { visit } from "graphql";

import TypedDocumentVisitor from "./visitors/TypedDocumentVisitor";
import TypedVisitor from "./visitors/TypedVisitor";

export type Config = { typesModule: string };

export const plugin: PluginFunction<Config> = (schema, documents, config) => {
  const output: string[] = [];

  documents.forEach((document) => {
    const basename = path.basename(document.location!);
    const typedVisitor = new TypedVisitor(schema);
    const typedDocumentVisitor = new TypedDocumentVisitor(
      output,
      basename,
      config
    );
    const typedDocumentNode = visit(document.document!, typedVisitor);

    visit(typedDocumentNode, typedDocumentVisitor);
  });

  return output.join("\n\n");
};

export const validate: PluginValidateFn<Config> = (
  _schema,
  _documents,
  config
) => {
  if (!config.typesModule) {
    throw new Error(`You must specify "typesModule"!`);
  }

  if (
    config.typesModule.startsWith("./") ||
    config.typesModule.startsWith("../")
  ) {
    throw new Error(
      `You must specify a non relative module for "typesModule"!`
    );
  }
};
