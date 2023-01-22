import React, {Component} from 'react';
import {defaultBoardgenRules} from "../boardgen/boardgen";
import {Location, Size} from "../boardgen/types";
import {DDBoardSpec, generateDDBoard} from "../boardgen/ddBoardgen";
import {PlayBoard} from "./playBoard";
import {MutableGrid} from "../boardgen/mutableGrid";
import UrlReader from "../boardgen/urlReader";

export type PuzzleGameProps = {};

export type SolnRecord = {
    wallGrid: MutableGrid,
    thrones: Location[],
}

type PuzzleGameState = {
    size: Size,
    spec?: DDBoardSpec,
    wrapX: boolean,
    wrapY: boolean,
    solns: SolnRecord[],
};

export class PuzzleGame extends Component<PuzzleGameProps, PuzzleGameState> {
    gameRef: React.RefObject<PlayBoard>;

    constructor(props: PuzzleGameProps) {
        super(props);
        this.gameRef = React.createRef();
        this.state = {
            spec: UrlReader.puzzleFromUrl(),
            size: defaultBoardgenRules.size,
            wrapX: defaultBoardgenRules.wrap.wrapX,
            wrapY: defaultBoardgenRules.wrap.wrapY,
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
        if (this.gameRef.current) this.gameRef.current.reset(puz.rules.size);
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
                {/*<button onClick={this.something} disabled={this.state.spec === undefined}>Do Something</button>*/}
                {/*<button onClick={this.findSolverFlaw}>findSolverFlaw</button>*/}


                {this.state.spec ? <PlayBoard spec={this.state.spec} ref={this.gameRef}/> : <></>}
                {this.state.spec ? <a href={UrlReader.urlFromPuzzle(this.state.spec)}>link</a> : <></>}
                {/*{this.state.solns ? this.state.solns.map(soln =>*/}
                {/*    <SolutionDisplayBoard spec={imaginePuzzleSpec(soln)} annotation={'solver'} scale={.6}/>*/}
                {/*) : <></>}*/}

                {/*{this.state.spec ? <SolutionDisplayBoard spec={this.state.spec}/> : <></>}*/}

                {/*{this.state.spec ? <BlockBoardVis2 spec={this.state.spec}/> : <div/>}*/}
                {/*<br/>*/}
                {/*{this.state.spec ? <BlockBoardVis spec={this.state.spec}/> : <div/>}*/}


            </>
        );
    }
}
