
import Promise from 'es6-promise'
import isImage from 'is-image'
import isUrl from 'is-url'
import mime from 'mime-types'
import ImagePreloader from 'image-preloader'
import { extname } from 'path'

/**
 * Insert images on drop or paste.
 *
 * @param {Object} options
 *   @property {Function} applyTransform
 *   @property {Array} extensions (optional)
 *   @property {Boolean} uploadImages (optional)
 *   @property {String} uploadUrl (optional)
 *   @property {String} uploadMethod (optional)
 *   @property {String} uploadParamName (optional)',
 *   @property {Object} uploadParams (optional),
 *   @property {Object} uploadHeaders (optional),
 *   @property {Function} getImageUrl (optional)
 * @return {Object} plugin
 */

function DropOrPasteImages({
  applyTransform,
  uploadImages=false,
  uploadUrl=null,
  uploadMethod='post',
  uploadParamName='file',
  uploadParams={},
  uploadHeaders={},
  getImageUrl,
  extensions
}) {
  let argErrs = [];

  if (!applyTransform) argErrs.push('You must supply an `applyTransform` function.');
  
  if (uploadImages && !uploadUrl) argErrs.push('You must supply `uploadUrl` to upload images');
  if (uploadImages && !getImageUrl) argErrs.push('You must supply a `getImageUrl` function to upload images.');

  if (argErrs.length) throw new Error(argErrs);

  /**
   * Apply the transform for a given file and update the editor with the result.
   *
   * @param {Transform} transform
   * @param {Editor} editor
   * @param {String} key
   * @param {Object} data
   * @return {Promise}
   */

  function asyncApplyTransform(transform, editor, key, data) {
    return Promise
      .resolve(applyTransform(transform, key, data))
      .then(() => {
        const next = transform.apply()
        editor.onChange(next)
      })
  }


  /**
   * On drop or paste.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @param {Editor} editor
   * @return {State}
   */

  function onInsert(e, data, state, editor) {
    switch (data.type) {
      case 'files': return onInsertFiles(e, data, state, editor)
      case 'html': return onInsertHtml(e, data, state, editor)
      case 'text': return onInsertText(e, data, state, editor)
    }
  }

  /**
   * Generates crude unique identifier.
   * 
   * @return {String}
   */

  function generateKey() {
    return Math.floor(Math.random() * 1000000000)+'';
  }

  /**
   * Adds error info to image node data
   * 
   * @param {Error} err
   * @param {Transform} transform
   * @param {Editor} editor
   * @param {String} key
   * @param {Object} data
   */

  function handleError(err, transform, editor, key, data) {
    console.error(err);

    data.errors = data.errors || [];
    data.errors.push(err);

    let next = transform.setNodeByKey(key, { data }).apply();
    editor.onChange(next);
  }
  
  /**
   * Uploads file and inserts into editor
   * 
   * @param {Transform} transform
   * @param {Editor} editor
   * @param {String} key
   * @param {Object} data
   */

  function handleUpload(transform, editor, key, data) {
    uploadFile(data.file, {
      done(res) {
        data.uploadProgress = 100;

        Promise.resolve(getImageUrl(res))
          .then((src) => {
            data.src = src;
            return ImagePreloader.simplePreload(src);
          })
          .then(() => {
            let next = transform.setNodeByKey(key, { data }).apply();
            editor.onChange(next);
          })
          .catch((err) => {
            handleError(err, transform, editor, key, data);
          });
      },
      error(err) {
        handleError(err, transform, editor, key, data);
      },
      progress(e) {
        data.uploadProgress = Math.floor(100 * e.loaded / e.total);
        let next = transform.setNodeByKey(key, { data }).apply();
        editor.onChange(next);
      }
    })
  }

  /**
   * Processes file, applying node data, then calling transforms and uploads.
   * 
   * @param {Blob} file
   * @param {Transform} transform
   * @param {Editor} editor 
   * @param {Boolean} upload 
   */

  function processFile(transform, editor, file, isUpload, src) {

    let key = generateKey();
    let data = {
      isUpload,
      uploadProgress: 0,
      src,
      file
    };

    asyncApplyTransform(transform, editor, key, data);

    if (isUpload) handleUpload(transform, editor, key, data);

  }

  /**
   * On drop or paste files.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @param {Editor} editor
   * @return {State}
   */

  function onInsertFiles(e, data, state, editor) {
    const { target, files } = data
    let transform = state.transform();

    for (const file of files) {
      if (extensions) {
        const ext = mime.extension(file.type)
        if (!extensions.includes(ext)) continue
      }

      if (target) transform.select(target)

      processFile(transform, editor, file, uploadImages);
    }

    return state
  }

  /**
   * On drop or paste html.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @param {Editor} editor
   * @return {State}
   */

  function onInsertHtml(e, data, state, editor) {
    const { html, target } = data
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const body = doc.body
    const firstChild = body.firstChild
    if (firstChild.nodeName.toLowerCase() != 'img') return

    const src = firstChild.src

    if (extensions) {
      const ext = extname(src).slice(1)
      if (!extensions.includes(ext)) return
    }
    
    let transform = editor.getState().transform()
    if (target) transform.select(target)
    
    processFile(transform, editor, null, false, src);

    return state
  }

  /**
   * On drop or paste text.
   *
   * @param {Event} e
   * @param {Object} data
   * @param {State} state
   * @param {Editor} editor
   * @return {State}
   */

  function onInsertText(e, data, state, editor) {
    const { text, target } = data
    if (!isUrl(text)) return
    if (!isImage(text)) return

    if (extensions) {
      const ext = extname(text).slice(1)
      if (!extensions.includes(ext)) return
    }

    let transform = editor.getState().transform()
    if (target) transform.select(target)
    
    processFile(transform, editor, null, false, text);

    return state
  }

  /**
   * Uploads file to uploadURL
   * 
   * @param {Blob} file 
   * @param {Object} callbacks
   *   @param {Function} done
   *   @param {Function} error
   *   @param {Function} progress
   */

  function uploadFile(file, { done, error, progress }) {
    let xhr = new XMLHttpRequest();

    xhr.open(uploadMethod, uploadUrl, true);

    xhr.onload = (e) => {
      let res;

      if (xhr.readyState !== 4) return;

      if (xhr.responseType !== 'arraybuffer' && xhr.responseType !== 'blob') {
        res = xhr.responseText;

        if (
          xhr.getResponseHeader('content-type') &&
          xhr.getResponseHeader('content-type').indexOf('application/json') > -1
        ) {
          try {
            res = JSON.parse(res);
          } catch (e) {
            res = 'INVALID JSON'
          }
        }
      }

      if (xhr.status >= 300) return error();

      done(res);
    }

    xhr.onerror = error;
    xhr.onabort = error;

    // not all browsers have .upload prop
    let progressObj = xhr.upload || xhr;
    progressObj.onprogress = progress

    Object.keys(uploadHeaders).map((key) => {
      xhr.setRequestHeader(key, uploadHeaders[key]);
    });

    let formData = new FormData();

    Object.keys(uploadParams).map((key) => {
      formData.append(key, uploadParams[key]);
    });

    // Add file last, some servers expect this
    formData.append(uploadParamName, file, file.name);

    xhr.send(formData);
  }

  /**
   * Return the plugin.
   *
   * @type {Object}
   */

  return {
    onDrop: onInsert,
    onPaste: onInsert,
  }
}

/**
 * Export.
 *
 * @type {Function}
 */

export default DropOrPasteImages
