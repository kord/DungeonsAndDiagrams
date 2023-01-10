import React, {Component} from 'react';
import {BlockBoard, generateBoard} from "../boardgen/boardgen";
import {BlockBoardVis} from "./blockBoardVis";
import {Size} from "../boardgen/types";
import {BlockBoardVis2} from "./blockBoardVis2";

export type PuzzleGameProps = {};

type PuzzleGameState = {
    size: Size,
    spec?: BlockBoard,
    block: boolean,
    no2x2: boolean,
    uniqueDiameter: boolean,
    wrapX: boolean,
    wrapY: boolean,
};

export class PuzzleGame extends Component<PuzzleGameProps, PuzzleGameState> {
    constructor(props: PuzzleGameProps) {
        super(props);
        this.state = {
            size: {
                height: 8,
                width: 8,
            },
            block: false,
            no2x2: false,
            uniqueDiameter: true,
            wrapX: false,
            wrapY: false,
        };
    }

    setHeight = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({size: {height: +event.target.value, width: this.state.size.width}});
    }
    setWidth = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({size: {width: +event.target.value, height: this.state.size.height}});
    }

    setCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {name, checked} = event.target;
        let newstate = {[name as keyof PuzzleGameState]: checked};
        // @ts-ignore
        this.setState(newstate);
    }

    regen = () => this.setState({
        spec: generateBoard({
            size: this.state.size,
            wrap: {wrapX: this.state.wrapX, wrapY: this.state.wrapY},
            style: this.state.block ? 'block' : 'thin edges',
            no2x2: this.state.no2x2,
            uniqueDiameter: this.state.uniqueDiameter,
        })
    });

    render() {
        return (<>
                <label>
                    block
                    <input type={'checkbox'} onChange={this.setCheckbox} name={'block'} checked={this.state.block}/>
                </label>
                <label>
                    no2x2
                    <input type={'checkbox'} onChange={this.setCheckbox} name={'no2x2'} checked={this.state.no2x2}/>
                </label>
                <label>
                    uniqueDiameter
                    <input type={'checkbox'} onChange={this.setCheckbox} name={'uniqueDiameter'}
                           checked={this.state.uniqueDiameter}/>
                </label>
                <label>
                    WrapX
                    <input type={'checkbox'} onChange={this.setCheckbox} name={'wrapX'} checked={this.state.wrapX}/>
                </label>
                <label>
                    WrapY
                    <input type={'checkbox'} onChange={this.setCheckbox} name={'wrapY'} checked={this.state.wrapY}/>
                </label>
                <input onChange={this.setHeight} value={this.state.size.height}/>
                &nbsp;
                <input onChange={this.setWidth} value={this.state.size.width}/>
                <button onClick={this.regen}>Regen</button>

                {this.state.spec ? <BlockBoardVis2 spec={this.state.spec}/> : <div/>}
                <br/>
                {this.state.spec ? <BlockBoardVis spec={this.state.spec}/> : <div/>}


            </>
        );
    }
}
