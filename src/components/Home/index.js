import React from 'react';
import Plain from 'slate-plain-serializer';

import { isKeyHotkey } from 'is-hotkey';

import { Value } from 'slate';
import { Editor, getEventTransfer  } from 'slate-react';

import initialValue from './value.json';

import { Row, Col, Layout, Divider, Icon, Button  } from "antd";

const { Header, Content } = Layout;

const DEFAULT_NODE = 'paragraph'

const isBoldHotkey = isKeyHotkey('mod+b')
const isItalicHotkey = isKeyHotkey('mod+i')
const isUnderlinedHotkey = isKeyHotkey('mod+u')
const isCodeHotkey = isKeyHotkey('mod+`')

class Home extends React.Component {

  state = {
    value: Value.fromJSON(initialValue),
    size: 'default'
  }

  hasMark = type => {
    const { value } = this.state
    return value.activeMarks.some(mark => mark.type === type)
  }

  hasBlock = type => {
    const { value } = this.state
    return value.blocks.some(node => node.type === type)
  }

  render() {
    const { value, size } = this.state
    const { history } = value
    return (
      <Layout>
        <Header style={{ background: '#FFF', boxShadow: '0px 1px 3px 0px rgba(196,196,196, .4)', position: 'fixed', zIndex: 1, width: '100%' }}>
          <Col span={3}>
            <Button size={size} disabled>Salvar</Button>
            <Button style={{marginLeft: 8}} type="primary" icon="cloud-download" />
          </Col>
          <Col span={4}>
            <Icon onMouseDown={this.onClickUndo} type="arrow-left" />
            <Icon onMouseDown={this.onClickRedo} type="arrow-right" />
            <span>Desfazer: {history.undos.size}</span>
            <span> Refazer: {history.redos.size}</span>
            <Divider type="vertical" />
          </Col>
          <Col span={14}>
            {this.renderMarkButton('bold', 'B')}
            {this.renderMarkButton('italic', 'I')}
            {this.renderMarkButton('underlined', 'U')}
            {this.renderMarkButton('code', 'código')}
            {this.renderBlockButton('heading-one', 'h1')}
            {this.renderBlockButton('heading-two', 'h2')}
            {this.renderBlockButton('block-quote', 'citação')}
            {this.renderBlockButton('numbered-list', 'lista_numerada')}
            {this.renderBlockButton('bulleted-list', 'lista_pontuada')}
          </Col>
        </Header>

        <Layout style={{ padding: '50px', margin: '64px' }}>
          <Content style={{ padding: '2cm', backgroundColor: '#FFF', height: '842px', width: '795px', marginLeft: 'auto', marginRight: 'auto', boxShadow: '0px 0px 4px 0px rgba(0,0,0, 0.1)' }}>
            <Editor
              spellCheck
              autoFocus
              placeholder="Enter some rich text..."
              value={this.state.value}
              onChange={this.onChange}
              onKeyDown={this.onKeyDown}
              renderNode={this.renderNode}
              renderMark={this.renderMark}
            />
          </Content>
        </Layout>
      </Layout>
    )
  }

  renderMarkButton = (type, icon) => {
    const isActive = this.hasMark(type)

    return (
      <Button
        active={isActive}
        onMouseDown={event => this.onClickMark(event, type)}
      >
        <Icon>{icon}</Icon>
      </Button>
    )
  }

  onClickRedo = event => {
    event.preventDefault()
    const { value } = this.state
    const change = value.change().redo()
    this.onChange(change)
  }

  onClickUndo = event => {
    event.preventDefault()
    const { value } = this.state
    const change = value.change().undo()
    this.onChange(change)
  }

  renderBlockButton = (type, icon) => {
    let isActive = this.hasBlock(type)

    if (['numbered-list', 'bulleted-list'].includes(type)) {
      const { value } = this.state
      const parent = value.document.getParent(value.blocks.first().key)
      isActive = this.hasBlock('list-item') && parent && parent.type === type
    }

    return (
      <Button
        active={isActive}
        onMouseDown={event => this.onClickBlock(event, type)}
      >
        <Icon>{icon}</Icon>
      </Button>
    )
  }

  renderNode = props => {
    const { attributes, children, node } = props

    switch (node.type) {
      case 'block-quote':
        return <blockquote {...attributes}>{children}</blockquote>
      case 'bulleted-list':
        return <ul {...attributes}>{children}</ul>
      case 'heading-one':
        return <h1 {...attributes}>{children}</h1>
      case 'heading-two':
        return <h2 {...attributes}>{children}</h2>
      case 'list-item':
        return <li {...attributes}>{children}</li>
      case 'numbered-list':
        return <ol {...attributes}>{children}</ol>
    }
  }

  renderMark = props => {
    const { children, mark, attributes } = props

    switch (mark.type) {
      case 'bold':
        return <strong {...attributes}>{children}</strong>
      case 'code':
        return <code {...attributes}>{children}</code>
      case 'italic':
        return <em {...attributes}>{children}</em>
      case 'underlined':
        return <u {...attributes}>{children}</u>
    }
  }

  onChange = ({ value }) => {
    this.setState({ value })
  }

  onKeyDown = (event, change) => {
    let mark

    if (isBoldHotkey(event)) {
      mark = 'bold'
    } else if (isItalicHotkey(event)) {
      mark = 'italic'
    } else if (isUnderlinedHotkey(event)) {
      mark = 'underlined'
    } else if (isCodeHotkey(event)) {
      mark = 'code'
    } else {
      return
    }

    event.preventDefault()
    change.toggleMark(mark)
    return true
  }

  onClickMark = (event, type) => {
    event.preventDefault()
    const { value } = this.state
    const change = value.change().toggleMark(type)
    this.onChange(change)
  }

  onClickBlock = (event, type) => {
    event.preventDefault()
    const { value } = this.state
    const change = value.change()
    const { document } = value

    // Handle everything but list buttons.
    if (type != 'bulleted-list' && type != 'numbered-list') {
      const isActive = this.hasBlock(type)
      const isList = this.hasBlock('list-item')

      if (isList) {
        change
          .setBlocks(isActive ? DEFAULT_NODE : type)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list')
      } else {
        change.setBlocks(isActive ? DEFAULT_NODE : type)
      }
    } else {
      // Handle the extra wrapping required for list buttons.
      const isList = this.hasBlock('list-item')
      const isType = value.blocks.some(block => {
        return !!document.getClosest(block.key, parent => parent.type == type)
      })

      if (isList && isType) {
        change
          .setBlocks(DEFAULT_NODE)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list')
      } else if (isList) {
        change
          .unwrapBlock(
            type == 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
          )
          .wrapBlock(type)
      } else {
        change.setBlocks('list-item').wrapBlock(type)
      }
    }

    this.onChange(change)
  }
}

export default Home
