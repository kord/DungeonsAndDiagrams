import React, {Component} from 'react';
import {BlockBoard, generateBoard, Size} from "../boardgen/boardgen";
import {BlockBoardVis} from "./blockBoardVis";

export type PuzzleGameProps = {};

type PuzzleGameState = {
    size: Size,
    spec?: BlockBoard,
};

export class PuzzleGame extends Component<PuzzleGameProps, PuzzleGameState> {
    constructor(props: PuzzleGameProps) {
        super(props);
        this.state = {
            size: {
                height: 12,
                width: 12,
            },
        };
    }

    setHeight = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({size: {height: +event.target.value, width: this.state.size.width}});
    }
    setWidth = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({size: {width: +event.target.value, height: this.state.size.height}});
    }

    regen = () => this.setState({
        spec: generateBoard({
            size: this.state.size,
            style: 'block',
            no2x2: true,
            uniqueDiameter: true,
        })
    });

    render() {
        return (<>
                <input onChange={this.setWidth} value={this.state.size.width}/>
                &nbsp;
                <input onChange={this.setHeight} value={this.state.size.height}/>
                <button onClick={this.regen}>Regen</button>
                {this.state.spec ? <BlockBoardVis spec={this.state.spec}/> : <div/>}
            </>
        );
    }
}
