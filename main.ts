import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello MOMMY! Miss yea')
})

Deno.serve(app.fetch)
