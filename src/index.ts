import {
  PluginFunction,
  PluginValidateFn,
} from "@graphql-codegen/plugin-helpers";
import { visit } from "graphql";

import TypedDocumentVisitor from "./visitors/TypedDocumentVisitor";

export type UserConfig = {
  typesModule: string;

  /**
   * @default ""
   * @description Allows specifying a module definition path prefix to provide
   * distinction between generated types.
   */
  modulePathPrefix?: string;

  /**
   * @default false
   * @description By default, only the filename is being used to generate TS
   * module declarations. Setting this to `true` will generate it with a full
   * path based on the CWD.
   */
  relativeToCwd?: boolean;

  /**
   * @default *\/
   * @description By default, a wildcard is being added as prefix, you can
   * change that to a custom prefix.
   */
  prefix?: string;
};

export const plugin: PluginFunction<UserConfig> = (
  _schema,
  documents,
  { typesModule, modulePathPrefix = "", relativeToCwd, prefix = "*/" }
) => {
  const config = {
    typesModule,
    modulePathPrefix,
    useRelative: relativeToCwd === true,
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

export const validate: PluginValidateFn<UserConfig> = (
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
