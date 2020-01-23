import bus from '../eventBus'
import ClientItem from '../ClientItem'
import * as React from 'react'
import {
  IconButton, ComboBox, DefaultButton, CommandBarButton, TextField, ITextField,
  SelectableOptionMenuItemType
} from 'office-ui-fabric-react'
import * as monaco from 'monaco-editor'
import { Depths } from '@uifabric/fluent-theme/lib/fluent/FluentDepths'
import { Breadcrumb } from 'office-ui-fabric-react/lib/Breadcrumb'
// import anime from 'animejs'
import anime from 'animejs/lib/anime.es'
import { isLinkInternal, getPositionToDocument } from '../Common'
import MonacoEditor from 'react-monaco-editor'
import { promisify } from 'util'
import { MIME } from '../../core/Common'

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

class TagsComponent extends React.Component<{ tags: string[] }, { isEditing: boolean[] }> {
  stagedValues: string[]
  textRefs: (ITextField | null)[]
  constructor(props: { tags: string[] }) {
    super(props)
    this.state = {
      isEditing: Array(this.props.tags.length).fill(false)
    }
    this.textRefs = Array(this.props.tags.length).fill(null)
    this.stagedValues = JSON.parse(JSON.stringify(this.props.tags))
  }
  render() {
    return <div>{this.stagedValues.map((tag, idx) => {
      if (this.state.isEditing[idx]) {
        return <div key={idx} style={{ display: 'inline-flex', paddingLeft: 8 }}>
          <TextField
            defaultValue={tag}
            componentRef={ref => this.textRefs[idx] = ref}
            styles={{ root: { width: 80, userSelect: 'text' } }}
            onChange={(_, newValue) => {
              this.stagedValues[idx] = newValue
            }}
          />
          <IconButton
            iconProps={{ iconName: 'Accept' }}
            onClick={_ => {
              if (this.stagedValues[idx] !== '') {
                this.props.tags[idx] = this.stagedValues[idx]
                this.state.isEditing[idx] = false
                this.setState(this.state)
              }
            }}
          />
        </div>
      } else {
        return <div style={{ paddingLeft: 8, display: 'inline-flex' }}><DefaultButton
          split
          key={idx}
          text={tag}
          onClick={_ => {
            this.state.isEditing[idx] = true
            this.setState(this.state)
          }}
          menuProps={{ items: [], hidden: true }}
          menuIconProps={{
            iconName: 'Delete',
          }}
          onMenuClick={_ => {
            this.props.tags.splice(idx, 1)
            this.state.isEditing.splice(idx, 1)
            this.stagedValues.splice(idx, 1)
            this.setState(this.state)
          }}
        /></div>
      }
    }

    )
    } <IconButton iconProps={{ iconName: 'Add' }} disabled={this.stagedValues[this.stagedValues.length-1] === ''} onClick={_ => {
      this.state.isEditing.push(true)
      this.stagedValues.push('')
      this.setState(this.state)
    }} /> </div>
  }
}

export class ItemComponent extends React.Component<{ item: ClientItem, sys?: any }, {}> {
  contentRef: React.RefObject<HTMLDivElement>
  rootRef: React.RefObject<HTMLDivElement>
  editor: monaco.editor.IStandaloneCodeEditor | null
  editingItem: Partial<ClientItem>
  lastPosition: { left: number, top: number }

  constructor(props: { item: ClientItem }) {
    super(props);
    this.contentRef = React.createRef();
    this.rootRef = React.createRef();
    this.editor = null
    this.generateEditingItem()
  }

  componentDidMount() {
    if (!this.props.item.editing) {
      this.parseItemLinks()
    }
    this.lastPosition = getPositionToDocument(this.rootRef.current)
    bus.on('item-flow-layout', this.smoothLayoutChange.bind(this))
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
                items={this.props.item.uri.split('/').map((p) => { return { text: p, key: p } })}
                maxDisplayedItems={3}
                overflowAriaLabel="More links"
                styles={{ root: { margin: 0 }, list: { height: 40 } }}
              />
            </div>
            <div className="item-titlebar">
              <h2 className="item-title" style={{ margin: 7 }}>
                {this.props.item.title}
              </h2>
            </div>
            <div className="item-info"></div>
            <div className="item-content" ref={this.contentRef}
              style={{ paddingLeft: 28, paddingRight: 28, paddingBottom: 28 }}
              dangerouslySetInnerHTML={{ __html: this.props.item.parsedContent }}
            />
            <div className="item-tags">{this.props.item.headers.tags?.map(tag => {
              const menuProps = this.props.sys?.tagMap[tag]
                ?.filter((it: ClientItem) => it.uri !== this.props.item.uri)
                .map((it: ClientItem) => {
                  return {
                    key: it.uri,
                    text: it.title,
                    onClick: () => bus.emit('item-link-clicked', { targetURI: it.uri })
                  }
                })
              if (menuProps && menuProps.length !== 0) {
                return <CommandBarButton text={tag} key={tag} styles={{ root: { height: 40 } }} menuProps={{ items: menuProps }} />
              } else {
                return <CommandBarButton text={tag} key={tag} styles={{ root: { height: 40 } }} />
              }
            })}</div>
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
              <div className="item-type" style={{ width: 170 }}>
                <ComboBox
                  allowFreeform
                  autoComplete="on"
                  defaultSelectedKey={this.props.item.type}
                  styles={{
                    root: { float: 'left' },
                    callout: { width: 170 }
                  }}
                  options={[
                    { key: 'Content Header', text: 'Content', itemType: SelectableOptionMenuItemType.Header },
                    { key: 'text/markdown', text: 'text/markdown' },
                    { key: 'text/plain', text: 'text/plain' },
                    { key: 'text/html', text: 'text/html' },
                    { key: 'divider', text: '-', itemType: SelectableOptionMenuItemType.Divider },
                    { key: 'Code Header', text: 'Code', itemType: SelectableOptionMenuItemType.Header },
                    { key: 'application/javascript', text: 'application/javascript' },
                    { key: 'text/x-python', text: 'text/x-python' },
                    { key: 'text/x-c', text: 'text/x-c' },
                  ]}
                  onChange={(event, options, index, value: MIME) => {
                    if (options)
                      this.editingItem.type = options.text as MIME
                    else
                      this.editingItem.type = value
                    console.log('item type changed to ', this.editingItem.type)
                  }}
                />
              </div>
              <div className="item-tags">
                <TagsComponent tags={this.editingItem.headers.tags} />
              </div>
              <div className="item-info"></div>
            </div>
          )}
      </div>
    )
  }

  /**
   * Handlers on button click events
   * TODO: move logic to ItemManager.saveItem(originURI, newItem) and receive the saved item
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
    await this.slideOut()
    bus.emit('item-close-clicked', {
      uri: this.props.item.uri
    })
  }

  async onBeginEdit() {
    this.props.item.editing = true
    await this.rotateOut()
    this.forceUpdate()
    bus.emit('item-flow-layout')
    this.rotateIn()
  }

  async onCancelEdit() {
    this.props.item.editing = false
    this.editor = null
    await this.rotateOut()
    await promisify(this.forceUpdate.bind(this))()
    bus.emit('item-flow-layout')
    this.rotateIn()
    this.generateEditingItem()
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

  generateEditingItem() {
    this.editingItem = {
      title: this.props.item.title,
      type: this.props.item.type,
      uri: this.props.item.uri,
      content: this.props.item.content,
      headers: JSON.parse(JSON.stringify(this.props.item.headers)),
    }
  }

  /**
   * Animation: rotate 90 deg to hide
   */
  async rotateOut() {
    const done = anime.timeline({
      targets: this.rootRef.current,
      rotateY: 90,
      duration: 100,
      easing: 'linear',
    }).add({}).finished
    return done
  }

  /**
   * Animation: slide 400px while fading out
   */
  async slideOut() {
    const done = anime({
      targets: this.rootRef.current,
      translateX: -200,
      opacity: 0,
      duration: 100,
      easing: 'easeOutQuad',
    }).add({}).finished
    return done
  }

  /**
   * Animation: rotate 90 deg to display
   */
  async rotateIn() {
    const done = anime.timeline({
      targets: this.rootRef.current,
      rotateY: 0,
      duration: 100,
      easing: 'linear',
    }).add({}).finished
    return done
  }

  /**
   * Animation: slide to new position (vertically)
   */
  async smoothLayoutChange() {
    this.rootRef.current.style.transform = ''
    const newPosition = getPositionToDocument(this.rootRef.current)
    const dy = this.lastPosition.top - newPosition.top
    anime({
      targets: this.rootRef.current,
      translateY: dy,
      duration: 100,
      easing: () => (t: number) => 1 - t,
    })
    this.lastPosition = newPosition
  }
}
