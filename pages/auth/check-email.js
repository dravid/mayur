import React from 'react'
import Router from 'next/router'
import Page from '../../components/page'
import { NextAuth } from 'next-auth/client'

export default class extends Page {

  static async getInitialProps({ req, res, query }) {
    let props = await super.getInitialProps({ req })
    props.session = await NextAuth.init({ force: true, req: req })

    // If signed in already, instead of displaying message send to callback page
    // which should redirect them to whatever page it normally sends clients to
    if (props.session.user) {
      if (req) {
        res.redirect('/auth/callback')
      } else {
        Router.push('/auth/callback')
      }
    }

    props.email = query.email

    return props
  }

  render() {
    return (
      <div {...this.props} navmenu={false} signinBtn={false}>
        <div className="text-center pt-5 pb-5">
          <h1 className="display-4">Proverite Vaš E-mail</h1>
          <p className="lead">
            Verifikacioni link je poslat na {(this.props.email) ? <span className="font-weight-bold">{this.props.email}</span> : <span>Vaš inbox</span>}.
          </p>
        </div>
      </div>
    )
  }
}
