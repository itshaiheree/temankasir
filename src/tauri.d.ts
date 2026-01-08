declare module '@tauri-apps/api/tauri' {
  export function invoke<T = unknown>(cmd: string, params?: any): Promise<T>;
}
