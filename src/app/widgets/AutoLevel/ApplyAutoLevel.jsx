import PropTypes from 'prop-types';
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

    fileInputEl = null;

    handleClickUpload = (event) => {
        this.fileInputEl.value = null;
        this.fileInputEl.click();
    };

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
                        onChange={this.handleChangeFile}
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
                                title={i18n._('Upload G-code')}
                                onClick={this.handleClickUpload}
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
                                onClick={this.handleClickUpload}
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
