import bus from '../eventBus'
import ClientItem from '../ClientItem'
import * as React from 'react'
import { IconButton } from 'office-ui-fabric-react'
import * as monaco from 'monaco-editor'
import { Depths } from '@uifabric/fluent-theme/lib/fluent/FluentDepths'
import { TextField } from 'office-ui-fabric-react/lib/TextField'
import { Breadcrumb } from 'office-ui-fabric-react/lib/Breadcrumb'
// import anime from 'animejs'
import anime from 'animejs/lib/anime.es'
import { isLinkInternal } from '../Common'
import MonacoEditor from 'react-monaco-editor'

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

export class ItemComponent extends React.Component<{ item: ClientItem }, {}> {
  contentRef: React.RefObject<HTMLDivElement>
  rootRef: React.RefObject<HTMLDivElement>
  editor: monaco.editor.IStandaloneCodeEditor | null
  editingItem: Partial<ClientItem>
  lastRect: DOMRect

  constructor(props: { item: ClientItem }) {
    super(props);
    // @ts-ignore
    window.anime = anime
    // @ts-ignore
    window.item = this
    this.contentRef = React.createRef();
    this.rootRef = React.createRef();
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
        this.props.item.needSave = true
        this.props.item.isContentParsed = false
      }
    }
    this.props.item.editing = false
    this.props.item.type = 'text/markdown'
    this.editor = null
    await this.props.item.save()
    await anime.timeline({
      targets: this.rootRef.current,
      rotateY: 90,
      duration: 100,
      easing: function(...args) {
        return function(t) {
          return t
        }
      }
    }).add({ }).finished
    this.forceUpdate()
    bus.emit('item-flow-layout')
    await anime.timeline({
      targets: this.rootRef.current,
      rotateY: 0,
      duration: 100,
      easing: function(...args) {
        return function(t) {
          return t
        }
      }
    }).add({ }).finished
    // this.forceUpdate()
  }

  // shouldComponentUpdate() {
    // return false
  // }

  componentDidMount() {
    if (!this.props.item.editing) {
      let links = this.contentRef.current.querySelectorAll('a')
      links.forEach((el: HTMLAnchorElement) => {
        if (isLinkInternal(el)) {
          el.onclick = async evt => {
            evt.cancelBubble = true;
            evt.stopPropagation();
            evt.preventDefault();
            bus.emit('item-link-clicked', {
              emitter: el,
              targetLink: el.getAttribute('href'),
            })
            return false;
          }
        } else {
          el.target = '_blank'
        }
      })
    }
    this.lastRect = this.rootRef.current.getBoundingClientRect()
    // bus.on('item-flow-layout', this.smoothLayoutChange.bind(this))
  }

  async smoothLayoutChange() {
    const rect = this.rootRef.current.getBoundingClientRect()
    const dy = this.lastRect.top - rect.top
    anime.timeline({
      targets: this.rootRef.current,
      translateY: dy,
      duration: 100,
      easing: function(...args) {
        return function(t) {
          return 1-t
        }
      }
    }).add({ }).finished
    this.lastRect = rect
  }

  componentDidUpdate() {
    this.componentDidMount()
  }

  editorDidMount(editor: monaco.editor.IStandaloneCodeEditor, monaco) {
    this.editor = editor
    // don't know why should i do a immediate defferd call to get it work
    setTimeout(() => {
      this.editor.layout()
    }, 0);
  }

  render() {
    return (
      <div className="item" style={{ boxShadow: Depths.depth8 }} ref={this.rootRef}>
        {!this.props.item.editing ? (
          <div>
            <div className="item-controls">
              <ItemButton
                iconName='Edit'
                label='Edit'
                onClick={async evt => {
                  this.props.item.editing = true
                  console.log(this.rootRef.current.parentElement)
                  await anime.timeline({
                    targets: this.rootRef.current,
                    rotateY: 90,
                    duration: 100,
                    easing: function(...args) {
                      return function(t) {
                        return t
                      }
                    }
                  }).add({ }).finished
                  this.forceUpdate()
                  bus.emit('item-flow-layout')
                  await anime.timeline({
                    targets: this.rootRef.current,
                    rotateY: 0,
                    duration: 100,
                    easing: function(...args) {
                      return function(t) {
                        return t
                      }
                    }
                  }).add({ }).finished
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
            <div className="item-content" ref={this.contentRef} dangerouslySetInnerHTML={{ __html: this.props.item.parsedContent }} />
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
                    await anime.timeline({
                      targets: this.rootRef.current,
                      rotateY: 90,
                      duration: 100,
                      easing: function(...args) {
                        return function(t) {
                          return t
                        }
                      }
                    }).add({ }).finished
                    this.forceUpdate()
                    bus.emit('item-flow-layout')
                    await anime.timeline({
                      targets: this.rootRef.current,
                      rotateY: 0,
                      duration: 100,
                      easing: function(...args) {
                        return function(t) {
                          return t
                        }
                      }
                    }).add({ }).finished
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
              <div className="edit-item-content" ref={this.contentRef} >
              <MonacoEditor
                language="markdown"
                value={this.props.item.content}
                // height={500}
                editorDidMount={this.editorDidMount.bind(this)}
              />
              </div>
            </div>
          )}

      </div>
    )
  }
}
