import bus from '../eventBus'
import { client_item } from '../item'
import * as React from 'react'
import { IconButton } from 'office-ui-fabric-react'
import * as monaco from 'monaco-editor'
import { Depths } from '@uifabric/fluent-theme/lib/fluent/FluentDepths'
import { TextField } from 'office-ui-fabric-react/lib/TextField'
import { Breadcrumb } from 'office-ui-fabric-react/lib/Breadcrumb'

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
  editingItem: Partial<client_item>

  constructor(props: { item: client_item }) {
    super(props);
    this.content_ref = React.createRef();
    this.editor = null
    this.editingItem = {
      title: props.item.title,
      type: props.item.type,
      uri: props.item.uri,
      content: props.item.content,
      headers: props.item.headers,
    }
  }

  async onSave() {
    console.log('save clicked', this.editor)
    this.editingItem.content = this.editor.getValue()
    for (let k in this.editingItem) {
      if (this.props.item[k] !== this.editingItem[k]) {
        this.props.item[k] = this.editingItem[k]
        this.props.item.need_save = true
        this.props.item.content_parsed = false
      }
    }
    this.props.item.editing = false
    this.editor = null
    await this.props.item.save()
    this.forceUpdate()
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
    } else if (this.editor === null) {
      this.editor = monaco.editor.create(this.content_ref.current, {
        value: this.props.item.content,
        language: 'markdown'
      })
      console.log(this.editor)
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
            <div style={{ display: 'flow-root', height: 40 }}>
              <Breadcrumb
                items={this.props.item.uri.split('/').map((p) => {
                  return {
                    text: p,
                    key: p
                  }
                })}
                maxDisplayedItems={3}
                overflowAriaLabel="More links"
                styles={{
                  root: {
                    margin: 0,
                  }, list: {
                    height: 40
                  }
                }}
              />
            </div>
            <div className="item-titlebar">
              <h2 className="item-title" style={{
                marginTop: 7,
                marginBottom: 7,
              }}>
                {this.props.item.title}
              </h2>
            </div>
            <div className="item-info"></div>
            <div className="item-tags"></div>
            <div className="item-content" ref={this.content_ref} dangerouslySetInnerHTML={{ __html: this.props.item.parsed_content }} />
          </div>
        ) : (
            <div>
              <span className="item-controls">
                <ItemButton
                  iconName='Accept'
                  label='Save'
                  onClick={this.onSave.bind(this)}
                />
                <ItemButton
                  iconName='RevToggleKey'
                  label='Cancel'
                  onClick={async evt => {
                    console.log('cancel clicked', this.editor)
                    this.props.item.editing = false
                    this.editor = null
                    this.forceUpdate()
                  }}
                />
              </span>
              <div className="item-uri-edit" style={{ display: 'flow-root', height: 40 }}>
                <TextField value={this.editingItem.uri} onChange={(evt, value) => {
                  this.editingItem.uri = value, this.forceUpdate()
                }} styles={{ fieldGroup: { height: 40 }, field: { fontSize: 27 } }} />
              </div>
              <div className="item-title-edit" style={{ display: 'flow-root', height: 40, fontSize: 35 }}>
                <TextField value={this.editingItem.title} onChange={(evt, value) => {
                  this.editingItem.title = value, this.forceUpdate()
                }} styles={{ fieldGroup: { height: 40 }, field: { fontSize: 30 } }} />
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
