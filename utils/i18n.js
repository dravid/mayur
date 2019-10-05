// import NextI18Next from 'next-i18next'

// const NextI18NextInstance = new NextI18Next({
//   defaultLanguage: 'en',
//   otherLanguages: ['de']
// })

// // export default NextI18NextInstance;

// /* Optionally, export class methods as named exports */
// export const {
//   appWithTranslation,
//   withNamespaces,
// } = NextI18NextInstance

// const { localeSubpaths } = require('next/config').default().publicRuntimeConfig
const NextI18Next = require('next-i18next/dist/commonjs')

module.exports = new NextI18Next({
  defaultLanguage: 'en',
  otherLanguages: ['de'],
  // localeSubpaths: 'all',
})