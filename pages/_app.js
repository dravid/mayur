import React from 'react';
import App, { Container } from 'next/app';
// import { appWithTranslation } from '../utils/i18n'

class MyApp extends App {
  static async getInitialProps({ Component, ctx, req, res, query }) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);

    }

    return {
      pageProps,
      // namespacesRequired: [],
    };
  }

  render() {
    const { Component, pageProps } = this.props;

    return (
      <Container>
        <Component {...pageProps} />
      </Container>
    );
  }
}

// export default appWithTranslation(MyApp);
export default MyApp;