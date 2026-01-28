import { Layout } from "../components/Layout.tsx"


type ErrorProps = {
  message: string

}

export function ErrorPage({message }: ErrorProps) {
  return (
    <Layout>
        <h2>ERROR</h2>
        <p>{message}</p>
    </Layout>
  )
}
