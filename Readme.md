
# `slate-drop-or-paste-images`

A Slate plugin that inserts images on drop or paste.

When trying to add support for inserting images, there are many ways that a user can do it. In total, this plugin enables six ways of inserting images. The user can choose between:

- dragging and dropping an image file from their computer.
- dragging and dropping an HTML fragment that contains an image.
- dragging and dropping a URL to an image on the web.
- pasting an HTML fragment that contains an image.
- pasting an image file from their clipboard.
- pasting a URL to an image on the web.

It does not handle dragging and dropping Slate nodes or fragments, which is handled internally by Slate by default. And it does not handle insert images via an image chooser, which you'd want to implement with your own UI components.


## Demo

https://ianstormtaylor.github.io/slate-drop-or-paste-images/


## Install

```
npm install slate-drop-or-paste-images
```


## Usage

```js
import InsertImages from 'slate-drop-or-paste-images'

const plugins = [
  InsertImages({
    extensions: ['png'],
    applyTransform: (transform, key, data) => {
      return transform.insertBlock({
        type: 'image',
        isVoid: true,
        key,
        data
      })
    }
  })
]
```

## Usage for Uploads

```js
import InsertImages from 'slate-drop-or-paste-images'

const plugins = [
  InsertImages({
    applyTransform: (transform, key, data) => {
      return transform.insertBlock({
        type: 'image',
        isVoid: true,
        key,
        data
      })
    },
    uploadImages: true,
    uploadUrl: '/upload',

    // eg: ServerResponse = { src: '/uploads/foo.png' }
    getImageUrl: (res) => res.src
  })
]
```

### Arguments
- `applyTransform: Function` — a transforming function that is passed a Slate `Transform`, `key` and `data` object. It should apply the proper transform that inserts the image into Slate based on your schema.
  It can return a promise resolved with the resulting Slate `Transform`.
- `extensions: Array(String)` — an array of allowed extensions.
- `uploadImages: Boolean` - (Default: `false`), if true then images are uploaded to configured url, otherwise they are inserted with dataURL.
- `uploadUrl: String` - the URL endpoint for image uploads.
- `uploadMethod: String` - (Default: `'post'`) the endpoint method used.
- `uploadParamName: String` - (Default: `'file'`) the file parameter name used for the image.
- `uploadParams: Object` - (Default: `{}`) an object of additional params to send. This is the same as adding hidden input fields to a form element.
- `uploadHeaders: Object` - (Default: `{}`) an object of additional headers to send
- `getImageUrl: Function` - a function that takes the server's upload response and returns the image url. Alternatively, it can return a promise that resolves with the image url; this is useful if additional requests are required to get the uploaded image's url. If server response is JSON, it is parsed for consumption.


## Development

Clone the repository and then run:

```
npm install
npm run watch
```

And open the example page in your browser:

```
http://localhost:8888/
```


## License

The MIT License

Copyright &copy; 2016, [Ian Storm Taylor](https://ianstormtaylor.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
