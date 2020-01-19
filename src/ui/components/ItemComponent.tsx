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

  componentDidMount() {
    if (!this.props.item.editing) {
      this.parseItemLinks()
    }
    this.lastRect = this.rootRef.current.getBoundingClientRect()
    // bus.on('item-flow-layout', this.smoothLayoutChange.bind(this))
  }

  componentDidUpdate() {
    this.componentDidMount()
  }

  onEditorDidMount(editor: monaco.editor.IStandaloneCodeEditor, monaco) {
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
              iconName='Delete'
              label='Delete'
              onClick={this.onDelete.bind(this)}
            />
            <ItemButton
              iconName='Edit'
              label='Edit'
              onClick={this.onBeginEdit.bind(this)}
            />
            <ItemButton
              iconName='Cancel'
              label='Close'
              onClick={this.onClose.bind(this)}
            />
          </div>
          <div style={{ display: 'flow-root', height: 40 }}>
            <Breadcrumb
              items={this.props.item.uri.split('/').map((p) => {return {text: p, key: p}})}
              maxDisplayedItems={3}
              overflowAriaLabel="More links"
              styles={{ root: { margin: 0 }, list: { height: 40 } }}
            />
          </div>
          <div className="item-titlebar">
            <h2 className="item-title" style={{ marginTop: 7, marginBottom: 7 }}>
              {this.props.item.title}
            </h2>
          </div>
          <div className="item-info"></div>
          <div className="item-tags"></div>
          <div className="item-content" ref={this.contentRef}
            style={{margin: 28}}
            dangerouslySetInnerHTML={{ __html: this.props.item.parsedContent }}
          />
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
              onClick={this.onCancelEdit.bind(this)}
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
          <div className="edit-item-content" ref={this.contentRef} >
            <MonacoEditor
              language="markdown"
              value={this.props.item.content}
              editorDidMount={this.onEditorDidMount.bind(this)}
            />
          </div>
          <div className="item-info"></div>
          <div className="item-tags"></div>
        </div>
      )}
      </div>
    )
  }

  /**
   * Handlers on button click events
   */
  async onSave() {
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
    await this.rotateOut()
    this.forceUpdate()
    bus.emit('item-flow-layout')
    await this.rotateIn()
    // this.forceUpdate()
  }

  async onDelete() {
    bus.emit('item-delete-clicked', {
      uri: this.props.item.uri
    })
  }

  async onClose() {
    bus.emit('item-close-clicked', {
      uri: this.props.item.uri
    })
  }

  async onBeginEdit() {
    this.props.item.editing = true
    await this.rotateOut()
    this.forceUpdate()
    bus.emit('item-flow-layout')
    await this.rotateIn()
  }

  async onCancelEdit() {
    this.props.item.editing = false
    this.editor = null
    await this.rotateOut()
    this.forceUpdate()
    bus.emit('item-flow-layout')
    await this.rotateIn()
  }

  /**
   * Helper functions
   */
  parseItemLinks() {
    let links = this.contentRef.current.querySelectorAll('a')
    links.forEach((el: HTMLAnchorElement) => {
      if (isLinkInternal(el)) {
        el.onclick = async evt => {
          evt.cancelBubble = true;
          evt.stopPropagation();
          evt.preventDefault();
          bus.emit('item-link-clicked', {
            emitterURI: this.props.item.uri,
            targetURI: el.getAttribute('href'),
          })
          return false;
        }
      } else {
        el.target = '_blank'
      }
    })
  }

  /**
   * Animation: rotate 90 deg to hide
   */
  async rotateOut() {
    await anime.timeline({
      targets: this.rootRef.current,
      rotateY: 90,
      duration: 100,
      easing: () => (t: number) => t
    }).add({}).finished
    return
  }

  /**
   * Animation: rotate 90 deg to display
   */
  async rotateIn() {
    await anime.timeline({
      targets: this.rootRef.current,
      rotateY: 0,
      duration: 100,
      easing: () => (t: number) => t
    }).add({}).finished
    return
  }

  /**
   * Animation: slide to new position (vertically)
   */
  async smoothLayoutChange() {
    const rect = this.rootRef.current.getBoundingClientRect()
    const dy = this.lastRect.top - rect.top
    anime.timeline({
      targets: this.rootRef.current,
      translateY: dy,
      duration: 100,
      easing: () => (t: number) => 1 - t
    }).add({}).finished
    this.lastRect = rect
  }
}
