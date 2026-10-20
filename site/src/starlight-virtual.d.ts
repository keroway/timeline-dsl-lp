// Starlight 0.42 は virtual:starlight/user-config の型宣言を公開しなくなった。
// 実行時は Vite が解決するため、このリポジトリが参照するフィールドだけを宣言する。
declare module "virtual:starlight/user-config" {
  const config: {
    social?: {
      label: string;
      href: string;
      icon: import("@astrojs/starlight/types").StarlightIcon;
    }[];
    pagefind?: boolean;
    components: { Search: string };
    credits?: boolean;
  };
  export default config;
}
