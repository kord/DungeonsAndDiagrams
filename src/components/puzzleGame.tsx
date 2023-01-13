import React, {Component} from 'react';
import {BoardSpec, defaultBoardgenRules, generateBoard} from "../boardgen/boardgen";
import {BlockBoardVis} from "./blockBoardVis";
import {Size} from "../boardgen/types";
import {BlockBoardVis2} from "./blockBoardVis2";
import {ddGen, DDSpec} from "../boardgen/ddBoardgen";

export type PuzzleGameProps = {};

type PuzzleGameState = {
    size: Size,
    spec?: BoardSpec,
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
            size: defaultBoardgenRules.size,
            block: defaultBoardgenRules.boardStyle == 'block',
            no2x2: !!defaultBoardgenRules.no2x2,
            uniqueDiameter: !!defaultBoardgenRules.uniqueDiameter,
            wrapX: defaultBoardgenRules.wrap.wrapX,
            wrapY: defaultBoardgenRules.wrap.wrapY,
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
            boardStyle: this.state.block ? 'block' : 'thin edges',
            no2x2: this.state.no2x2,
            uniqueDiameter: this.state.uniqueDiameter,
            singleConnectedComponent: true,
        })
    });

    // regen = () => this.setState({
    //     spec: generateBoard({
    //         size: this.state.size,
    //         wrap: {wrapX: this.state.wrapX, wrapY: this.state.wrapY},
    //         style: 'blank',
    //     })
    // });


    something = () => {

        const spec: DDSpec = {
            size: this.state.size,

        }
        ddGen(spec)

        const {graph} = this.state.spec!;
        const size = this.state.spec!.rules.size;
        // installThroneRooms(graph,3,
        //     {height: 3, width: 3},
        //     'block');
        this.forceUpdate()
    }

    render() {
        return (<>
                <label>
                    <input type={'checkbox'} onChange={this.setCheckbox} name={'block'} checked={this.state.block}/>
                    block
                </label>
                <label>
                    <input type={'checkbox'} onChange={this.setCheckbox} name={'no2x2'} checked={this.state.no2x2}/>
                    no2x2
                </label>
                <label>
                    <input type={'checkbox'} onChange={this.setCheckbox} name={'uniqueDiameter'}
                           checked={this.state.uniqueDiameter}/>
                    uniqueDiameter
                </label>
                <label>
                    <input type={'checkbox'} onChange={this.setCheckbox} name={'wrapX'} checked={this.state.wrapX}/>
                    WrapX
                </label>
                <label>
                    <input type={'checkbox'} onChange={this.setCheckbox} name={'wrapY'} checked={this.state.wrapY}/>
                    WrapY
                </label>
                <input onChange={this.setHeight} value={this.state.size.height}/>
                &nbsp;
                <input onChange={this.setWidth} value={this.state.size.width}/>
                <button onClick={this.regen}>Regen</button>
                <button onClick={this.something}>Do Something</button>

                {this.state.spec ? <BlockBoardVis2 spec={this.state.spec}/> : <div/>}
                <br/>
                {this.state.spec ? <BlockBoardVis spec={this.state.spec}/> : <div/>}


            </>
        );
    }
}
