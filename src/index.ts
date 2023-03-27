import {
  PluginFunction,
  PluginValidateFn,
} from "@graphql-codegen/plugin-helpers";
import { visit } from "graphql";

import { TypedFilesModulesConfig } from "./config";
import TypedDocumentVisitor from "./visitors/TypedDocumentVisitor";

export const plugin: PluginFunction<TypedFilesModulesConfig> = (
  _schema,
  documents,
  { typesModule, modulePathPrefix = "", relativeToCwd, prefix = "*/" }
) => {
  const config = {
    typesModule,
    modulePathPrefix,
    relativeToCwd: relativeToCwd === true,
    prefix,
  };

  const output: string[] = [];

  documents.forEach((document) => {
    if (!document.location) {
      throw new Error("Missing document location");
    }
    if (!document.document) {
      throw new Error("Missing document node");
    }

    const visitor = new TypedDocumentVisitor(output, document.location, config);

    visit(document.document, visitor);
  });

  return output.join("\n\n");
};

export const validate: PluginValidateFn<TypedFilesModulesConfig> = (
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
