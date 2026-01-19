import "hono"

declare module "hono" {
  interface ContextVariableMap {
    email: string,
    userId:string
  }
}