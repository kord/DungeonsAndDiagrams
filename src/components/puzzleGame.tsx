import React, {Component} from 'react';
import {defaultBoardgenRules} from "../boardgen/boardgen";
import {Location, Size} from "../boardgen/types";
import {DDBoardgenSpec, DDBoardSpec, generateDDBoard} from "../boardgen/ddBoardgen";
import {SolutionDisplayBoard} from "./solutionDisplayBoard";
import {PlayBoard} from "./playBoard";
import {ddSolve} from "../boardgen/ddSolver";
import {MutableGrid} from "../boardgen/mutableGrid";

export type PuzzleGameProps = {};

export type SolnRecord = {
    wallGrid: MutableGrid,
    thrones: Location[],
}

type PuzzleGameState = {
    size: Size,
    spec?: DDBoardSpec,
    block: boolean,
    no2x2: boolean,
    uniqueDiameter: boolean,
    wrapX: boolean,
    wrapY: boolean,
    solns: SolnRecord[],
};

function imaginePuzzleSpec(s: SolnRecord): DDBoardSpec {
    const anygrid = new MutableGrid(s.wallGrid.size, false);
    const floors = s.wallGrid.inverted();
    return {
        walls: s.wallGrid,
        wallCounts: s.wallGrid.profile(true),
        rules: {size: s.wallGrid.size, throneSpec: {attemptFirst: 1, attemptSubsequent: 1}},
        deadends: floors.leafGrid(),
        treasure: MutableGrid.fromLocs(s.wallGrid.size, s.thrones),
        throneCenters: anygrid,
        throneCount: s.thrones.length,
        floors: floors,
        restarts: 0,
    };
}

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

    findSolverFlaw = () => {
        const maxTries = 200;

        let tries = 0;

        const spec = {
            size: this.state.size,
            throneSpec: {
                attemptFirst: .8,
                attemptSubsequent: 0.9,
            }
        } as DDBoardgenSpec;
        let puz = generateDDBoard(spec);

        let slns = ddSolve(puz);

        while (slns.length == 1 && tries++ < maxTries) {
            puz = generateDDBoard(spec);
            slns = ddSolve(puz)!;
        }

        if (slns.length > 0) this.setState({solns: slns, spec: puz});
        console.warn(`Took ${tries} tries to get a failure.`)
    }

    something = () => {
        // let grid = ddSolve(this.state.spec) ;
        // if (grid&& grid.walls.equals(this.state.spec!.walls)) console.log(`Solver found our candidate.`)
        // else {
        //     console.warn(`Solver failed.`)
        // }
        // if (grid) this.setState({solns: [grid]});

    }

    render() {
        return (<>
                <input onChange={this.setHeight} value={this.state.size.height}/>
                &nbsp;
                <input onChange={this.setWidth} value={this.state.size.width}/>
                &nbsp;
                <button onClick={this.newGame}>New Game</button>
                <button onClick={this.something} disabled={this.state.spec === undefined}>Do Something</button>
                <button onClick={this.findSolverFlaw}>findSolverFlaw</button>


                {this.state.spec ? <PlayBoard spec={this.state.spec} ref={this.gameRef}/> : <></>}
                {this.state.solns ? this.state.solns.map(soln =>
                    <SolutionDisplayBoard spec={imaginePuzzleSpec(soln)} annotation={'solver'} scale={.6}/>
                ) : <></>}

                {this.state.spec ? <SolutionDisplayBoard spec={this.state.spec}/> : <></>}

                {/*{this.state.spec ? <BlockBoardVis2 spec={this.state.spec}/> : <div/>}*/}
                {/*<br/>*/}
                {/*{this.state.spec ? <BlockBoardVis spec={this.state.spec}/> : <div/>}*/}


            </>
        );
    }
}
