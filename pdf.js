const pdftohtml = require('pdftohtmljs')
const path = require('path')
const fs = require('fs')
const parse5 = require('parse5')
const htmlparser2Adapter = require('parse5-htmlparser2-tree-adapter')

const argv = process.argv
const filePath = argv.length >= 3 ? argv[2] : 'testFont.pdf'
let fileName = /(?=([^.\/]*).pdf$)/.exec(filePath)
fileName = fileName && fileName[1] || 'testFont'
const outputFileName =  argv.length >= 4 ? argv[3] : fileName

const converter = new pdftohtml(path.resolve(__dirname, filePath), `${outputFileName}.html`)

converter.add_options([
  '--embed-image 0',
  '--embed-css 0',
  '--embed-font 1',
  '--embed-javascript 0',
  '--embed-outline 0',
  '--no-drm 0',
  `--dest-dir pdf/${outputFileName}`
])

converter.convert().then(function() {
  const baseStyle = fs.readFileSync(path.resolve(__dirname, 'template/base.css'), {
    encoding: 'utf-8'
  })
  let customStyle = fs.readFileSync(path.resolve(__dirname, `pdf/${outputFileName}/${fileName}.css`), {
    encoding: 'utf-8'
  })

  customStyle = customStyle.slice(0, customStyle.indexOf('@media print'))

  let fragment = fs.readFileSync(path.resolve(__dirname, `pdf/${outputFileName}/${outputFileName}.html`), {
    encoding: 'utf-8'
  })

  fragment = parse5.parse(fragment)

  // 得到html部分
  fragment = fragment.childNodes[fragment.childNodes.length - 1]

  // 得到body部分
  fragment = fragment.childNodes[fragment.childNodes.length - 1]

  for (const item of fragment.childNodes) {
    if (item.tagName === 'div') {
      const attrs = item.attrs
      let getted = false

      for (const {name, value} of attrs) {
        if(name === 'id' && value === 'page-container') {
          fragment = item
          break
        }
      }
      if(getted) {
        break;
      }
    }
  }

  fragment = parse5.serialize(fragment)

  fs.writeFile(path.resolve(__dirname, `pdf/${outputFileName}/${outputFileName}.html`), createHtml(baseStyle + customStyle, fragment), (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Success")
    }
  })
}).catch(function(err) {
  console.error("Conversion error: " + err)
})

converter.progress(function(ret) {
  console.log((ret.current * 100.0) / ret.total + " %")
})

function createHtml(style, html) {
  return `<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <style>
      ${style}
    </style>
  </head>
  <body>
    ${html}
  </body>
  </html>`;
}
