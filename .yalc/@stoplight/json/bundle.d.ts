export declare const BUNDLE_ROOT = "#/__bundled__";
export declare const ERRORS_ROOT = "#/__errors__";
export declare const bundleTarget: <T = unknown>({ document, path, bundleRoot, errorsRoot, }: {
    document: T;
    path: string;
    bundleRoot?: string | undefined;
    errorsRoot?: string | undefined;
}, cur?: unknown) => any;