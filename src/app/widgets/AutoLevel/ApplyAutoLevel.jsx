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

    fields = {
        name: null,
        password: null
    };
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

            var contents = event.target.result;
            if (this.choice === 1) {
                this.probingFile(contents);
            }
            if (this.choice === 2) {
                this.gcodeFile(contents);
            }
        };

        try {
            reader.readAsText(file);
        } catch (err) {
            log.error('ApplyAutoLevel.jsx handleLoadProbingFile error reading file');
        }
    };

    probingFile = (contents) => {
        //log.log(INFO, 'ApplyAutoLevel.jsx handleLoadProbingFile result \n' + contents);
        let lines = contents.split('\n');
        //log.log(INFO, 'ApplyAutoLevel.jsx handleLoadProbingFile lines \n' + lines);
        //let prbm =
        this.probedPoints = [];
        lines.forEach(line => {
            let la = line.split(' ');
            let pt = {
                x: parseFloat(la[0]),
                y: parseFloat(la[1]),
                z: parseFloat(la[2])
            };
            if (pt.x) {
                //log.log(INFO, 'ApplyAutoLevel.jsx handleLoadProbingFile pt.x \n' + JSON.stringify(pt.x));
                this.probedPoints.push(pt);
            }
        });
        log.log(INFO, 'ApplyAutoLevel.jsx probingFile probedPoints \n' + JSON.stringify(this.probedPoints));
    }

    gcodeFile = (contents) => {
        log.log(INFO, 'ApplyAutoLevel.jsx gcodeFile  \n' + contents);
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
                            <label className="control-label">{i18n._('Probing Data')}</label>
                        </div>
                        <div className="col-sm-8">
                            <input
                                ref={node => {
                                    this.fields.name = node;
                                }}
                                type="text"
                                className="form-control"
                                placeholder={i18n._('')}
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
                    <div className="row row-no-gutters">
                        <div className="col-sm-2">
                            <label className="control-label">{i18n._('Original G-Code')}</label>
                        </div>
                        <div className="col-sm-8">
                            <input
                                ref={node => {
                                    this.fields.name = node;
                                }}
                                type="text"
                                className="form-control"
                                placeholder={i18n._('')}
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
                            actions.makeProbeFileCommands('hello');
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
