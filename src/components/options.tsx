import React, {Component} from 'react';
import '../css/options.css';
import {Size} from "../boardgen/types";
import Swal from "sweetalert2";
import withReactContent from 'sweetalert2-react-content';
import {getStoredBool, getStoredSize, setStoredBool, setStoredValue} from "../localStorage";

const MySwal = withReactContent(Swal)

type OptionsProps = {};
type OptionsState = {
    size: Size,
    showStats: boolean,
};

class Options extends Component<OptionsProps, OptionsState> {
    constructor(props: OptionsProps) {
        super(props);
        this.state = {
            size: getStoredSize(),
            showStats: getStoredBool('showStats'),
        }
    }

    setHeight = (event: React.ChangeEvent<HTMLInputElement>) => {
        const height = +event.target.value;
        this.setState({size: {height: height, width: this.state.size.width}});
        if (Number.isInteger(height) && height > 1) setStoredValue('height', height.toString());
    }

    setWidth = (event: React.ChangeEvent<HTMLInputElement>) => {
        const width = +event.target.value;
        this.setState({size: {width: width, height: this.state.size.height}});
        if (Number.isInteger(width) && width > 1) setStoredValue('width', width.toString());
    }

    setCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {name, checked} = event.target;
        setStoredBool(name, checked);
        let newState = {[name as keyof OptionsState]: checked};
        // @ts-ignore
        this.setState(newState);
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
                Show puzzle stats: <input type={'checkbox'} className={'options__checkbox'} name={'showStats'}
                                          checked={this.state.showStats} onChange={this.setCheckbox}/>

            </div>
        );
    }
}

function showModal(p1: React.MouseEvent<HTMLButtonElement>) {
    MySwal.fire({
        title: '<strong>Options</strong>',
        icon: 'question',
        html: <Options/>,
        width: '80%',
        showCloseButton: true,
        showConfirmButton: false,
    });
}


export class OptionsButton extends Component {
    render() {
        return (
            <button onClick={showModal}>Options</button>
        );
    }
}


export default Options;