import React, { Component } from 'react';
import { Size } from "../utils/types";
import { getStoredBool, getStoredSize, setStoredBool, setStoredValue } from "../utils/localStorage";
import '../css/options.css'

export type OptionsProps = {
    onChangeFn?: VoidFunction,
};

type OptionsState = {
    size: Size,
    lockWhenSolved: boolean,
    colorfulLineCounters: boolean,
    countdownCounters: boolean,
};

export class Options extends Component<OptionsProps, OptionsState> {
    constructor(props: OptionsProps) {
        super(props);
        this.state = {
            size: getStoredSize(),
            lockWhenSolved: getStoredBool('lockWhenSolved'),
            colorfulLineCounters: getStoredBool('colorfulLineCounters'),
            countdownCounters: getStoredBool('countdownCounters'),
        }
    }

    setHeight = (event: React.ChangeEvent<HTMLInputElement>) => {
        const height = +event.target.value;
        this.setState({ size: { height: height, width: this.state.size.width } }, this.props.onChangeFn);
        if (Number.isInteger(height) && height > 1) setStoredValue('height', height.toString());
    }

    setWidth = (event: React.ChangeEvent<HTMLInputElement>) => {
        const width = +event.target.value;
        if (Number.isInteger(width) && width > 1) setStoredValue('width', width.toString());
        this.setState({ size: { width: width, height: this.state.size.height } }, this.props.onChangeFn);
    }

    setCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = event.target;
        setStoredBool(name, checked);
        // @ts-ignore — dynamic key with setState partial is a known React typing gap
        this.setState({ [name]: checked }, () => {
            if (this.props.onChangeFn) this.props.onChangeFn();
        });
    }

    render() {
        return (
            <div className={'options'}>

                <div className={'options__section'}>
                    <h3 className={'options__section-title'}>Board Size</h3>
                    <div className={'options__size-row'}>
                        <label className={'options__size-label'}>
                            Height
                            <input onChange={this.setHeight} value={this.state.size.height}
                                className={'options__size-input'} key={'height'}
                                type={'number'} min={2} max={50} />
                        </label>
                        <span className={'options__size-sep'}>&times;</span>
                        <label className={'options__size-label'}>
                            Width
                            <input onChange={this.setWidth} value={this.state.size.width}
                                className={'options__size-input'} key={'width'}
                                type={'number'} min={2} max={50} />
                        </label>
                    </div>
                </div>

                <div className={'options__section'}>
                    <h3 className={'options__section-title'}>Gameplay</h3>

                    <label className={'options__toggle'}>
                        <span className={'options__toggle-label'}>Lock puzzle when solved</span>
                        <input type={'checkbox'} name={'lockWhenSolved'}
                            checked={this.state.lockWhenSolved} onChange={this.setCheckbox} />
                        <span className={'options__toggle-switch'} />
                    </label>

                    <label className={'options__toggle'}>
                        <span className={'options__toggle-label'}>Color wall counters on completion</span>
                        <input type={'checkbox'} name={'colorfulLineCounters'}
                            checked={this.state.colorfulLineCounters} onChange={this.setCheckbox} />
                        <span className={'options__toggle-switch'} />
                    </label>

                    <label className={'options__toggle'}>
                        <span className={'options__toggle-label'}>Show remaining wall count (instead of total)</span>
                        <input type={'checkbox'} name={'countdownCounters'}
                            checked={this.state.countdownCounters} onChange={this.setCheckbox} />
                        <span className={'options__toggle-switch'} />
                    </label>
                </div>

                <p className={'options__note'}>Start a new game for size changes to take effect.</p>
            </div>
        );
    }
}

export default { Options };