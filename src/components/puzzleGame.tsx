import React, {Component} from 'react';
import {defaultBoardgenRules} from "../boardgen/boardgen";
import {Size} from "../boardgen/types";
import {DDBoardgenSpec, DDBoardSpec, generateDDBoard} from "../boardgen/ddBoardgen";
import {SolutionDisplayBoard} from "./solutionDisplayBoard";
import {PlayBoard} from "./playBoard";
import {ddSolve} from "../boardgen/ddSolver";
import {MutableGrid} from "../boardgen/mutableGrid";

export type PuzzleGameProps = {};

type PuzzleGameState = {
    size: Size,
    spec?: DDBoardSpec,
    block: boolean,
    no2x2: boolean,
    uniqueDiameter: boolean,
    wrapX: boolean,
    wrapY: boolean,
    solns: MutableGrid[],
};

function imaginePuzzleSpec(soln: MutableGrid): DDBoardSpec {
    const anygrid = new MutableGrid(soln.size, false);
    return {
        walls: soln,
        wallCounts: soln.profile(true),
        rules: {size: soln.size, throneSpec: {attemptFirst: 1, attemptSubsequent: 1}},
        deadends: anygrid,
        treasure: anygrid,
        throneCenters: anygrid,
        throneCount: 0,
        floors: soln.inverted(),
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
        let tries = 0;

        const spec = {
            size: this.state.size,
            throneSpec: {
                attemptFirst: .8,
                attemptSubsequent: 0.9,
            }
        } as DDBoardgenSpec;
        let puz = generateDDBoard(spec);

        let grid = ddSolve(puz) as MutableGrid;

        while (grid.equals(puz.walls) && tries++ < 20) {
            puz = generateDDBoard(spec);
            grid = ddSolve(puz) as MutableGrid;
        }

        if (grid) this.setState({solns: [grid], spec: puz});
        console.warn(`Took ${tries} tries to get a failure.`)
    }

    something = () => {


        let grid = ddSolve(this.state.spec) as MutableGrid;
        if (grid.equals(this.state.spec!.walls)) console.log(`Solver found our candidate.`)
        else {
            console.warn(`Solver failed.`)
            grid.inverted().show();
        }
        if (grid) this.setState({solns: [grid]});

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


                {this.state.spec ? <PlayBoard spec={this.state.spec} ref={this.gameRef}/> : <div/>}
                {this.state.solns ? this.state.solns.map(soln =>
                    <SolutionDisplayBoard spec={imaginePuzzleSpec(soln)}/>
                ) : <></>}

                {this.state.spec ? <SolutionDisplayBoard spec={this.state.spec}/> : <div/>}

                {/*{this.state.spec ? <BlockBoardVis2 spec={this.state.spec}/> : <div/>}*/}
                {/*<br/>*/}
                {/*{this.state.spec ? <BlockBoardVis spec={this.state.spec}/> : <div/>}*/}


            </>
        );
    }
}
