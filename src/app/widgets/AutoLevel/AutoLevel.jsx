import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import numeral from 'numeral';
import ReactTable from 'react-table';
import './react-table.css';
import { TRACE, DEBUG, INFO, WARN, ERROR } from 'universal-logger';
import log from '../../lib/log';
import {
    MODAL_PREVIEW,
    MODAL_PREVIEW2
} from './constants';

class AutoLevel extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    constructor(props) {
        super(props);
        this.state = {
            probingObj: [],
            probingString: [],
            referenceZ: 0.0
        };
    }

    clearGrid = () => {
        log.error('AutoLevel clearGrid');
        this.setState({
            probingObj: [],
            probingString: [],
            referenceZ: 0.0
        });
    };

    handleClickSave = () => {
        //var probingString = [];
        this.state.probingObj.forEach(el => {
            // this.state.probingString.push(el.x + ' ' + el.y + ' ' + el.z + ' ' + el.pz + '\n');
            this.state.probingString.push(el.x + ' ' + el.y + ' ' + el.z + '\n');
        });
        let element = document.createElement('a');
        let file = new Blob(this.state.probingString, { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'probedata.rpf';
        element.click();
    }

    render() {
        log.setLevel(TRACE);
        //log.log(INFO, './src/app/widgets/AutoLevel/AutoLevel render called');

        //const { state } = this.props;
        const { state, actions } = this.props;
        //log.error('AutoLevel :' + JSON.stringify(state));

        const colWidth = 60;
        const probingColumns = [{
            Header: 'x',
            accessor: 'x',
            width: colWidth
        }, {
            Header: 'y',
            accessor: 'y',
            width: colWidth
        }, {
            Header: 'z',
            accessor: 'z',
            width: colWidth
        }, {
            Header: 'pz',
            accessor: 'pz',
            width: colWidth
        }];

        if (Object.prototype.hasOwnProperty.call(state, 'probingData')) {
            //log.error('AutoLevel :' + JSON.stringify(state));
            //log.error('AutoLevel :' + JSON.stringify(state.probingData));
            //log.error('AutoLevel :' + JSON.stringify(state.probingData.result));
            if (state.probingData.printed === false) {
                state.probingData.printed = true;
                //log.error('AutoLevel result :' + JSON.stringify(state.probingData.result));
                log.log(INFO, 'AutoLevel result :' + JSON.stringify(state.probingData.result));

                let sx = state.probingData.result.x;
                let sy = state.probingData.result.y;
                let sz = state.probingData.result.z;

                // first data point becomes z reference
                if (this.state.probingObj.length === 0) {
                    this.state.referenceZ = Number(sz);
                }

                // correct new z entry for autolevel plane
                //var cz = numeral(0.0).format('0.000');
                //log.error('AutoLevel new reference: ' + this.state.referenceZ);
                log.info('AutoLevel new reference: ' + this.state.referenceZ);
                let PRBz = Number(sz);
                let corz = PRBz - this.state.referenceZ; // corrected z
                let cz = numeral(corz).format('0.000');

                // if (this.state.probingObj.length > 0) {
                //     log.error('AutoLevel points: ' + this.state.probingObj.length);
                //     // first point? use z as reference
                //     // same x-y position as before? Replace previous entry
                //     let index = this.state.probingObj.length - 1;
                //     if (sx === this.state.probingObj[index].x && sy === this.state.probingObj[index].y) {
                //         log.error('AutoLevel repeat position: ');
                //         this.state.referenceZ = Number(sz);
                //     }
                // }

                this.state.probingObj.push({
                    x: sx,
                    y: sy,
                    z: cz,
                    pz: sz
                });
                log.info('AutoLevel obj : ' + JSON.stringify(this.state.probingObj));
            }
        }
        //log.log(INFO, 'AutoLevel render before return');

        return (
            <div>
                <div className="form-group">
                    <div className="row no-gutters">
                        <div>
                            <ReactTable
                                data={this.state.probingObj}
                                columns={probingColumns}
                                defaultPageSize={10}
                            />
                        </div>
                        <div>
                            <button onClick={this.clearGrid}>Clear</button>
                            <button onClick={this.handleClickSave}>Save</button>
                        </div>
                    </div>
                </div>
                <div className="row no-gutters">
                    <div className="col-xs-12">
                        <button
                            type="button"
                            className="btn btn-sm btn-default"
                            onClick={() => {
                                actions.openModal(MODAL_PREVIEW);
                            }}
                            disabled={false}
                        >
                            Make Probe File
                        </button>
                    </div>
                    <div className="col-xs-12">
                        <button
                            type="button"
                            className="btn btn-sm btn-default"
                            onClick={() => {
                                actions.openModal2(MODAL_PREVIEW2);
                            }}
                            disabled={false}
                        >
                            Apply Autolevel
                        </button>
                    </div>
                </div>
            </div >
        );
    }
}

export default AutoLevel;
