const path = require("path");
const glob = require("glob");
const fs = require('fs-extra')
const fetch = require('node-fetch');

// If you use Dotenv you can include your .env variables uncommenting the following line
// require("dotenv").config();

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebookincubator/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);


// SOURCE is where are stored all pages files
// By default it tracks all files in the pages folder
// without considering the ones starting with `_` (e.g. _document.js and _app.js)
const SOURCE =
  process.env.SOURCE || path.join(resolveApp("pages"), "/**/!(_*).js");


// DESTINATION is where the real file is exported
// By default is .next/static/sitemap.xml
const DESTINATION =
  process.env.DESTINATION ||
  path.join(resolveApp(".next/static"), "sitemap.xml");


removeLast = (str) => {
  return str.substring(0, str.length - 1);
}

const createSitemap = async () => {

  /**
   * STEP 1: Store all static pages url
   **/
  let diskPages = glob.sync(SOURCE);
  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  `;


  diskPages.forEach(page => {
    let stats = fs.statSync(page);
    let modDate = new Date(stats.mtime);
    let lastMod = `${modDate.getFullYear()}-${(
      "0" +
      (modDate.getMonth() + 1)
    ).slice(-2)}-${("0" + modDate.getDate()).slice(-2)}`;

    if (!page.match(/admin/) && !page.match(/auth/) && !page.match(/account/) && !page.match(/robots/)) {

      page = page.replace(resolveApp("pages"), "");
      page = page.replace(/.js$/, "");
      page = `${process.env.SERVER_URL}${page}`;


      if (page.match(/.*\/index$/)) {
        page = page.replace(/(.*)index$/, "$1");
      }

      xml += `<url>
      <loc>${page}</loc>
      <lastmod>${lastMod}</lastmod>
      <priority>0.9</priority>
      </url>
      `;

    }
  });



  /**
   * STEP 2: Store all dynamic pages url
   * In the following snippet we gather all products available
   * TODO: Add <lastmod>${lastMod}</lastmod> tag and set priority order
   **/

  let sitemapXml = '';
  const noCache = process.env.CACHE_BUSTER_RANDOM + '=' + process.env.CACHE_BUSTER;
  let pagesResponse = await fetch(`${process.env.SERVER_URL}/api/v1/pages?${noCache}`);
  if (pagesResponse.status === 200) {
    sitemapXml = await pagesResponse.json();
  }

  // return sitemapXml;
  sitemapXml.forEach((page, index) => {
    xml += `<url>
    <loc>${process.env.SERVER_URL}/${page.uri}</loc>
    <priority>0.9</priority>
    </url>
    `;

  });

  xml += `
      </urlset>
      `;
  return xml;
};

module.exports = { DESTINATION, createSitemap };