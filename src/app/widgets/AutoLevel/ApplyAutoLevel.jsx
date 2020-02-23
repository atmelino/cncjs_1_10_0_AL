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

    render() {
        const { state, actions } = this.props;
        const { startX, endX, startY, endY, stepX, stepY, feedXY, feedZ, depth, height } = state;
        //log.setLevel(TRACE);
        //log.log(INFO, 'MakeProbeFile render:' + JSON.stringify(state));

        const displayUnits = i18n._('mm');
        const step = 1;

        return (
            <Modal disableOverlay size="sm" onClose={actions.closeModal}>
                <Modal.Header>
                    <Modal.Title>{i18n._('Make Probing Grid File')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="row no-gutters">
                        <div className="col-xs-6" style={{ paddingRight: 5 }}>
                            <div className="form-group">
                                <label className="control-label">{i18n._('Start X')}</label>
                                <div className="input-group input-group-sm">
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={startX}
                                        placeholder="0.00"
                                        min={-200}
                                        step={step}
                                        onChange={actions.handleStartXChange}
                                    />
                                    <div className="input-group-addon">{displayUnits}</div>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-default"
                            onClick={actions.handleLoadFile}
                        >
                            {i18n._('Load G-Code')}
                        </button>

                        <div className="col-xs-6" style={{ paddingLeft: 5 }}>
                            <div className="form-group">
                                <label className="control-label">{i18n._('End X')}</label>
                                <div className="input-group input-group-sm">
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={endX}
                                        placeholder="0.00"
                                        min={0}
                                        step={step}
                                        onChange={actions.handleEndXChange}
                                    />
                                    <span className="input-group-addon">{displayUnits}</span>
                                </div>
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
                            actions.makeProbeFileCommands('hello');
                        }}
                    >
                        {i18n._('Make File')}
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default ApplyAutoLevel;
