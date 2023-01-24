import React, {Component} from 'react';
import {Size, SolnRecord} from "../boardgen/types";
import {DDBoardSpec, generateDDBoard} from "../boardgen/ddBoardgen";
import {PlayBoard} from "./playBoard";
import {MutableGrid} from "../boardgen/mutableGrid";
import UrlReader from "../boardgen/urlReader";
import {RulesButton} from "./rules";

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
            size: urlPuzzle?.rules.size || {height: 8, width: 8},
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

    something = () => {
        const walls = this.state.spec!.walls;
        const s = walls.stringEncoding();
        walls.show();
        MutableGrid.fromString(walls.size, s).show();


    }

    render() {
        return (<>
                Size&nbsp;
                <input onChange={this.setWidth} value={this.state.size.width} className={'sizeinput'} key={'width'}/>
                &nbsp;
                <input onChange={this.setHeight} value={this.state.size.height} className={'sizeinput'} key={'height'}/>
                &nbsp;
                <button onClick={this.newGame} key={'new'}>New Game</button>
                &nbsp;
                <RulesButton/>
                <br/>
                <button onClick={e => this.gameRef.current!.attemptUndo()}
                        disabled={this.state.spec === undefined}>Undo
                </button>
                &nbsp;
                <button onClick={e => this.gameRef.current!.reset()} disabled={this.state.spec === undefined}>Reset
                </button>

                {this.state.spec ? <PlayBoard spec={this.state.spec} ref={this.gameRef}/> : <></>}

            </>
        );
    }
}
