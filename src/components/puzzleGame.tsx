import React, {Component} from 'react';
import {Size, SolnRecord} from "../utils/types";
import {DDBoardSpec, generateDDBoard} from "../boardgen/ddBoardgen";
import {PlayBoard} from "./playBoard";
import {MutableGrid} from "../utils/mutableGrid";
import UrlReader from "../utils/urlReader";
import {RulesButton} from "./rules";
import {getStoredBool, getStoredSize} from "../utils/localStorage";
import StatsPanel from "./statsPanel";
import {OptionsButton} from "./optionsButton";
import '../css/puzzleGame.css';

export type PuzzleGameProps = {};

type PuzzleGameState = {
    size: Size,
    spec?: DDBoardSpec,
    solns: SolnRecord[],
};

export class PuzzleGame extends Component<PuzzleGameProps, PuzzleGameState> {
    gameRef: React.RefObject<PlayBoard>;
    statsRef: React.RefObject<StatsPanel>;

    constructor(props: PuzzleGameProps) {
        super(props);
        this.gameRef = React.createRef();
        this.statsRef = React.createRef();
        const urlPuzzle = UrlReader.puzzleFromUrl();
        this.state = {
            spec: urlPuzzle,
            size: urlPuzzle?.rules.size || {height: 8, width: 8},
            solns: [],
        };
    }

    setCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {name, checked} = event.target;
        let newstate = {[name as keyof PuzzleGameState]: checked};
        // @ts-ignore
        this.setState(newstate);
    }

    newGame = () => {
        const puz = generateDDBoard({
            size: getStoredSize(),
            throneSpec: {
                attemptFirst: .8,
                attemptSubsequent: 0.9,
            }
        });

        this.setState({spec: puz, solns: [],}, () => {
            if (this.gameRef.current) {
                this.gameRef.current.reset(puz.rules.size);
            }
            if (this.statsRef.current) {
                this.statsRef.current.update();
            }
        });

        // TODO: Get some better behaviour on this.
        window.history.pushState({state: 'puzzle!'}, '', puz.url);
    }

    something = () => {
        const walls = this.state.spec!.walls;
        const s = walls.stringEncoding();
        walls.show();
        MutableGrid.fromString(walls.size, s).show();


    }

    render() {
        return (<>
                <button onClick={this.newGame} key={'new'}>New Game</button>
                &nbsp;
                <RulesButton/>
                &nbsp;
                <OptionsButton onChangeFn={() => this.forceUpdate()}/>
                <br/>
                <button onClick={e => this.gameRef.current!.attemptUndo()}
                        disabled={this.state.spec === undefined}>
                    Undo
                </button>
                &nbsp;
                <button onClick={e => this.gameRef.current!.reset()}
                        disabled={this.state.spec === undefined}>
                    Reset
                </button>

                <div className={'puzzle-display-panel'}>
                    <div>{this.state.spec ?
                        <PlayBoard
                            spec={this.state.spec}
                            lockWhenSolved={getStoredBool('lockWhenSolved')}
                            ref={this.gameRef}/>
                        : <></>}</div>
                    {this.state.spec && getStoredBool('showPuzzleInfo') ?
                        <StatsPanel puzzle={this.state.spec} ref={this.statsRef}/> : <></>}
                </div>
                {/*{this.state.spec ? <SolutionDisplayBoard spec={this.state.spec}/>  : <></>}*/}

            </>
        );
    }
}
