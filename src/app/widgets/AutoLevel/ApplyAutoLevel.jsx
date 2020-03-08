import _max from 'lodash/max';
import PropTypes from 'prop-types';
import pick from 'lodash/pick';
import React, { PureComponent } from 'react';
import Modal from 'app/components/Modal';
import i18n from 'app/lib/i18n';
import log from '../../lib/log';
import { TINYG_MACHINE_STATE_ALARM } from '../../constants';

class ApplyAutoLevel extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    state = {
        probingFileName: '- none -',
        step: 0,
        gcodeFileName: '- none -',
        mediaSource: 1,
        hideFile: false,
        probingXmin: 1,
        probingXmax: 2,
        probingYmin: 3,
        probingYmax: 4,
        origXmin: 5,
        origXmax: 6,
        origYmin: 7,
        origYmax: 8
    }

    alFileNamePrefix = '#AL:'

    probedPoints = [];

    //gcode = '';

    choice = null;

    fileInputEl = null;

    delta = 10;

    componentDidMount() {
        const { state, actions } = this.props;

        //log.info('ApplyAutoLevel componentDidMount');
        this.probedPoints = state.probingObj;
        log.info('ApplyAutoLevel componentDidMount probedPoints \n' + JSON.stringify(this.probedPoints));
        // log.info('ApplyAutoLevel componentDidMount probedPoints \n' + _({ "a": 4, "b": 0.5, "c": 0.35, "d": 5 }).values().max());
        //const max = _max(this.probedPoints);
        //let result = this.probedPoints.map((y) => y);
        // let result = this.probedPoints.map((o) => {
        //     return o.y;
        // });
        // let maxValue = Math.max.apply(null, result);
        // this.setState({ probingYmax: maxValue });
        // log.info('ApplyAutoLevel componentDidMount probedPoints y=' + result);
        // log.info('ApplyAutoLevel componentDidMount probedPoints max=' + maxValue);
        this.updateMinMax();
    }

    updateMinMax() {
        let xArray = this.probedPoints.map((o) => {
            return o.x;
        });
        let yArray = this.probedPoints.map((o) => {
            return o.y;
        });
        this.setState({
            probingXmin: Math.min.apply(null, xArray),
            probingXmax: Math.max.apply(null, xArray),
            probingYmin: Math.min.apply(null, yArray),
            probingYmax: Math.max.apply(null, yArray)
        });
    }

    handleClickUpload = (param) => {
        this.choice = param;
        //log.info( 'ApplyAutoLevel handleClickUpload choice=' + this.choice);
        this.fileInputEl.value = null;
        this.fileInputEl.click();
    };

    handleLoadFile = (event) => {
        //log.info( 'ApplyAutoLevel handleLoadFile choice=' + this.choice);
        const { actions } = this.props;
        const files = event.target.files;
        const file = files[0];
        const reader = new FileReader();
        reader.onloadend = (event) => {
            const { result, error } = event.target;

            if (error) {
                log.error(error);
                return;
            }

            log.debug('FileReader:', pick(file, [
                'lastModified',
                'lastModifiedDate',
                'meta',
                'name',
                'size',
                'type'
            ]));

            let contents = event.target.result;
            if (this.choice === 1) {
                this.setState({ probingFileName: file.name });
                this.readProbingFile(contents);
            }
            if (this.choice === 2) {
                this.setState({ gcodeFileName: file.name });
                this.readGcodeFile(contents);
            }
        };

        try {
            reader.readAsText(file);
        } catch (err) {
            log.error('ApplyAutoLevel handleLoadFile error reading file');
        }
    };

    readProbingFile = (contents) => {
        //log.info( 'ApplyAutoLevel readProbingFile result \n' + contents);
        this.probedPoints = JSON.parse(contents);
        this.delta = this.probedPoints[1].x - this.probedPoints[0].x;
        log.info('ApplyAutoLevel step=' + this.delta);
        this.setState({ step: this.delta });

        log.info('ApplyAutoLevel readProbingFile probedPoints \n' + JSON.stringify(this.probedPoints));
        //log.info( 'ApplyAutoLevel readProbingFile probedPoints length \n' + this.probedPoints.length);
        //log.info( 'ApplyAutoLevel readProbingFile probedPoints[3].z \n' + this.probedPoints[3].z);
        this.updateMinMax();
    }

    readGcodeFile = (contents) => {
        //log.info('ApplyAutoLevel gcodeFile  \n' + contents);
        this.gcode = contents;
    }

    autolevelSave = (contents) => {
        const { state, actions } = this.props;

        log.info('ApplyAutoLevel autolevelSave \n');
        this.applyCompensation();
        log.info('ApplyAutoLevel autolevelSave state.ALgcode \n' + state.ALgcode);
        const newgcodeFileName = this.alFileNamePrefix + this.state.gcodeFileName;
        //log.info( 'ApplyAutoLevel autolevelSave AL: loading new gcode' + newgcodeFileName);
        //log.info('ApplyAutoLevel autolevelSave AL: new gcode' + result.join('\n'));
        let fileName = newgcodeFileName;
        let fileContent = state.ALgcode.join('\n');
        this.download(fileContent, fileName, 'text/plain');
    }

    autolevelUpload = (contents) => {
        const { state, actions } = this.props;
        this.applyCompensation();
        log.info('ApplyAutoLevel autolevelUpload state.ALgcode \n' + state.ALgcode);
        actions.loadAutoLevelledGcode('hello');
    }

    applyCompensation() {
        log.info('ApplyAutoLevel applyCompensation AL: applying compensation ...\n');
        const { state, actions } = this.props;

        try {
            let lines = this.gcode.split('\n');
            let p0 = {
                x: 0,
                y: 0,
                z: 0
            };
            let pt = {
                x: 0,
                y: 0,
                z: 0
            };

            let abs = true;
            let result = [];
            lines.forEach((line, index) => {
                //log.info('ApplyAutoLevel applyCompensation line ' + index + '\n' + line);
                let lineStripped = this.stripComments(line);
                if (!/(X|Y|Z)/gi.test(lineStripped)) {
                    result.push(lineStripped); // no coordinate change --> copy to output
                } else {
                    //log.info( 'else');
                    let f = 1;
                    if (/(G38.+|G5.+|G10|G2.+|G4.+|G92|G92.1)/gi.test(lineStripped)) {
                        result.push(lineStripped); // skip compensation for these G-Codes
                    } else {
                        if (/G91/i.test(lineStripped)) {
                            abs = false;
                        }
                        if (/G90/i.test(lineStripped)) {
                            abs = true;
                        }
                        let xMatch = /X([\.\+\-\d]+)/gi.exec(lineStripped);
                        if (xMatch) {
                            pt.x = parseFloat(xMatch[1]);
                        }
                        let yMatch = /Y([\.\+\-\d]+)/gi.exec(lineStripped);
                        if (yMatch) {
                            pt.y = parseFloat(yMatch[1]);
                        }
                        let zMatch = /Z([\.\+\-\d]+)/gi.exec(lineStripped);
                        if (zMatch) {
                            pt.z = parseFloat(zMatch[1]);
                        }

                        if (abs) {
                            // strip coordinates
                            lineStripped = lineStripped.replace(/([XYZ])([\.\+\-\d]+)/gi, '');
                            let segs = this.splitToSegments(p0, pt);
                            for (let seg of segs) {
                                let cpt = this.compensateZCoord(seg);
                                let newLine = lineStripped + ` X${cpt.x.toFixed(3)} Y${cpt.y.toFixed(3)} Z${cpt.z.toFixed(3)} ; Z${seg.z.toFixed(3)}`;
                                result.push(newLine.trim());
                            }
                        } else {
                            result.push(lineStripped);
                            log.info('WARNING: using relative mode may not produce correct results');
                        }
                        p0 = {
                            x: pt.x,
                            y: pt.y,
                            z: pt.z
                        }; // clone
                    }
                }
            });
            log.info('ApplyAutoLevel applyCompensation AL: finished');
            state.ALgcode = result;
        } catch (x) {
            log.info('ApplyAutoLevel applyCompensation AL: error occurred' + x);
        }
        log.info('ApplyAutoLevel applyCompensation Leveling applied\n');
    }

    download = (content, fileName, contentType) => {
        let a = document.createElement('a');
        let file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }

    stripComments(line) {
        const re1 = new RegExp(/\s*\([^\)]*\)/g); // Remove anything inside the parentheses
        const re2 = new RegExp(/\s*;.*/g); // Remove anything after a semi-colon to the end of the line, including preceding spaces
        const re3 = new RegExp(/\s+/g);
        return (line.replace(re1, '').replace(re2, '').replace(re3, ''));
    }

    distanceSquared3(p1, p2) {
        return (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y) + (p2.z - p1.z) * (p2.z - p1.z);
    }

    distanceSquared2(p1, p2) {
        return (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
    }

    crossProduct3(u, v) {
        return {
            x: (u.y * v.z - u.z * v.y),
            y: -(u.x * v.z - u.z * v.x),
            z: (u.x * v.y - u.y * v.x)
        };
    }

    isColinear(u, v) {
        return Math.abs(u.x * v.y - u.y * v.x) < 0.00001;
    }

    sub3(p1, p2) {
        return {
            x: p1.x - p2.x,
            y: p1.y - p2.y,
            z: p1.z - p2.z
        };
    }

    formatPt(pt) {
        return `(x:${pt.x.toFixed(3)} y:${pt.y.toFixed(3)} z:${pt.z.toFixed(3)})`;
    }

    splitToSegments(p1, p2) {
        //log.info('ApplyAutoLevel delta=' + this.delta);
        let res = [];
        let v = this.sub3(p2, p1); // delta
        let dist = Math.sqrt(this.distanceSquared3(p1, p2)); // distance
        let dir = {
            x: v.x / dist,
            y: v.y / dist,
            z: v.z / dist
        }; // direction vector
        let maxSegLength = this.delta / 2;
        //log.info('ApplyAutoLevel maxSegLength=' + maxSegLength);
        res.push({
            x: p1.x,
            y: p1.y,
            z: p1.z
        });// first point
        for (let d = maxSegLength; d < dist; d += maxSegLength) {
            res.push({
                x: p1.x + dir.x * d,
                y: p1.y + dir.y * d,
                z: p1.z + dir.z * d
            });// split points
        }
        res.push({
            x: p2.x,
            y: p2.y,
            z: p2.z
        }); // last point
        //log.info('ApplyAutoLevel res:' + JSON.stringify(res));
        return res;
    }

    getThreeClosestPoints(pt) {
        let res = [];
        if (this.probedPoints.length < 3) {
            return res;
        }
        this.probedPoints.sort((a, b) => {
            return this.distanceSquared2(a, pt) < this.distanceSquared2(b, pt) ? -1 : 1;
        });
        let i = 0;
        while (res.length < 3 && i < this.probedPoints.length) {
            if (res.length === 2) {
                // make sure points are not colinear
                if (!this.isColinear(this.sub3(res[1], res[0]), this.sub3(this.probedPoints[i], res[0]))) {
                    res.push(this.probedPoints[i]);
                }
            } else {
                res.push(this.probedPoints[i]);
            }
            i++;
        }
        return res;
    }

    compensateZCoord(pt) {
        let points = this.getThreeClosestPoints(pt);
        if (points.length < 3) {
            log.error('Cant find 3 closest points');
            return pt;
        }
        let normal = this.crossProduct3(this.sub3(points[1], points[0]), this.sub3(points[2], points[0]));
        let pp = points[0];// point on plane
        let dz = 0; // compensation delta
        if (normal.z !== 0) {
            // find z at the point seg, on the plane defined by three points
            dz = pp.z - (normal.x * (pt.x - pp.x) + normal.y * (pt.y - pp.y)) / normal.z;
        } else {
            log.error(this.formatPt(pt), 'normal.z is zero', this.formatPt(points[0]), this.formatPt(points[1]), this.formatPt(points[2]));
        }
        return {
            x: pt.x,
            y: pt.y,
            z: pt.z + dz
        };
    }

    handleUseCurrent() {
        const { state, actions } = this.props;

        this.probedPoints = state.probingObj;
        log.info('ApplyAutoLevel handleUseCurrent probedPoints \n' + JSON.stringify(this.probedPoints));
        this.setState({ hideFile: false });
        this.updateMinMax();
    }

    handleUseFile() {
        this.setState({ hideFile: true });
        this.setState({ probingFileName: '- none -' });
    }

    render() {
        const { state, actions } = this.props;
        const { probingXmin, probingXmax, probingYmin, probingYmax } = state;
        const { canClick } = state;
        const {
            mediaSource
        } = this.state;
        const displayUnits = i18n._('mm');

        const mystyle = this.state.hideFile ? {} : { display: 'none' };
        //log.info('ApplyAutoLevel render:' + JSON.stringify(state));
        //log.info('ApplyAutoLevel render:' + JSON.stringify(state.probingObj));

        return (
            <Modal disableOverlay size="sm" onClose={actions.closeModal}>
                <Modal.Header>
                    <Modal.Title>{i18n._('Apply Autolevel')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <input
                        // The ref attribute adds a reference to the component to
                        // this.refs when the component is mounted.
                        ref={(node) => {
                            this.fileInputEl = node;
                        }}
                        type="file"
                        style={{ display: 'none' }}
                        multiple={false}
                        onChange={this.handleLoadFile}
                    />

                    <div className="form-group">
                        <label><strong>{i18n._('Probing Data:')}</strong></label>
                        <div className="radio" style={{ marginTop: 0 }}>
                            <label>
                                <input
                                    type="radio"
                                    name="mediaSource"
                                    value={3}
                                    checked={mediaSource === 1}
                                    onChange={() => {
                                        this.setState({ mediaSource: 1 });
                                        this.handleUseCurrent();
                                    }}
                                />
                                {i18n._('Use current probing data')}
                            </label>
                        </div>
                        <div className="radio">
                            <label>
                                <input
                                    type="radio"
                                    name="mediaSource"
                                    value={1}
                                    checked={mediaSource === 2}
                                    onChange={() => {
                                        this.setState({ mediaSource: 2 });
                                        this.handleUseFile();
                                    }}
                                />
                                {i18n._('Use a file')}
                            </label>
                        </div>
                        <div
                            className="row row-no-gutters"
                            style={mystyle}
                        >
                            <div style={{ marginLeft: 20 }}>
                                <div className="col-sm-10">
                                    <input
                                        type="url"
                                        className="form-control"
                                        disabled={true}
                                        placeholder={this.state.probingFileName}
                                    />
                                </div>
                                <div className="col-sm-2">
                                    <button
                                        type="button"
                                        className="btn btn-default"
                                        title={i18n._('Upload Probing Data')}
                                        onClick={() => this.handleClickUpload(1)}
                                    >
                                        {i18n._('Select')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row no-gutters">
                        <div className="col-xs-3">
                            <label className="control-label">{i18n._('Xmin')}</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    disabled={true}
                                    className="form-control"
                                    placeholder={this.state.probingXmin}
                                />
                            </div>
                        </div>
                        <div className="col-xs-3">
                            <label className="control-label">{i18n._('Xmax')}</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    disabled={true}
                                    className="form-control"
                                    placeholder={this.state.probingXmax}
                                />
                            </div>
                        </div>
                        <div className="col-xs-3">
                            <label className="control-label">{i18n._('Ymin')}</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    disabled={true}
                                    className="form-control"
                                    placeholder={this.state.probingYmin}
                                />
                            </div>
                        </div>
                        <div className="col-xs-3">
                            <label className="control-label">{i18n._('Ymax')}</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    disabled={true}
                                    className="form-control"
                                    placeholder={this.state.probingYmax}
                                />
                            </div>
                        </div>
                    </div>
                    <label><strong>{i18n._('Original G-Code:')}</strong></label>
                    <div className="row row-no-gutters">
                        <div style={{ marginLeft: 20 }}>
                            <div className="col-sm-10">
                                <input
                                    type="url"
                                    className="form-control"
                                    disabled={true}
                                    placeholder={this.state.gcodeFileName}
                                />
                            </div>
                            <div className="col-sm-2">
                                <button
                                    type="button"
                                    className="btn btn-default"
                                    title={i18n._('Upload G-code')}
                                    onClick={() => this.handleClickUpload(2)}
                                >
                                    {i18n._('Select')}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="row no-gutters">
                        <div className="col-xs-3">
                            <label className="control-label">{i18n._('Xmin')}</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    disabled={true}
                                    className="form-control"
                                    placeholder={this.state.origXmin}
                                />
                            </div>
                        </div>
                        <div className="col-xs-3">
                            <label className="control-label">{i18n._('Xmax')}</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    disabled={true}
                                    className="form-control"
                                    placeholder={this.state.origXmax}
                                />
                            </div>
                        </div>
                        <div className="col-xs-3">
                            <label className="control-label">{i18n._('Ymin')}</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    disabled={true}
                                    className="form-control"
                                    placeholder={this.state.origYmin}
                                />
                            </div>
                        </div>
                        <div className="col-xs-3">
                            <label className="control-label">{i18n._('Ymax')}</label>
                            <div className="input-group input-group-sm">
                                <input
                                    type="text"
                                    disabled={true}
                                    className="form-control"
                                    placeholder={this.state.origYmax}
                                />
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button
                        type="button"
                        className="btn btn-default"
                        onClick={actions.closeModal}
                    >
                        {i18n._('Cancel')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                            actions.closeModal();
                            this.autolevelUpload('hello');
                        }}
                        disabled={!canClick}
                    >
                        {i18n._('Upload G-Code')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                            actions.closeModal();
                            this.autolevelSave('hello');
                        }}
                    >
                        {i18n._('Make File')}
                    </button>
                </Modal.Footer>
            </Modal >
        );
    }
}

export default ApplyAutoLevel;
