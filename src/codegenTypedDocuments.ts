import path from "path";

import {
  PluginFunction,
  PluginValidateFn,
} from "@graphql-codegen/plugin-helpers";
import { visit } from "graphql";

import TypedDocumentVisitor from "./visitors/TypedDocumentVisitor";

export type Config = { typesModule: string };

export const plugin: PluginFunction<Config> = (_schema, documents, config) => {
  const output: string[] = [];

  documents.forEach((document) => {
    if (!document.location) {
      throw new Error("Missing document location");
    }
    if (!document.document) {
      throw new Error("Missing document node");
    }

    const basename = path.basename(document.location);
    const visitor = new TypedDocumentVisitor(output, basename, config);

    visit(document.document, visitor);
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
