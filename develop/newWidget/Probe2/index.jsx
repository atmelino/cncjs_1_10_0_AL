import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Space from 'app/components/Space';
import Widget from 'app/components/Widget';
import i18n from 'app/lib/i18n';
import { TRACE, DEBUG, INFO, WARN, ERROR } from 'universal-logger';
import log from '../../lib/log';
import WidgetConfig from '../WidgetConfig';
import Probe2 from './Probe2';
import RunProbe2 from './RunProbe2';
import {
    MODAL_NONE,
    MODAL_PREVIEW
} from './constants';
import styles from './index.styl';


class Probe2Widget extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        onFork: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,
        sortable: PropTypes.object
    };

    // Public methods
    collapse = () => {
        this.setState({ minimized: true });
    };

    expand = () => {
        this.setState({ minimized: false });
    };

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    actions = {
        toggleFullscreen: () => {
            const { minimized, isFullscreen } = this.state;
            this.setState({
                minimized: isFullscreen ? minimized : false,
                isFullscreen: !isFullscreen
            });
        },
        toggleMinimized: () => {
            const { minimized } = this.state;
            this.setState({ minimized: !minimized });
        },
        openModal: (name = MODAL_NONE, params = {}) => {
            this.setState({
                modal: {
                    name: name,
                    params: params
                }
            });
        },
        closeModal: () => {
            this.setState({
                modal: {
                    name: MODAL_NONE,
                    params: {}
                }
            });
        },
        updateModalParams: (params = {}) => {
            this.setState({
                modal: {
                    ...this.state.modal,
                    params: {
                        ...this.state.modal.params,
                        ...params
                    }
                }
            });
        },
        toggleUseTLO: () => {
            const { useTLO } = this.state;
            this.setState({ useTLO: !useTLO });
        },
        runProbe2Commands: (commands) => {
            log.setLevel(TRACE);
            log.log(INFO, './src/app/widgets/Probe2/index.jsx modal dialog closed, runProbe2Commands called');
        }
    };

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            minimized
        } = this.state;

        this.config.set('minimized', minimized);

        const { useTLO } = this.state;
        this.config.set('useTLO', useTLO);
    }

    getInitialState() {
        return {
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            modal: {
                name: MODAL_NONE,
                params: {}
            },
            useTLO: this.config.get('useTLO'),
        };
    }

    render() {
        const { widgetId } = this.props;
        const { minimized, isFullscreen } = this.state;
        const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
        const state = {
            ...this.state
        };
        const actions = {
            ...this.actions
        };

        return (
            <Widget fullscreen={isFullscreen}>
                <Widget.Header>
                    <Widget.Title>
                        <Widget.Sortable className={this.props.sortable.handleClassName}>
                            <i className="fa fa-bars" />
                            <Space width="8" />
                        </Widget.Sortable>
                        {isForkedWidget &&
                            <i className="fa fa-code-fork" style={{ marginRight: 5 }} />
                        }
                        {i18n._('Probe2')}
                    </Widget.Title>
                    <Widget.Controls className={this.props.sortable.filterClassName}>
                        <Widget.Button
                            disabled={isFullscreen}
                            title={minimized ? i18n._('Expand') : i18n._('Collapse')}
                            onClick={actions.toggleMinimized}
                        >
                            <i
                                className={classNames(
                                    'fa',
                                    { 'fa-chevron-up': !minimized },
                                    { 'fa-chevron-down': minimized }
                                )}
                            />
                        </Widget.Button>
                        <Widget.DropdownButton
                            title={i18n._('More')}
                            toggle={<i className="fa fa-ellipsis-v" />}
                            onSelect={(eventKey) => {
                                if (eventKey === 'fullscreen') {
                                    actions.toggleFullscreen();
                                } else if (eventKey === 'fork') {
                                    this.props.onFork();
                                } else if (eventKey === 'remove') {
                                    this.props.onRemove();
                                }
                            }}
                        >
                            <Widget.DropdownMenuItem eventKey="fullscreen">
                                <i
                                    className={classNames(
                                        'fa',
                                        'fa-fw',
                                        { 'fa-expand': !isFullscreen },
                                        { 'fa-compress': isFullscreen }
                                    )}
                                />
                                <Space width="4" />
                                {!isFullscreen ? i18n._('Enter Full Screen') : i18n._('Exit Full Screen')}
                            </Widget.DropdownMenuItem>
                            <Widget.DropdownMenuItem eventKey="fork">
                                <i className="fa fa-fw fa-code-fork" />
                                <Space width="4" />
                                {i18n._('Fork Widget')}
                            </Widget.DropdownMenuItem>
                            <Widget.DropdownMenuItem eventKey="remove">
                                <i className="fa fa-fw fa-times" />
                                <Space width="4" />
                                {i18n._('Remove Widget')}
                            </Widget.DropdownMenuItem>
                        </Widget.DropdownButton>
                    </Widget.Controls>
                </Widget.Header>
                <Widget.Content
                    className={classNames(
                        styles['widget-content'],
                        { [styles.hidden]: minimized }
                    )}
                >
                    {state.modal.name === MODAL_PREVIEW &&
                        <RunProbe2 state={state} actions={actions} />
                    }
                    <Probe2
                        state={state}
                        actions={actions}
                    />
                </Widget.Content>
            </Widget>
        );
    }
}

export default Probe2Widget;
