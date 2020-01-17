import bus from '../eventBus'
import ClientItem from '../ClientItem'
import * as React from 'react'
import { IconButton } from 'office-ui-fabric-react'
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox'
import { Label, ILabelStyles } from 'office-ui-fabric-react/lib/Label';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { IStyleSet } from 'office-ui-fabric-react/lib/Styling';
import { List } from 'office-ui-fabric-react/lib/List'
import { ITheme, mergeStyleSets, getTheme, getFocusStyle } from 'office-ui-fabric-react/lib/Styling'

const theme: ITheme = getTheme();
const { palette, semanticColors, fonts } = theme;

const classNames = mergeStyleSets({
  container: {
    overflow: 'auto',
    maxHeight: 500
  },
  itemCell: [
    getFocusStyle(theme, { inset: -1 }),
    {
      minHeight: 54,
      padding: 10,
      boxSizing: 'border-box',
      borderBottom: `1px solid ${semanticColors.bodyDivider}`,
      display: 'flex',
      selectors: {
        '&:hover': { background: palette.neutralLight }
      }
    }
  ],
  itemImage: {
    flexShrink: 0
  },
  itemContent: {
    marginLeft: 10,
    overflow: 'hidden',
    flexGrow: 1
  },
  itemName: [
    fonts.xLarge,
    {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  ],
  itemIndex: {
    fontSize: fonts.small.fontSize,
    color: palette.neutralTertiary,
    marginBottom: 10
  },
  chevron: {
    alignSelf: 'center',
    marginLeft: 10,
    color: palette.neutralTertiary,
    fontSize: fonts.large.fontSize,
    flexShrink: 0
  }
});

type SidebarComponentProperty = {
  title: string
  subTitle: string
  itemFlow: ClientItem[]
}

const labelStyles: Partial<IStyleSet<ILabelStyles>> = {
  root: { marginTop: 10, marginLeft: 10 }
};

export default class SidebarComponent extends React.Component<SidebarComponentProperty, {}> {
  componentDidMount() {
    const rerender = () => { 
      console.log('rerender: ', this.props.itemFlow)
      this.forceUpdate()
    }
    bus.on('item-displaied', rerender)
    bus.on('item-closed', rerender)
  }
  render() {
    return (
      <div className="sidebar">
        <h1 className="site-title">{this.props.title}</h1>
        <div className="site-subtitle">{this.props.subTitle}</div>
        <div className="page-controls">
          <IconButton iconProps={{ iconName: 'Add' }} title="New Item" ariaLabel="New Item" onClick={evt => {
            bus.emit('create-item-clicked', {})
            console.log('create new item!')
          }} style={{ color: 'purple' }} className="item-close" />
        </div>
        <SearchBox
          placeholder="search..."
          onChange={(_, newValue) => console.log('SearchBox onChange fired: ' + newValue)}
        />
        <Pivot aria-label="Status">
          <PivotItem
            headerText="Opened"
            headerButtonProps={{
              'data-order': 1,
              'data-title': 'My Files Title'
            }}
          >
            <Label styles={labelStyles}>
              <List items={this.props.itemFlow.map(it => {
                console.log('mapped!', it)
                return it.uri
              })} onRenderCell={this._onRenderCell} />
            </Label>
          </PivotItem>
          <PivotItem headerText="Index">
            <Label styles={labelStyles}>Pivot #2</Label>
          </PivotItem>
          <PivotItem headerText="More">
            <Label styles={labelStyles}>Pivot #3</Label>
          </PivotItem>
        </Pivot>
      </div>
    )
  }

  private _onRenderCell(item: string, index: number, isScrolling: boolean): JSX.Element {
    return (
      <div className={classNames.itemCell} data-is-focusable={true}>
      {item}
    </div>
    )
  }
}
