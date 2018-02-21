import React from 'react';
import ReactDataGrid from 'react-data-grid';
import update from 'immutability-helper'
import {withAlert} from "react-alert";
import {ObjectFormatterGrid} from "../formatterGrid/objectFormatterGrid";
import FlashModal from "../unconfigured/flashModal";

const {Editors} = require('react-data-grid-addons');
const {AutoComplete: AutoCompleteEditor, DropDownEditor} = Editors;

export class ConfiguredEsps extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            expanded: {},
            rows: this.createRows(),
            isModalOpen: false,
            selectedHardwareId: -1
        };
    }

    getDropdownOptionLocations = () => {
        return this.props.locations.map((location) => {
                return {
                    id: location.id,
                    title: <div id={location.id}>{location.name}</div>,
                    text: location.name,
                    value: location.name
                };
            }
        );
    };

    columns = [
        {
            key: 'id',
            name: 'ID',
            width: 80
        },
        {
            key: 'hwId',
            name: "Hardware ID"
        },
        {
            key: 'name',
            name: 'Name',
            editable: true
        },
        {
            key: 'components',
            name: 'Components'
        },
        {
            key: 'ip',
            name: 'IP-Address',
            editable: true
        },
        {
            key: 'location',
            name: 'Location',
            editor: <AutoCompleteEditor options={this.getDropdownOptionLocations()}/>,
            formatter: ObjectFormatterGrid
        },
        {
            key: "buttons",
            name: "",
            width: 68
        }
    ];

    getSubRowDetails = (rowItem) => {
        let isExpanded = this.state.expanded[rowItem.name] ? this.state.expanded[rowItem.name] : false;
        return {
            group: rowItem.children && rowItem.children.length > 0,
            expanded: isExpanded,
            children: rowItem.children,
            field: 'components',
            treeDepth: rowItem.treeDepth || 0,
            siblingIndex: rowItem.siblingIndex,
            numberSiblings: rowItem.numberSiblings
        };
    };

    onCellExpand = (args) => {
        let rows = this.state.rows.slice(0);
        let rowKey = args.rowData.name;
        let rowIndex = rows.indexOf(args.rowData);
        let subRows = args.expandArgs.children;

        let expanded = Object.assign({}, this.state.expanded);
        if (expanded && !expanded[rowKey]) {
            expanded[rowKey] = true;
            this.updateSubRowDetails(subRows, args.rowData.treeDepth);
            rows.splice(rowIndex + 1, 0, ...subRows);
        } else if (expanded[rowKey]) {
            expanded[rowKey] = false;
            rows.splice(rowIndex + 1, subRows.length);
        }

        this.setState({expanded: expanded, rows: rows});
    };

    updateSubRowDetails = (subRows, parentTreeDepth) => {
        let treeDepth = parentTreeDepth || 0;
        subRows.forEach((sr, i) => {
            sr.treeDepth = treeDepth + 1;
            sr.siblingIndex = i;
            sr.numberSiblings = subRows.length;
        });
    };

    onDeleteSubRow = (args) => {
        let idToDelete = args.rowData.id;
        let rows = this.state.rows.slice(0);
        // Remove sub row from parent row.
        rows = rows.map(r => {
            let children = [];
            if (r.children) {
                children = r.children.filter(sr => sr.id !== idToDelete);
                if (children.length !== r.children.length) {
                    this.updateSubRowDetails(children, r.treeDepth);
                }
            }
            return Object.assign({}, r, {children});
        });
        // Remove sub row from flattened rows.
        rows = rows.filter(r => r.id !== idToDelete);
        this.setState({rows});
    };

    onAddSubRow = (args) => {
        console.log('add sub row');
        console.log(args);
    };

    getButtons = (hardwareId) => {
        return (
            <div className="justify-content-center">
                <button className="btn btn-sm btn-outline-primary padding-x-sm"
                        onClick={() => this.openModal(hardwareId)}>Flash
                </button>
            </div>
        );
    };

    createRows = () => {

        return this.props.esps.map((esp) => {
            let components = esp.components.map((component) => {
                return {
                    id: <div className="margin-left-md">{component.id}</div>,
                    name: <div className="margin-left-md">{component.name}</div>,
                    components: <div className="margin-left-md">{component.typeString}</div>
                };
            });
            return {
                id: <b>{esp.id}</b>,
                name: esp.name,
                hwId: esp.hwId,
                ip: esp.ip,
                location: esp.location,
                components: "Components",
                children: components,
                buttons: this.getButtons(esp.hwId)
            }
        });
    };

    rowGetter = (i) => {
        return this.state.rows[i];
    };

    handleGridRowsUpdated = ({fromRow, toRow, updated}) => {
        if (updated.hasOwnProperty('location')) {
            updated = {
                location: {
                    id: updated.location.props.id,
                    name: updated.location.props.children
                }
            };
        }

        let rows = this.state.rows.slice();

        for (let i = fromRow; i <= toRow; i++) {
            rows[i] = update(rows[i], {$merge: updated});
            this.updateServer("update", rows[i]);
        }

        this.setState({rows});
    };

    openModal = (hardwareId) => {
        this.setState({
            isModalOpen: true,
            selectedHardwareId: hardwareId
        });
    };

    closeModal = () => {
        this.setState({isModalOpen: false});
    };

    updateServer = (action, esp) => {
        let update = {
            action: action,
            esp: esp
        };

        let formData = new FormData();
        formData.append('EspUpdate', JSON.stringify(update));
        this.props.alert.show('Updating ID: ' + esp.id + " ...");
        fetch("", {
            method: "POST",
            body: formData
        }).then((res) => res)
            .then((data) => {
                this.props.alert.success('Updated ID: ' + esp.id);
                this.props.updateAppState();
            })
            .catch((err) => this.props.alert.error('Failed updating ID: ' + esp.id));
    };

    render() {
        return (
            <div>
                <ReactDataGrid
                    minHeight={90 + 'vh'}
                    rowGetter={this.rowGetter}
                    columns={this.columns}
                    rowsCount={this.state.rows.length}
                    enableCellSelect={true}
                    onAddSubRow={this.onAddSubRow}
                    onDeleteSubRow={this.onDeleteSubRow}
                    onCellExpand={this.onCellExpand}
                    getSubRowDetails={this.getSubRowDetails}
                    onGridRowsUpdated={this.handleGridRowsUpdated}/>

                <FlashModal isModalOpen={this.state.isModalOpen}
                            closeModal={this.closeModal}
                            firmwares={this.props.firmwares}
                            hardwareId={this.state.selectedHardwareId}/>
            </div>
        );
    }
}

export default withAlert(ConfiguredEsps)