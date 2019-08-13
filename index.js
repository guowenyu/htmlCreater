const mammoth = require("mammoth");
const path = require('path')
const fs = require('fs')

const argv = process.argv
const filePath = argv.length >= 3 ? argv[2] : 'testFont.docx'
let fileName = /(?=([^.\/]*).docx?$)/.exec(filePath)
fileName = fileName && fileName[1] || 'testFont'
const outputFileName = argv.length >= 4 ? argv[3] : fileName
const asDocPage = argv.length >= 5 ? argv[4] : false

mammoth.convertToHtml({
    path: path.resolve(__dirname, filePath)
  }, {
    transformDocument: mammoth.transforms.paragraph(transformElement),
    styleMap: [
      "b => span.bold",
      "i => span.italic",
      "u => span.underline",
      "strike => span.del",
      "comment-reference => sup",
      "p[style-name='Center'] =>p.center:fresh",
      "p[style-name='Right'] => p.right:fresh"
    ],
    includeDefaultStyleMap: false,
    ignoreEmptyParagraphs: true,
  })
  .then(function(result) {
    let html = result.value // The generated HTML
    const messages = result.messages // Any messages, such as warnings during conversion
    let style = ''

    if(asDocPage) {
      html = html.split('<p><a id="page')
      html = '<div class="page"><p><a id="page' + html[0] + html.slice(1).join('</div><div class="page"><p><a id="page') + '</div>'

      style = `.page {
          width: 792px;
          height: 1120px;
          padding: 50px 120px 0;
          box-sizing: border-box;
          margin: 15px auto;
          box-shadow: 1px 1px 3px 1px rgba(102, 102, 102, 0.6);
          -ms-user-select: none;
          -moz-user-select: none;
          -webkit-user-select: none;
          user-select: none;
          font-size: 14px;
          line-height: 16px;
      }`
    }

    fs.writeFile(path.resolve(__dirname, `./doc/${outputFileName}.html`), createHtml(style, html), (err, data) => {
      if (err) {
        console.log(err)
      }
    })
  })
  .done()

function createHtml(style, html) {
  return `<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <style>
      .bold {font-weight: bold;}
      .italic {font-style: italic}
      .underline {text-decoration: underline;}
      .del{text-decoration: line-through;}
      .center {text-align: center;}
      .right { text-align: right;}
      ${style}
    </style>
  </head>
  <body>
    ${html}
  </body>
  </html>`
}

function transformElement(element) {
  if (element.children) {
    const children = element.children.map(transformElement)
    element = {
      ...element,
      children: children
    };
  }
  if (element.type === "paragraph") {
    element = transformParagraph(element)
  }
  return element
}

function transformParagraph(element) {
  const {
    alignment = "left", styleId = ""
  } = element
  if (alignment === "center" && !styleId) {
    return {
      ...element,
      styleId: "center",
      styleName: "Center",
    }
  }

  if (alignment === "right" && !styleId) {
    return {
      ...element,
      styleId: "right",
      styleName: "Right",
    }
  }

  // console.log(element)
  return element
}
