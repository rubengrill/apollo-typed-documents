export type TypedFilesModulesConfig = {
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
