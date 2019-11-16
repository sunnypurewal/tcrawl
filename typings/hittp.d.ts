declare module "hittp" {
  import { Readable } from "stream";
  function str2url(str: string): URL
  function configure(options: any): void
  function stream(url: URL): Promise<Readable>
  function cancel(url: URL): void
}