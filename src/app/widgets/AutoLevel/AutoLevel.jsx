import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import numeral from 'numeral';
import ReactTable from 'react-table';
import './react-table.css';
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

    state = {
        probingObj: [],
        probingMatrix: [],
        referenceZ: 0.0
    };

    clearGrid = () => {
        log.info('AutoLevel clearGrid');
        this.setState({
            probingObj: [],
            probingMatrix: [],
            referenceZ: 0.0
        });
    };

    downloadableCSV = (rows) => {
        let content = '';
        rows.forEach((row, index) => {
            content += row.join(',') + '\n';
        });
        return content;
    }

    download = (content, fileName, contentType) => {
        var a = document.createElement('a');
        var file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }

    handleClickSave = () => {
        let fileName = Date.now() + 'probedata.rpf';
        let fileContent = JSON.stringify(this.state.probingObj);
        //log.info('AutoLevel fileContent=' + fileContent);
        this.download(fileContent, fileName, 'text/plain');

        fileContent = this.downloadableCSV(this.state.probingMatrix);
        fileName = 'probedata.csv';
        this.download(fileContent, fileName, 'text/plain');
    }

    simulateProbing = () => {
        const { state, actions } = this.props;
        const { startX, endX, startY, endY, stepX, stepY } = state;
        // log.info('AutoLevel simulateProbing state : ' + JSON.stringify(state));
        log.info('AutoLevel simulateProbing startX, endX, startY, endY, stepX, stepY : ' + startX + ' ' + endX + ' ' + startY + ' ' + endY + ' ' + stepX + ' ' + stepY);
        let row = [];
        let simProbingObj = [];
        let r = 70;
        let x0 = (endX + startX) / 2;
        let y0 = (endY + startY) / 2;
        log.info(' AutoLevel simulateProbing x0,y0: ' + x0 + ' ' + y0);
        let z0 = -56;
        let cz = 0;
        for (let y = startY; y <= endY; y += stepY) {
            for (let x = startX; x <= endX; x += stepX) {
                let sx = x;
                let sy = y;
                let sq1 = r * r - (x - x0) * (x - x0) - (y - y0) * (y - y0);
                if (sq1 > 0) {
                    cz = Math.sqrt(sq1) + z0;
                } else {
                    cz = 0;
                }
                if (cz < 0) {
                    cz = 0;
                }
                let sz = 3;
                //log.info('AutoLevel x y z: ' + sx + ' ' + sy + ' ' + cz);
                simProbingObj.push({
                    x: sx,
                    y: sy,
                    z: cz,
                    pz: sz
                });
                row.push(cz);
            }
            this.state.probingMatrix.push(row);
            row = [];
        }
        //log.info('AutoLevel simProbingObj : ' + JSON.stringify(simProbingObj));
        //log.info('AutoLevel matrix : ' + JSON.stringify(this.state.probingMatrix));
        this.setState({
            probingObj: simProbingObj,
            referenceZ: 0.0
        });
    }

    render() {
        //log.info( 'AutoLevel render called');

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
            //log.info('AutoLevel :' + JSON.stringify(state));
            //log.error('AutoLevel :' + JSON.stringify(state.probingData));
            //log.error('AutoLevel :' + JSON.stringify(state.probingData.result));
            if (state.probingData.printed === false) {
                state.probingData.printed = true;
                //log.error('AutoLevel result :' + JSON.stringify(state.probingData.result));
                log.info('AutoLevel result :' + JSON.stringify(state.probingData.result));

                let sx = state.probingData.result.x;
                let sy = state.probingData.result.y;
                let sz = state.probingData.result.z;

                // first data point becomes z reference
                if (this.state.probingObj.length === 0) {
                    this.state.referenceZ = Number(sz);
                }

                // correct new z entry for autolevel plane
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
                //log.info('AutoLevel probingObj : ' + JSON.stringify(this.state.probingObj));
            }
        }
        //log.info( 'AutoLevel render before return');

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
                            <button onClick={this.simulateProbing}>Simulate</button>
                        </div>
                    </div>
                </div>
                <div className="row no-gutters">
                    <div className="col-sm-6">
                        <button
                            type="button"
                            className="btn btn-sm btn-default"
                            onClick={() => {
                                actions.openModal(MODAL_PREVIEW);
                            }}
                            disabled={false}
                        >
                            Probing Setup
                        </button>
                    </div>
                    <div className="col-sm-6">
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
