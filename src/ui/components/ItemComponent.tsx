import bus from '../eventBus'
import ClientItem from '../ClientItem'
import React from 'react'
import {
  ComboBox, DefaultButton, CommandBarButton, TextField, ITextField,
  SelectableOptionMenuItemType, Callout, PrimaryButton
} from 'office-ui-fabric-react'
import * as monaco from 'monaco-editor'
import { Depths } from '@uifabric/fluent-theme/lib/fluent/FluentDepths'
import { Breadcrumb } from 'office-ui-fabric-react/lib/Breadcrumb'
import { IconButton } from 'office-ui-fabric-react/lib/Button'
// import anime from 'animejs'
import anime from 'animejs/lib/anime.es'
import { isLinkInternal, getPositionToDocument, getCookie } from '../Common'
import { MIME, getLanguageFromMIME, editorMIMETypes, resolveURI, suggestedTitleToURI, suggestedURIToTitle } from '../../core/Common'
import { typesetMath } from '../mathjax'
import loadable from "@loadable/component"

const MonacoEditor = loadable(() => import("react-monaco-editor"), {
  fallback: <div>loading editor...</div>
});

type ItemButtonProperty = {
  divRef?: any
  iconName: string
  label: string
  onClick: (evt: any) => void
}

const ItemButton: React.FunctionComponent<ItemButtonProperty> = (props: ItemButtonProperty) => {
  return (
    <div ref={props.divRef ? props.divRef : () => { }}>
      <IconButton
        iconProps={{ iconName: props.iconName, style: { fontSize: 25 } }}
        title={props.label} ariaLabel={props.label}
        onClick={props.onClick}
        style={{ color: 'purple', width: 40, height: 40 }}
      />
    </div>
  )
}

class TagsComponent extends React.Component<{ tags: string[] }, { isEditing: boolean[] }> {
  stagedValues: string[]
  textRefs: (ITextField | null)[]
  constructor(props: { tags: string[] }) {
    super(props)
    this.state = {
      isEditing: Array(props.tags.length).fill(false)
    }
    this.textRefs = Array(props.tags.length).fill(null)
    this.stagedValues = JSON.parse(JSON.stringify(props.tags))
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
        return <div key={idx} style={{ paddingLeft: 8, display: 'inline-flex' }}><DefaultButton
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
    } <IconButton iconProps={{ iconName: 'Add' }} disabled={this.stagedValues[this.stagedValues.length - 1] === ''} onClick={_ => {
      this.state.isEditing.push(true)
      this.stagedValues.push('')
      this.setState(this.state)
    }} /> </div>
  }
}

class TitleEditorComponent extends React.Component<{ editingItem: { uri: string, title: string } }, {}> {
  editTitleChanged: boolean
  editURIChanged: boolean
  constructor(props: any) {
    super(props)
    this.editTitleChanged = false
    this.editURIChanged = false
  }

  render() {
    return <div>
      <div className="item-uri-edit" style={{ display: 'flow-root', height: 40 }}>
        <TextField value={this.props.editingItem.uri} onChange={(evt, value) => {
          this.editURIChanged = true
          this.props.editingItem.uri = value
          if (!this.editTitleChanged) {
            this.props.editingItem.title = suggestedURIToTitle(this.props.editingItem.uri)
          }
          this.forceUpdate()
        }} styles={{ fieldGroup: { height: 40 }, field: { fontSize: 27 } }} />
      </div>
      <div className="item-title-edit" style={{ display: 'flow-root', height: 40, fontSize: 35 }}>
        <TextField value={this.props.editingItem.title} onChange={(evt, value) => {
          this.editTitleChanged = true
          this.props.editingItem.title = value
          if (!this.editURIChanged) {
            const uri = this.props.editingItem.uri
            const slashIdx = uri.lastIndexOf('/')
            const folder = slashIdx === -1 ? '' : uri.substring(0, slashIdx)
            this.props.editingItem.uri = `${folder}/${suggestedTitleToURI(value)}`
          }
          this.forceUpdate()
        }} styles={{ fieldGroup: { height: 40 }, field: { fontSize: 30, fontFamily: 'Constantia' } }} />
      </div>
    </div>
  }
}

export class ItemComponent extends React.Component<{ item: ClientItem, sys?: any }, { deleteCalloutVisible: boolean }> {
  contentRef: React.RefObject<HTMLDivElement>
  rootRef: React.RefObject<HTMLDivElement>
  deleteButtonElement: HTMLElement | null
  editor: monaco.editor.IStandaloneCodeEditor | null
  item: ClientItem
  editingItem: Partial<ClientItem> & { title: string, uri: string }
  lastPosition: { left: number, top: number }
  itemFlowLayoutCallback: () => void
  externalEditCallback: () => void

  constructor(props: { item: ClientItem }) {
    super(props);
    this.contentRef = React.createRef()
    this.rootRef = React.createRef()
    this.editor = null
    this.item = this.props.item
    this.state = {
      deleteCalloutVisible: false
    }
    this.generateEditingItem(this.item)
    this.itemFlowLayoutCallback = () => {
      this.smoothLayoutChange()
    }
    this.externalEditCallback = async () => {
      await this.onRerender()
    }
  }

  componentDidMount() {
    if (!this.item.editing) {
      this.contentPostProcess()
    }
    this.lastPosition = getPositionToDocument(this.rootRef.current)
    bus.on('item-flow-layout', this.itemFlowLayoutCallback)
    bus.on(`external-edit-${this.item.uri}`, this.externalEditCallback)
  }
  
  componentWillUnmount() {
    bus.off('item-flow-layout', this.itemFlowLayoutCallback)
    bus.off(`external-edit-${this.item.uri}`, this.externalEditCallback)
  }

  componentDidUpdate() {
    if (!this.item.editing) {
      this.contentPostProcess()
    }
  }

  onEditorDidMount(editor: any, monaco: any) {
    this.editor = editor
    // editor.addAction({
    //   id: 'save',
    //   label: 'save',
    //   keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
    //   run: () => {
    //     this.onSave()
    //   }
    // })
    // don't know why should i do a immediate defferd call to get it work
    setTimeout(() => {
      this.editor.layout()
      this.editor.focus()
    }, 0);
  }

  render() {
    let dropdownItems = [{
      key: 'Copy PermaLink',
      text: 'Copy PermaLink',
      iconProps: { iconName: 'Link' },
      onClick: () => {
        navigator.clipboard.writeText(`${window.location.origin}/#${this.item.uri}`)
      }
    }]
    if (getCookie('token') !== '') {
      dropdownItems.push({
        key: 'Create Sibling',
        text: 'Create Sibling',
        iconProps: { iconName: 'Add' },
        onClick: () => {
          bus.emit('create-item-clicked', { uri: resolveURI(this.props.item.uri, 'new-item') })
        }
      })
    }

    return (
      <div className="item" style={{ boxShadow: Depths.depth8 }} ref={this.rootRef}>
        {!this.item.editing ? (
          <div>
            <div className="item-controls" style={{ display: 'flex' }}>
              {dropdownItems.length > 0 ? <>
                <IconButton
                  iconProps={{ iconName: 'ChevronDown' }}
                  label='More'
                  menuProps={{ items: dropdownItems }}
                  onRenderMenuIcon={() => <></>}
                  style={{ color: 'purple', width: 40, height: 40 }}
                />
              </> : <></>}
              {getCookie('token') !== '' ? <>
                <ItemButton
                  divRef={el => this.deleteButtonElement = el}
                  iconName='Delete'
                  label='Delete'
                  onClick={_ => this.setState({ deleteCalloutVisible: true })}
                />
                {this.state.deleteCalloutVisible ? (
                  <Callout
                    onDismiss={_ => this.setState({ deleteCalloutVisible: false })}
                    target={this.deleteButtonElement}
                    coverTarget={true}
                    isBeakVisible={false}
                    gapSpace={0}
                    setInitialFocus={true}
                  >
                    <PrimaryButton text="Confirm Delete" onClick={this.onDelete.bind(this)} />
                  </Callout>
                ) : null}
                {this.item.isContentEditable ? (
                  <ItemButton
                    iconName='Edit'
                    label='Edit'
                    onClick={this.onBeginEdit.bind(this)}
                  />
                ) : null}
              </> : <></>}
              <ItemButton
                iconName='Cancel'
                label='Close'
                onClick={this.onClose.bind(this)}
              />
            </div>
            <div style={{ display: 'flow-root', height: 40 }}>
              <Breadcrumb
                items={this.item.uri.split('/').map((p) => { return { text: p, key: p } })}
                overflowAriaLabel="More links"
                styles={{ root: { margin: 0 }, list: { height: 40 } }}
              />
            </div>
            <div className="item-titlebar">
              <h2 className="item-title" style={{ margin: 7 }}>
                {this.item.title}
              </h2>
            </div>
            <div className="item-info"></div>
            <div className="item-content" ref={this.contentRef}
              style={{ paddingLeft: 28, paddingRight: 28, paddingBottom: 28 }}
              dangerouslySetInnerHTML={{ __html: this.item.parsedContent }}
            />
            <div className="item-tags">{this.item.headers.tags?.map(tag => {
              const menuProps = this.props.sys?.tagMap[tag]
                ?.filter((it: ClientItem) => it.uri !== this.item.uri)
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
            <div
              onKeyDown={(evt) => {
                if (evt.ctrlKey && evt.keyCode === 83) {
                  this.onSave()
                  evt.preventDefault()
                }
              }}
            >
              <span className="item-controls" style={{ display: 'flex' }}>
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
              <TitleEditorComponent editingItem={this.editingItem} />
              <div className="edit-item-content" ref={this.contentRef} >
                <MonacoEditor
                  language={getLanguageFromMIME(this.item.type)}
                  value={this.item.content}
                  options={{ lineDecorationsWidth: 0, wordWrap: 'on', wrappingIndent: 'same', tabSize: 2 }}
                  editorDidMount={this.onEditorDidMount.bind(this)}
                />
              </div>
              <div className="item-type" style={{ width: 170, height: 32, float: 'left' }}>
                <ComboBox
                  allowFreeform
                  autoComplete="on"
                  defaultSelectedKey={this.editingItem.type ? this.editingItem.type : (this.editingItem.type = 'text/markdown')}
                  styles={{
                    callout: { width: 170 }
                  }}
                  options={[
                    { key: 'Content Header', text: 'Content', itemType: SelectableOptionMenuItemType.Header },
                    ...editorMIMETypes.content.map(t => ({ key: t, text: t })),
                    { key: 'divider', text: '-', itemType: SelectableOptionMenuItemType.Divider },
                    { key: 'Code Header', text: 'Code', itemType: SelectableOptionMenuItemType.Header },
                    ...editorMIMETypes.code.map(t => ({ key: t, text: t })),
                  ]}
                  onChange={(event, options, index, value: MIME) => {
                    if (options)
                      this.editingItem.type = options.text as MIME
                    else
                      this.editingItem.type = value
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
   */
  async onSave() {
    const saveToken = Math.random().toString().slice(2)
    this.editingItem.content = this.editor.getValue()
    bus.emit('item-save-clicked', {
      uri: this.item.uri,
      editedItem: this.editingItem,
      token: saveToken
    })
    this.editor = null
    const rotateOutFinished = this.rotateOut()
    bus.once(`item-saved-${saveToken}`, async (data) => {
      this.item.editing = false
      this.item = data.item
      this.generateEditingItem(this.item)
      await rotateOutFinished
      this.forceUpdate()
      typesetMath()
      bus.emit('item-flow-layout')
      this.rotateIn()
    })
  }

  async onRerender() {
    const saveToken = Math.random().toString().slice(2)
    bus.emit('item-save-clicked', {
      uri: this.item.uri,
      editedItem: this.getNewEditingItem(this.item),
      token: saveToken
    })
    bus.once(`item-saved-${saveToken}`, async (data) => {
      this.item = data.item
      this.generateEditingItem(this.item)
      this.forceUpdate()
      typesetMath()
      bus.emit('item-flow-layout')
    })
  }

  async onDelete() {
    this.setState({
      deleteCalloutVisible: false
    })
    await this.slideOut()
    bus.emit('item-delete-clicked', {
      uri: this.item.uri
    })
  }

  async onClose() {
    await this.slideOut()
    bus.emit('item-close-clicked', {
      uri: this.item.uri
    })
  }

  async onBeginEdit() {
    this.item.editing = true
    await this.rotateOut()
    this.forceUpdate()
    bus.emit('item-flow-layout')
    this.rotateIn()
  }

  async onCancelEdit() {
    this.item.editing = false
    this.editor = null
    if (this.item.missing) {
      await this.onDelete()
      return
    }
    await this.rotateOut()
    this.forceUpdate()
    typesetMath()
    bus.emit('item-flow-layout')
    this.rotateIn()
    this.generateEditingItem(this.item)
  }

  /**
   * Helper functions
   */
  promisifyScriptLoad(sc: HTMLScriptElement): Promise<void> {
    return new Promise((res, rej) => {
      sc.addEventListener('load', () => { res() })
    })
  }

  async contentPostProcess() {
    let links = this.contentRef.current.querySelectorAll('a')
    links.forEach((el: HTMLAnchorElement | SVGAElement) => {
      if (el instanceof SVGAElement) {
        if (el.href.baseVal.trim().startsWith('http')) {
          el.target.baseVal = '_blank'
        } else {
          el.onclick = async evt => {
            evt.cancelBubble = true;
            evt.stopPropagation();
            evt.preventDefault();
            bus.emit('item-link-clicked', {
              emitterURI: this.item.uri,
              targetURI: el.href.baseVal,
            })
            return false;
          }
          el.classList.add('item-link')
          el.querySelector('text').setAttribute('style', 'fill: #7e489d;')
        }
        return
      }
      if (isLinkInternal(el)) {
        el.onclick = async evt => {
          evt.cancelBubble = true;
          evt.stopPropagation();
          evt.preventDefault();
          bus.emit('item-link-clicked', {
            emitterURI: this.item.uri,
            targetURI: el.getAttribute('href'),
          })
          return false;
        }
        el.classList.add('item-link')
      } else {
        el.target = '_blank'
      }
    })

    const scripts = this.contentRef.current.getElementsByTagName('script')
    for (let idx = 0; idx < scripts.length; idx++) {
      const script = scripts.item(idx)
      const newScript = document.createElement('script')
      const scriptContent = document.createTextNode(script.text)
      newScript.appendChild(scriptContent)
      let onLoad = null
      script.insertAdjacentElement('afterend', newScript)
      if (script.src !== '') {
        newScript.src = script.src
        newScript.async = true
        onLoad = this.promisifyScriptLoad(newScript)
      }
      script.remove()
      if (onLoad) await onLoad
    }
  }

  generateEditingItem(item: ClientItem) {
    this.editingItem = this.getNewEditingItem(item)
  }

  getNewEditingItem(item: ClientItem): Partial<ClientItem> & { title: string, uri: string } {
    return {
      title: item.title,
      type: item.type,
      uri: item.uri,
      content: item.content,
      headers: JSON.parse(JSON.stringify(item.headers)),
    }
  }

  /**
   * Animation: rotate 90 deg to hide
   * Note: .finished promise returned by anime.js is fucking erroneous,
   *       so I'm using a custom promisified style
   */
  async rotateOut() {
    return new Promise((res, rej) => {
      anime({
        targets: this.rootRef.current,
        rotateY: 90,
        duration: 100,
        easing: 'linear',
        complete: () => res()
      })
    })
  }

  /**
   * Animation: slide 400px while fading out
   */
  async slideOut() {
    return new Promise((res, rej) => {
      anime({
        targets: this.rootRef.current,
        translateX: -200,
        opacity: 0,
        duration: 100,
        easing: 'easeOutQuad',
        complete: () => res()
      })
    })
  }

  /**
   * Animation: rotate 90 deg to display
   */
  async rotateIn() {
    return new Promise((res, rej) => {
      anime({
        targets: this.rootRef.current,
        rotateY: 0,
        duration: 100,
        easing: 'linear',
        complete: () => res()
      })
    })
  }

  /**
   * Animation: Perform FLIP operation given delta x y
   */
  async FLIPOperation(dx: number, dy: number) {
    return new Promise((res, rej) => {
      anime({
        targets: this.rootRef.current,
        translateX: dx,
        translateY: dy,
        duration: 100,
        easing: () => (t: number) => 1 - t,
        complete: () => res()
      })
    })
  }

  /**
   * Animation: slide to new position (vertically)
   */
  async smoothLayoutChange() {
    this.rootRef.current.style.transform = ''
    const newPosition = getPositionToDocument(this.rootRef.current)
    if (this.lastPosition.left === 0) {
      await this.FLIPOperation(newPosition.left, 0)
      this.lastPosition = newPosition
      return
    }
    // const dx = this.lastPosition.left - newPosition.left
    const dy = this.lastPosition.top - newPosition.top
    await this.FLIPOperation(0, dy)
    this.lastPosition = newPosition
  }
}
