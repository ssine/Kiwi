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

const ROW_HEIGHT = 26
const FONT_SIZE = 13

const classNames = mergeStyleSets({
  listItem: [{
    margin: 0,
    paddingTop: 3,
    paddingLeft: 10,
    paddingBottom: 5,
    selectors: {
      '&:hover': { background: '#d5cfe7' }
    }
  }]
});

import { GroupedList, IGroup } from 'office-ui-fabric-react/lib/GroupedList';
import { IColumn, DetailsRow } from 'office-ui-fabric-react/lib/DetailsList';
import { Selection, SelectionMode, SelectionZone } from 'office-ui-fabric-react/lib/Selection';


export class GroupedListBasicExample extends React.Component<{}, {}> {
  private _items: { uri: string, title: string }[];
  private _columns: IColumn[];
  private _groups: IGroup[];
  private _selection: Selection;

  constructor(props: {}) {
    super(props);

    this._items = [
      { uri: 'fold/sub', title: 'sub' },
      { uri: 'the-new-wiki', title: 'The New Wiki' },
    ];
    this._columns = [{
          key: 'uri',
          name: 'uri',
          fieldName: 'uri',
          minWidth: 200
        }]
    this._groups = [
      { count: 1, key: 'fold', name: 'fold', startIndex: 0, level: -1 }
    ];
    console.log(this._items)
    console.log(this._groups)

    this._selection = new Selection();

  }

  public render(): JSX.Element {

    return (
      <div>
        <input type="checkbox" hidden></input>
        <GroupedList
          items={this._items}
          onRenderCell={this._onRenderCell}
          selectionMode={SelectionMode.none}
          groups={this._groups}
          compact={true}
          groupProps={{
            headerProps: {
              indentWidth: ROW_HEIGHT / 2,
              styles: { 
                root: { border: 0 },
                groupHeaderContainer: {height: ROW_HEIGHT, minHeight: ROW_HEIGHT, fontSize: FONT_SIZE },
                expand: {height: ROW_HEIGHT, width: ROW_HEIGHT, fontSize: FONT_SIZE }, // the arrow icon button
                title: {paddingLeft: 3, fontSize: FONT_SIZE },
              }
            }
          }}
        />
        <DetailsRow
          columns={this._columns}
          groupNestingDepth={0}
          item={this._items[1]}
          itemIndex={0}
          selection={this._selection}
          selectionMode={SelectionMode.none}
          indentWidth={ROW_HEIGHT / 2}
          styles={{
            root: {height: ROW_HEIGHT, minHeight: ROW_HEIGHT, width: '100%', background: '#f5f3fc' },
          }}
          compact={true}
        />
      </div>
    );
  }

  private _onRenderCell = (nestingDepth: number, item: { uri: string, title: string }, itemIndex: number): JSX.Element => {
    return (
      <DetailsRow
        columns={this._columns}
        groupNestingDepth={nestingDepth}
        item={item}
        itemIndex={itemIndex}
        selection={this._selection}
        selectionMode={SelectionMode.none}
        indentWidth={ROW_HEIGHT / 2}
        styles={{
          root: {height: ROW_HEIGHT, minHeight: ROW_HEIGHT, width: '100%', background: '#f5f3fc' },
        }}
        compact={true}
      />
    );
  };

  private _onChangeCompactMode = (ev: React.MouseEvent<HTMLElement>, checked: boolean): void => {
    this.setState({ true: checked });
  };
}





type SidebarComponentProperty = {
  title: string
  subTitle: string
  itemFlow: ClientItem[]
}

const labelStyles: Partial<IStyleSet<ILabelStyles>> = {
  root: { marginTop: 10 }
};

export default class SidebarComponent extends React.Component<SidebarComponentProperty, {}> {
  componentDidMount() {
    bus.on('item-displaied', this.forceUpdate.bind(this))
    bus.on('item-closed', this.forceUpdate.bind(this))
  }

  render() {
    return (
      <div className="sidebar" style={{
        height: '100vh',
        overflow: 'auto'
      }}>
        <h1 className="site-title">{this.props.title}</h1>
        <div className="site-subtitle">{this.props.subTitle}</div>
        <div className="page-controls">
          <IconButton iconProps={{ iconName: 'Add' }} title="New Item" ariaLabel="New Item" onClick={evt => {
            bus.emit('create-item-clicked', {})
          }} style={{ color: 'purple' }} className="item-close" />
        </div>
        <SearchBox
          placeholder="search..."
          onChange={(_, newValue) => console.log('SearchBox onChange fired: ' + newValue)}
        />
        <Pivot aria-label="Status" style={{marginTop: 10}}>
          <PivotItem
            headerText="Opened"
            headerButtonProps={{
              'data-order': 1,
              'data-title': 'My Files Title'
            }}
          >
            <Label styles={labelStyles}>
              <List items={this.props.itemFlow.map(it => it.uri)} onRenderCell={this._onRenderCell} />
            </Label>
          </PivotItem>
          <PivotItem headerText="Index">
            <Label styles={labelStyles}>
            <GroupedListBasicExample />
            </Label>
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
      <div data-is-focusable={true} className={classNames.listItem}>
      {item}
    </div>
    )
  }

}
