
import InsertImages from '..'
import React from 'react'
import ReactDOM from 'react-dom'
import initialState from './state.json'
import { Editor, Raw } from 'slate'

class Image extends React.Component {

  state = {}

  componentDidMount() {
    const { node } = this.props
    const { data } = node
    const file = data.get('file')
    this.load(file)
  }

  load(file) {
    const reader = new FileReader()
    reader.addEventListener('load', () => this.setState({ dataURL: reader.result }))
    reader.readAsDataURL(file)
  }

  render() {
    const { attributes } = this.props
    const { dataURL } = this.state
    const { data } = this.props.node

    let src = data.get('src')
    const isLoading = !src && !dataURL
    const isUploading = !src && data.get('isUpload')

    if (!isUploading && !src) src = this.state.dataURL

    return (
      <div className="image">
        {isLoading && <div className="loadingtext">Loading...</div>}
        {isUploading && <div>
          <div className="progress">{data.get('uploadProgress')}%</div>
          {dataURL && <img className="bgimg" src={dataURL} />}
        </div>}
        {src && <img {...attributes} src={src} />}
      </div>
    )
  }

}

const schema = {
  nodes: {
    paragraph: (props) => <p>{props.children}</p>,
    image: Image
  }
}

class Example extends React.Component {

  plugins = [
    InsertImages({
      uploadImages: true,
      uploadUrl: '/upload',
      applyTransform: (transform, key, data) => {
        return transform.insertBlock({
          type: 'image',
          isVoid: true,
          key,
          data
        })
      },
      getImageUrl: (res) => res.src
    })
  ]

  state = {
    state: Raw.deserialize(initialState, { terse: true })
  }

  onChange = (state) => {
    this.setState({ state })
  }

  render = () => {
    return (
      <Editor
        schema={schema}
        onChange={this.onChange}
        plugins={this.plugins}
        state={this.state.state}
      />
    )
  }
}

const example = <Example />
const root = document.body.querySelector('main')
ReactDOM.render(example, root)
