import PropTypes from 'prop-types';
import pick from 'lodash/pick';
import React, { PureComponent } from 'react';
import Modal from 'app/components/Modal';
import i18n from 'app/lib/i18n';
import { TRACE, DEBUG, INFO, WARN, ERROR } from 'universal-logger';
import log from '../../lib/log';

class ApplyAutoLevel extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    state = {
        probingFileName: '- none -',
        gcodeFileName: '- none -',
    }

    fields = {
        name: null,
        password: null
    };

    alFileNamePrefix = '#AL:'

    probedPoints = [];

    gcode = '';

    choice = null;

    fileInputEl = null;

    handleClickUpload = (param) => {
        this.choice = param;
        log.log(INFO, 'ApplyAutoLevel.jsx handleClickUpload choice=' + this.choice);
        this.fileInputEl.value = null;
        this.fileInputEl.click();
    };

    handleLoadFile = (event) => {
        log.log(INFO, 'ApplyAutoLevel.jsx handleLoadFile choice=' + this.choice);
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
            log.error('ApplyAutoLevel.jsx handleLoadFile error reading file');
        }
    };

    readProbingFile = (contents) => {
        //log.log(INFO, 'ApplyAutoLevel.jsx readProbingFile result \n' + contents);
        // this.probedPoints = [];
        this.probedPoints = JSON.parse(contents);
        log.log(INFO, 'ApplyAutoLevel.jsx readProbingFile probedPoints \n' + JSON.stringify(this.probedPoints));
        //log.log(INFO, 'ApplyAutoLevel.jsx readProbingFile probedPoints length \n' + this.probedPoints.length);
        //log.log(INFO, 'ApplyAutoLevel.jsx readProbingFile probedPoints[3].z \n' + this.probedPoints[3].z);
    }

    readGcodeFile = (contents) => {
        log.log(INFO, 'ApplyAutoLevel.jsx gcodeFile  \n' + contents);
        this.gcode = contents;
    }

    autolevel = (contents) => {
        log.log(INFO, 'ApplyAutoLevel.jsx autolevel \n');
        this.applyCompensation();
    }

    applyCompensation() {
        log.log(INFO, 'ApplyAutoLevel.jsx applyCompensation AL: applying compensation ...\n');
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
            lines.forEach(line => {
                //log.log(INFO, 'ApplyAutoLevel.jsx applyCompensation process line' + line);
                let lineStripped = this.stripComments(line);
                if (!/(X|Y|Z)/gi.test(lineStripped)) {
                    result.push(lineStripped); // no coordinate change --> copy to output
                } else {
                    //log.log(INFO, 'else');
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
                            log.log(INFO, 'WARNING: using relative mode may not produce correct results');
                        }
                        p0 = {
                            x: pt.x,
                            y: pt.y,
                            z: pt.z
                        }; // clone
                    }
                }
            });
            const newgcodeFileName = this.alFileNamePrefix + this.state.gcodeFileName;
            //log.log(INFO, 'ApplyAutoLevel.jsx applyCompensation AL: loading new gcode' + newgcodeFileName);
            log.log(INFO, 'ApplyAutoLevel.jsx applyCompensation AL: new gcode' + result.join('\n'));
            //this.sckw.loadGcode(newgcodeFileName, result.join('\n'))
            log.log(INFO, 'ApplyAutoLevel.jsx applyCompensation AL: finished');
            let fileName = newgcodeFileName;
            let fileContent = result.join('\n');
            this.download(fileContent, fileName, 'text/plain');
        } catch (x) {
            log.log(INFO, 'ApplyAutoLevel.jsx applyCompensation AL: error occurred' + x);
        }
        log.log(INFO, 'ApplyAutoLevel.jsx applyCompensation Leveling applied\n');
    }

    download = (content, fileName, contentType) => {
        var a = document.createElement('a');
        var file = new Blob([content], { type: contentType });
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
        let res = [];
        let v = this.sub3(p2, p1); // delta
        let dist = Math.sqrt(this.distanceSquared3(p1, p2)); // distance
        let dir = {
            x: v.x / dist,
            y: v.y / dist,
            z: v.z / dist
        }; // direction vector
        let maxSegLength = this.delta / 2;
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
            console.log('Cant find 3 closest points');
            return pt;
        }
        let normal = this.crossProduct3(this.sub3(points[1], points[0]), this.sub3(points[2], points[0]));
        let pp = points[0];// point on plane
        let dz = 0; // compensation delta
        if (normal.z !== 0) {
            // find z at the point seg, on the plane defined by three points
            dz = pp.z - (normal.x * (pt.x - pp.x) + normal.y * (pt.y - pp.y)) / normal.z;
        } else {
            console.log(this.formatPt(pt), 'normal.z is zero', this.formatPt(points[0]), this.formatPt(points[1]), this.formatPt(points[2]));
        }
        return {
            x: pt.x,
            y: pt.y,
            z: pt.z + dz
        };
    }

    render() {
        const { state, actions } = this.props;
        const { startX, endX, startY, endY, stepX, stepY, feedXY, feedZ, depth, height } = state;
        //log.setLevel(TRACE);
        //log.log(INFO, 'MakeProbeFile render:' + JSON.stringify(state));

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
                    <div className="row row-no-gutters">
                        <div className="col-sm-2">
                            <label className="control-label">{i18n._('Probing Data:')}</label>
                        </div>
                        <div className="col-sm-8">
                            <label className="control-label">
                                {this.state.probingFileName}
                            </label>
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
                    <div className="row row-no-gutters">
                        <div className="col-sm-2">
                            <label className="control-label">{i18n._('Original G-Code:')}</label>
                        </div>
                        <div className="col-sm-8">
                            <label className="control-label">
                                {this.state.gcodeFileName}
                            </label>
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
                            this.autolevel('hello');
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
