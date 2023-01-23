import React, {Component} from 'react';
import {defaultBoardgenRules} from "../boardgen/boardgen";
import {Size, SolnRecord} from "../boardgen/types";
import {DDBoardSpec, generateDDBoard} from "../boardgen/ddBoardgen";
import {PlayBoard} from "./playBoard";
import {MutableGrid} from "../boardgen/mutableGrid";
import UrlReader from "../boardgen/urlReader";

export type PuzzleGameProps = {};

type PuzzleGameState = {
    size: Size,
    spec?: DDBoardSpec,
    solns: SolnRecord[],
};

export class PuzzleGame extends Component<PuzzleGameProps, PuzzleGameState> {
    gameRef: React.RefObject<PlayBoard>;

    constructor(props: PuzzleGameProps) {
        super(props);
        this.gameRef = React.createRef();
        const urlPuzzle = UrlReader.puzzleFromUrl();
        this.state = {
            spec: urlPuzzle,
            // size: {width: 5, height:3},
            size: urlPuzzle?.rules.size || defaultBoardgenRules.size,
            solns: [],
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
        const puz = generateDDBoard({
            size: this.state.size,
            throneSpec: {
                attemptFirst: .8,
                attemptSubsequent: 0.9,
            }
        });
        this.setState({spec: puz, solns: [],});
        if (this.gameRef.current) {
            this.gameRef.current.reset(puz.rules.size);
        }

        // TODO: Get some better behaviour on this.
        window.history.pushState({state: 'puzzle!'}, '', UrlReader.urlFromPuzzle(puz));
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

    findSolverFlaw = () => {
        // const maxTries = 200;
        //
        // let tries = 0;
        //
        // const spec = {
        //     size: this.state.size,
        //     throneSpec: {
        //         attemptFirst: .8,
        //         attemptSubsequent: 0.9,
        //     }
        // } as DDBoardgenSpec;
        // let puz = generateDDBoard(spec);
        //
        // let slns = ddSolve(puz);
        //
        // while (slns.length == 1 && tries++ < maxTries) {
        //     puz = generateDDBoard(spec);
        //     slns = ddSolve(puz)!;
        // }
        //
        // if (slns.length > 0) this.setState({solns: slns, spec: puz});
        // console.warn(`Took ${tries} tries to get a failure.`)
    }

    something = () => {
        const walls = this.state.spec!.walls;
        const s = walls.stringEncoding();
        walls.show();
        MutableGrid.fromString(walls.size, s).show();


    }

    render() {
        return (<>
                <input onChange={this.setWidth} value={this.state.size.width} className={'sizeinput'}/>
                &nbsp;
                <input onChange={this.setHeight} value={this.state.size.height} className={'sizeinput'}/>
                &nbsp;
                <button onClick={this.newGame}>New Game</button>
                &nbsp;
                <button onClick={e => this.gameRef.current!.reset()} disabled={this.state.spec === undefined}>Reset
                </button>
                {/*<button onClick={this.something} disabled={this.state.spec === undefined}>Do Something</button>*/}
                {/*<button onClick={this.findSolverFlaw}>findSolverFlaw</button>*/}


                {this.state.spec ? <PlayBoard spec={this.state.spec} ref={this.gameRef}/> : <></>}
                {/*{this.state.spec ? <a href={UrlReader.urlFromPuzzle(this.state.spec)}>link</a> : <></>}*/}

                {/*{this.state.spec ? <SolutionDisplayBoard spec={this.state.spec}/> : <></>}*/}

            </>
        );
    }
}
