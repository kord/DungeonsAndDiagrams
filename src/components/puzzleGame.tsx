import React, {Component} from 'react';
import {defaultBoardgenRules} from "../boardgen/boardgen";
import {Size} from "../boardgen/types";
import {DDBoardgenSpec, DDBoardSpec, generateDDBoard} from "../boardgen/ddBoardgen";
import {SolutionDisplayBoard} from "./solutionDisplayBoard";
import {PlayBoard} from "./playBoard";

export type PuzzleGameProps = {};

type PuzzleGameState = {
    size: Size,
    spec?: DDBoardSpec,
    block: boolean,
    no2x2: boolean,
    uniqueDiameter: boolean,
    wrapX: boolean,
    wrapY: boolean,
};

export class PuzzleGame extends Component<PuzzleGameProps, PuzzleGameState> {
    gameRef: React.RefObject<PlayBoard>;

    constructor(props: PuzzleGameProps) {
        super(props);
        this.gameRef = React.createRef();
        this.state = {
            size: defaultBoardgenRules.size,
            // Unused!
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

    newGame = () => {
        const spec = {
            size: this.state.size,
            throneSpec: {
                attemptFirst: .8,
                attemptSubsequent: 0.9,
            }
        } as DDBoardgenSpec;
        const puz = generateDDBoard(spec);
        if (this.gameRef.current) this.gameRef.current.reset();
        this.setState({spec: puz});
    }

    //
    // regen = () => this.setState({
    //     spec: generateBoard({
    //         size: this.state.size,
    //         wrap: {wrapX: this.state.wrapX, wrapY: this.state.wrapY},
    //         boardStyle: this.state.block ? 'block' : 'thin edges',
    //         no2x2: this.state.no2x2,
    //         uniqueDiameter: this.state.uniqueDiameter,
    //         singleConnectedComponent: true,
    //     })
    // });

    // regen = () => this.setState({
    //     spec: generateBoard({
    //         size: this.state.size,
    //         wrap: {wrapX: this.state.wrapX, wrapY: this.state.wrapY},
    //         style: 'blank',
    //     })
    // });


    // something = () => {
    //
    //     const spec: DDBoardgenSpec = {
    //         size: this.state.size,
    //         throneSpec: {
    //             attemptFirst: .8,
    //             attemptSubsequent: .9,
    //         }
    //
    //     }
    //     // ddGen(spec)
    //     //
    //     // this.setState({spec: spec})
    //     //
    //     // const {graph} = this.state.spec!;
    //     // const size = this.state.spec!.rules.size;
    //     // // installThroneRooms(graph,3,
    //     // //     {height: 3, width: 3},
    //     // //     'block');
    //     // this.forceUpdate()
    // }

    render() {
        return (<>
                <input onChange={this.setHeight} value={this.state.size.height}/>
                &nbsp;
                <input onChange={this.setWidth} value={this.state.size.width}/>
                &nbsp;
                <button onClick={this.newGame}>New Game</button>
                {/*<button onClick={this.something}>Do Something</button>*/}


                {this.state.spec ? <PlayBoard spec={this.state.spec} ref={this.gameRef}/> : <div/>}
                {this.state.spec ? <SolutionDisplayBoard spec={this.state.spec}/> : <div/>}

                {/*{this.state.spec ? <BlockBoardVis2 spec={this.state.spec}/> : <div/>}*/}
                {/*<br/>*/}
                {/*{this.state.spec ? <BlockBoardVis spec={this.state.spec}/> : <div/>}*/}


            </>
        );
    }
}
