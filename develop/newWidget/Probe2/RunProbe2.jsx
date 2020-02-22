import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Modal from 'app/components/Modal';
import ToggleSwitch from 'app/components/ToggleSwitch';
import i18n from 'app/lib/i18n';

class RunProbe2 extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    render() {
        const { state, actions } = this.props;
        const { useTLO } = state;
        const probeCommands = ['Saab', 'Volvo', 'BMW'];
        const content = probeCommands.join('\n');

        return (
            <Modal disableOverlay size="sm" onClose={actions.closeModal}>
                <Modal.Header>
                    <Modal.Title>{i18n._('Probe2')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div style={{ marginBottom: 10 }}>
                        <ToggleSwitch
                            checked={useTLO}
                            size="sm"
                            onChange={actions.toggleUseTLO}
                        />
                        {i18n._('Apply tool length offset')}
                    </div>
                    <pre style={{ minHeight: 240 }}>
                        <code>{content}</code>
                    </pre>
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
                            actions.runProbe2Commands(probeCommands);
                        }}
                    >
                        {i18n._('Run Probe2')}
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default RunProbe2;
