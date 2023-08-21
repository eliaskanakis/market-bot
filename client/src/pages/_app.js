import { useEffect } from "react"
import 'bootstrap/dist/css/bootstrap.css'

import Layout from '../components/layout'
import NoSSRWrapper from "../components/no-ssr-wrapper"

import '../styles.css'

export default function MyApp({ Component, pageProps }) {

  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <NoSSRWrapper>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </NoSSRWrapper>
  )
}