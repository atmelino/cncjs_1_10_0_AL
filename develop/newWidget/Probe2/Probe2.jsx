import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import i18n from 'app/lib/i18n';
import {
    MODAL_PREVIEW
} from './constants';

class Probe2 extends PureComponent {
    static propTypes = {
        state: PropTypes.object,
        actions: PropTypes.object
    };

    render() {
        const { state, actions } = this.props;

        return (
            <div>
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
                            {i18n._('Probe2')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default Probe2;
