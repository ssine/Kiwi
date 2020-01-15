import bus from '../eventBus'
import { client_item } from '../item'
import * as React from 'react'
import { IconButton } from 'office-ui-fabric-react'
import * as monaco from 'monaco-editor'
import { Depths } from '@uifabric/fluent-theme/lib/fluent/FluentDepths'

type ItemButtonProperty = {
  iconName: string
  label: string
  onClick: (evt: any) => void
}

const ItemButton: React.FunctionComponent<ItemButtonProperty> = (props: ItemButtonProperty) => {
  return (
    <IconButton
      iconProps={{ iconName: props.iconName, style: { fontSize: 25 } }}
      title={props.label} ariaLabel={props.label}
      onClick={props.onClick}
      style={{ color: 'purple', width: 40, height: 40 }}
    />
  )
}

export class ItemComponent extends React.Component<{ item: client_item }, {}> {
  content_ref: React.RefObject<HTMLDivElement>
  editor: monaco.editor.IStandaloneCodeEditor | null

  constructor(props: { item: client_item }) {
    super(props);
    this.content_ref = React.createRef();
    this.editor = null
  }

  shouldComponentUpdate() {
    return false
  }
  componentDidMount() {
    if (!this.props.item.editing) {

      let links = this.content_ref.current.querySelectorAll('.item-link')
      links.forEach(el => {
        let e = el as HTMLElement
        e.onclick = async evt => {
          evt.cancelBubble = true;
          evt.stopPropagation();
          evt.preventDefault();
          bus.emit('item-link-clicked', {
            emitter: e,
            targetLink: e.getAttribute('href'),
          })
          return false;
        }
      })
    } else {
      this.editor = monaco.editor.create(this.content_ref.current, {
        value: this.props.item.content,
        language: 'markdown'
      })
    }
  }
  componentDidUpdate() {
    this.componentDidMount()
  }
  render() {
    return (
      <div className="item" style={{ boxShadow: Depths.depth8 }}>
        {!this.props.item.editing ? (
          <div>
            <div className="item-controls">
              <ItemButton
                iconName='Edit'
                label='Edit'
                onClick={evt => {
                  this.props.item.editing = true
                  this.forceUpdate()
                  console.log('editing!')
                }}
              />
              <ItemButton
                iconName='Cancel'
                label='Close'
                onClick={evt => {
                  bus.emit('item-close-clicked', {
                    uri: this.props.item.uri
                  })
                  console.log('closed!')
                }}
              />
            </div>
            <div className="item-titlebar">
              <h2 className="item-title">
                {this.props.item.title}
              </h2>
            </div>
            <div className="item-info"></div>
            <div className="item-tags"></div>
            <div className="item-content" ref={this.content_ref} dangerouslySetInnerHTML={{ __html: this.props.item.parsed_content }} />
          </div>
        ) : (
            <div>
              <div className="item-controls">
                <ItemButton
                  iconName='Accept'
                  label='Save'
                  onClick={async evt => {
                    this.props.item.editing = false
                    this.props.item.content = this.editor.getValue()
                    this.props.item.content_parsed = false
                    await this.props.item.save()
                    this.forceUpdate()
                  }}
                />
                <ItemButton
                  iconName='RevToggleKey'
                  label='Cancel'
                  onClick={async evt => {
                    this.props.item.editing = false
                    this.forceUpdate()
                  }}
                />
              </div>
              <div className="item-titlebar">
                <input type="text" className="edit-item-title" value={this.props.item.title} onChange={_ => { console.log(_) }} />
              </div>
              <div className="item-info"></div>
              <div className="item-tags"></div>
              <div className="edit-item-content" ref={this.content_ref} >
              </div>
            </div>
          )}

      </div>
    )
  }
}
