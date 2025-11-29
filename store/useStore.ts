import useStore, * as storeExports from "@/lib/store";

export * from "@/lib/store";

export const useStore = storeExports.useStore;
export const useUIStore = storeExports.useUIStore;

export default useStore;


