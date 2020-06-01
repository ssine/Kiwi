import bus from '../eventBus'
import ClientItem from '../ClientItem'
import React from 'react'
import {
  DefaultButton, PrimaryButton
} from 'office-ui-fabric-react'
import * as monaco from 'monaco-editor'
import { Depths } from '@uifabric/fluent-theme/lib/fluent/FluentDepths'
// import anime from 'animejs'
import anime from 'animejs/lib/anime.es'
import { isLinkInternal, getPositionToDocument, getCookie, postFile } from '../Common'
import { MIME, getLanguageFromMIME, editorMIMETypes, resolveURI, suggestedTitleToURI, suggestedURIToTitle } from '../../core/Common'
import { typesetMath } from '../mathjax'
import loadable from "@loadable/component"
import * as moment from 'moment'
import manager from '../ItemManager'

import { IconButton } from './basic/Button/IconButton'
import { Callout, AttachDirection } from './basic/Callout/Callout'
import { ContextualMenu } from './basic/Menu/ContextualMenu'
import { MenuButton } from './basic/Button/MenuButton'
import { Breadcrumb } from './basic/Breadcrumb/Breadcrumb'

const MonacoEditor = loadable(() => import("react-monaco-editor"), {
  fallback: <div>loading editor...</div>
});

class TagsComponent extends React.Component<{ tags: string[] }, { isEditing: boolean[] }> {
  stagedValues: string[]
  constructor(props: { tags: string[] }) {
    super(props)
    this.state = {
      isEditing: Array(props.tags.length).fill(false)
    }
    this.stagedValues = JSON.parse(JSON.stringify(props.tags))
  }

  render() {
    return <div style={{ display: 'flex' }}>{this.stagedValues.map((tag, idx) => {
      if (this.state.isEditing[idx]) {
        return <div key={idx} style={{ display: 'inline-flex', paddingLeft: 8 }}>
          <input
            defaultValue={tag}
            style={{ width: 80 }}
            onChange={(evt) => {
              this.stagedValues[idx] = evt.target.value
            }}
          />
          <IconButton
            iconName='Accept'
            style={{ width: 32, height: 32 }}
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
    } <IconButton iconName='Add' style={{ height: 32, width: 32 }} disabled={this.stagedValues[this.stagedValues.length - 1] === ''} onClick={_ => {
      this.state.isEditing.push(true)
      this.stagedValues.push('')
      this.setState(this.state)
    }} /> </div>
  }
}

class TitleEditorComponent extends React.Component<{ editingItem: { uri: string, title: string }, originalURI: string }, {}> {
  editTitleChanged: boolean
  editURIChanged: boolean
  constructor(props: any) {
    super(props)
    this.editTitleChanged = false
    this.editURIChanged = false
  }

  render() {
    return <div>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div className="item-uri-edit" style={{ flexGrow: 1, height: 40 }}>
          <input type="text" value={this.props.editingItem.uri} onChange={(evt) => {
            this.editURIChanged = true
            this.props.editingItem.uri = evt.target.value
            if (!this.editTitleChanged) {
              this.props.editingItem.title = suggestedURIToTitle(this.props.editingItem.uri)
            }
            this.forceUpdate()
          }} style={{ fontSize: 27 }} />
        </div>
        <div className="item-controls" style={{ flexGrow: 0, display: 'flex' }}>
          {this.props.children}
        </div>
      </div>
      <div className="item-title-edit" style={{ height: 40 }}>
        <input type="text" value={this.props.editingItem.title} onChange={(evt) => {
          this.editTitleChanged = true
          this.props.editingItem.title = evt.target.value
          if (!this.editURIChanged) {
            this.props.editingItem.uri = resolveURI(this.props.originalURI, suggestedTitleToURI(evt.target.value))
          }
          this.forceUpdate()
        }} style={{ fontFamily: 'Constantia' }} />
      </div>
    </div>
  }
}

export class ItemComponent extends React.Component<{ item: ClientItem }, { deleteCalloutVisible: boolean, moreCalloutVisible: boolean }> {
  contentRef: React.RefObject<HTMLDivElement>
  rootRef: React.RefObject<HTMLDivElement>
  deleteButtonRef: React.RefObject<HTMLDivElement>
  moreButtonRef: React.RefObject<HTMLDivElement>
  breadcrumbFoldRef: React.RefObject<HTMLDivElement>
  editor: monaco.editor.IStandaloneCodeEditor | null
  item: ClientItem
  editingItem: Partial<ClientItem> & { title: string, uri: string }
  lastPosition: { left: number, top: number }
  itemFlowLayoutCallback: () => void
  externalEditCallback: (data: { rerender: string }) => void

  constructor(props: { item: ClientItem }) {
    super(props);
    this.contentRef = React.createRef()
    this.rootRef = React.createRef()
    this.deleteButtonRef = React.createRef()
    this.moreButtonRef = React.createRef()
    this.breadcrumbFoldRef = React.createRef()
    this.editor = null
    this.item = this.props.item
    this.state = {
      deleteCalloutVisible: false,
      moreCalloutVisible: false
    }
    this.generateEditingItem(this.item)
    this.itemFlowLayoutCallback = () => {
      this.smoothLayoutChange()
    }
    this.externalEditCallback = async (data) => {
      await this.onRerender(data)
    }
  }

  componentDidMount() {
    if (!this.item.editing) {
      this.contentPostProcess()
    }
    this.lastPosition = getPositionToDocument(this.rootRef.current)
    this.rootRef.current.addEventListener('paste', (ev) => {
      if (!this.item.editing) return;
      let files = ev.clipboardData.files
      if (files && files.length > 0) {
        let file = files[0]
        if (file.type.indexOf("image") !== -1) {
          let ext = file.name.match(/\.\S+?$/)[0].substr(1)
          let fn = `asset/${moment().format('YYYY-MM-DD-HH-mm-ss-SSS')}.${ext}`
          postFile(resolveURI(this.editingItem.uri, fn), file)
          this.editor.trigger('keyboard', 'type', { text: `![img](${fn})` });
          ev.preventDefault()
        }
      }
    })
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
      id: 'Copy PermaLink',
      text: 'Copy PermaLink',
      iconName: 'Link',
      onClick: () => {
        navigator.clipboard.writeText(`${window.location.origin}/#${this.item.uri}`)
      }
    }]
    if (getCookie('token') !== '') {
      dropdownItems.push({
        id: 'Create Sibling',
        text: 'Create Sibling',
        iconName: 'Add',
        onClick: () => {
          bus.emit('create-item-clicked', { uri: resolveURI(this.props.item.uri, 'new-item') })
        }
      })
    }

    return (
      <div className="item" style={{ boxShadow: Depths.depth8 }} ref={this.rootRef}>
        {!this.item.editing ? (
          <div>
            <div style={{ display: 'flex', flexDirection: 'row', height: 40 }} ref={this.breadcrumbFoldRef}>
              <div style={{ flexGrow: 1 }}>
                <Breadcrumb
                  box={this.breadcrumbFoldRef}
                  items={this.item.uri.split('/')}
                  onItemClick={(it) => { bus.emit('item-link-clicked', { targetURI: it.uri }) }}
                />
              </div>
              <div className="item-controls" style={{ display: 'flex' }}>
                {dropdownItems.length > 0 && <>
                  <IconButton
                    iconName='ChevronDown'
                    divRef={this.moreButtonRef}
                    onClick={_ => this.setState({ moreCalloutVisible: true })}
                  />
                  {this.state.moreCalloutVisible &&
                    <Callout
                      target={this.moreButtonRef}
                      direction={AttachDirection.bottomLeftEdge}
                      width={80}
                      onDismiss={_ => this.setState({ moreCalloutVisible: false })}
                      style={{ width: 'auto' }}
                    >
                      <ContextualMenu items={dropdownItems} />
                    </Callout>
                  }
                </>}
                {getCookie('token') !== '' && <>
                  <IconButton
                    iconName='Delete'
                    divRef={this.deleteButtonRef}
                    onClick={_ => this.setState({ deleteCalloutVisible: true })}
                  />
                  {this.state.deleteCalloutVisible &&
                    <Callout
                      target={this.deleteButtonRef}
                      direction={AttachDirection.bottomLeftEdge}
                      width={80}
                      onDismiss={_ => this.setState({ deleteCalloutVisible: false })}
                      style={{ width: 'auto', transform: 'translateX(-35%)' }}
                    >
                      <PrimaryButton text="Confirm Delete" onClick={this.onDelete.bind(this)} />
                    </Callout>
                  }
                  {this.item.isContentEditable &&
                    <IconButton
                      iconName='Edit'
                      onClick={this.onBeginEdit.bind(this)}
                    />
                  }
                </>}
                <IconButton
                  iconName='Cancel'
                  onClick={this.onClose.bind(this)}
                />
              </div>
            </div>
            <div className="item-titlebar">
              <h2 className="item-title" style={{ margin: 7 }}>
                {this.item.title}
              </h2>
            </div>
            <div className="item-info"></div>
            <div className="item-content" ref={this.contentRef}
              dangerouslySetInnerHTML={{ __html: this.item.parsedContent }}
            />
            <div className="item-tags">{this.item.headers.tags?.map(tag => {
              const menuProps = manager.tagMap[tag]
                ?.map((it: ClientItem) => {
                  return {
                    id: it.uri,
                    key: it.uri,
                    text: it.title,
                    onClick: () => bus.emit('item-link-clicked', { targetURI: it.uri })
                  }
                })
              return <MenuButton name={tag} key={tag} style={{ height: 35, paddingLeft: 10, paddingRight: 10 }} menuProps={{ items: menuProps, styles: { text: { height: 35, paddingRight: 10, paddingLeft: 10 } } }} />
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
              <TitleEditorComponent editingItem={this.editingItem} originalURI={this.editingItem.uri}>
                <IconButton
                  iconName='Accept'
                  onClick={this.onSave.bind(this)}
                />
                <IconButton
                  iconName='Cancel'
                  onClick={this.onCancelEdit.bind(this)}
                />
              </TitleEditorComponent>
              <div className="edit-item-content" ref={this.contentRef} >
                <MonacoEditor
                  language={getLanguageFromMIME(this.item.type)}
                  value={this.item.content}
                  options={{ lineDecorationsWidth: 0, wordWrap: 'on', wrappingIndent: 'same', tabSize: 2 }}
                  editorDidMount={this.onEditorDidMount.bind(this)}
                />
              </div>
              <div className="item-type" style={{ width: 170, height: 32, float: 'left' }}>
                <MenuButton
                  name={this.editingItem.type ? this.editingItem.type : (this.editingItem.type = 'text/markdown')}
                  iconName="ChevronDown"
                  menuProps={{
                    items: ['text/markdown', 'text/asciidoc', 'text/plain', 'text/wikitext'].map(tp => {
                      return {
                        id: tp,
                        text: tp,
                        onClick: it => {
                          this.editingItem.type = it.id as MIME
                          this.forceUpdate()
                        }
                      }
                    }),
                    styles: {
                      text: {
                        height: 35,
                        paddingLeft: 5,
                        paddingRight: 5
                      }
                    }
                  }} />
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
    while (this.editingItem.uri[0] === '/')
      this.editingItem.uri = this.editingItem.uri.slice(1)
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

  async onRerender(args: { rerender: string }) {
    const saveToken = Math.random().toString().slice(2)
    bus.emit('item-save-clicked', {
      uri: this.item.uri,
      editedItem: this.getNewEditingItem(this.item),
      token: saveToken
    })
    bus.once(`item-saved-${saveToken}`, async (data) => {
      this.item = data.item
      this.generateEditingItem(this.item)
      if (args.rerender) {
        this.forceUpdate()
        typesetMath()
      }
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
              // emitterURI: this.item.uri,
              targetURI: el.href.baseVal,
            })
            return false;
          }
          el.classList.add('item-link')
        }
        return
      }
      if (isLinkInternal(el)) {
        el.onclick = async evt => {
          evt.cancelBubble = true;
          evt.stopPropagation();
          evt.preventDefault();
          bus.emit('item-link-clicked', {
            // we have resolved all links on server side
            // emitterURI: this.item.uri,
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
