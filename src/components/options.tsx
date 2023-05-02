import React, {Component} from 'react';
import {Size} from "../boardgen/types";
import {getStoredBool, getStoredSize, setStoredBool, setStoredValue} from "../localStorage";

import '../css/options.css'

export type OptionsProps = {
    onChangeFn?: VoidFunction,
};

type OptionsState = {
    size: Size,
    showStats: boolean,
    lockWhenSolved: boolean,
    colorfulLineCounters: boolean,
};

export class Options extends Component<OptionsProps, OptionsState> {
    constructor(props: OptionsProps) {
        super(props);
        this.state = {
            size: getStoredSize(),
            showStats: getStoredBool('showStats'),
            lockWhenSolved: getStoredBool('lockWhenSolved'),
            colorfulLineCounters: getStoredBool('colorfulLineCounters'),
        }
    }

    setHeight = (event: React.ChangeEvent<HTMLInputElement>) => {
        const height = +event.target.value;
        this.setState({size: {height: height, width: this.state.size.width}}, this.props.onChangeFn);
        if (Number.isInteger(height) && height > 1) setStoredValue('height', height.toString());
    }

    setWidth = (event: React.ChangeEvent<HTMLInputElement>) => {
        const width = +event.target.value;
        if (Number.isInteger(width) && width > 1) setStoredValue('width', width.toString());
        this.setState({size: {width: width, height: this.state.size.height}}, this.props.onChangeFn);
    }

    setCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {name, checked} = event.target;
        setStoredBool(name, checked);
        let newState = {[name as keyof OptionsState]: checked};
        // @ts-ignore
        this.setState(newState, this.props.onChangeFn);
    }

    render() {
        return (
            <div className={'options'}>

                Width: &nbsp;
                <input onChange={this.setWidth} value={this.state.size.width} className={'sizeinput'} key={'width'}/>
                &nbsp;
                Height: &nbsp;
                <input onChange={this.setHeight} value={this.state.size.height} className={'sizeinput'} key={'height'}/>
                &nbsp;

                <br/>
                <label htmlFor={'colorfulLineCounters'}>Color the wall counters indicating completion:
                    <input type={'checkbox'} className={'options__checkbox'} name={'colorfulLineCounters'}
                           id={'colorfulLineCounters'}
                           checked={this.state.colorfulLineCounters} onChange={this.setCheckbox}/>
                </label>
                <br/>
                <label htmlFor={'showStats'}>Show puzzle stats:
                    <input type={'checkbox'} className={'options__checkbox'} name={'showStats'} id={'showStats'}
                           checked={this.state.showStats} onChange={this.setCheckbox}/>
                </label>
                <br/>
                <label htmlFor={'lockWhenSolved'}>Lock puzzle when solved:
                    <input type={'checkbox'} className={'options__checkbox'} name={'lockWhenSolved'}
                           id={'lockWhenSolved'}
                           checked={this.state.lockWhenSolved} onChange={this.setCheckbox}/>
                </label>

                <p>Start a new game for the selected options to take effect.</p>
            </div>
        );
    }
}

export default {Options};