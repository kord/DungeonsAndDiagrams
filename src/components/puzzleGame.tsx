import React, { Component } from 'react';
import { Size, SolnRecord } from "../utils/types";
import { DDBoardSpec, generateDDBoard } from "../boardgen/ddBoardgen";
import { PlayBoard } from "./playBoard";
import UrlReader from "../utils/urlReader";
import { RulesButton } from "./rules";
import { getStoredBool, getStoredSize, setStoredBool } from "../utils/localStorage";
import StatsPanel from "./statsPanel";
import { OptionsButton } from "./optionsButton";
// @ts-ignore
import '../css/puzzleGame.css';
// @ts-ignore
import '../css/toolbar.css';

export type PuzzleGameProps = {};

type PuzzleGameState = {
    size: Size,
    spec?: DDBoardSpec,
    solns: SolnRecord[],
    showStats: boolean,
    devDensity: number,
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
            size: urlPuzzle?.rules.size || { height: 8, width: 8 },
            solns: [],
            showStats: getStoredBool('showPuzzleInfo'),
            devDensity: 4,
        };
    }


    componentDidMount(): void {
        window.addEventListener('popstate', this.onPopState);
    }

    componentWillUnmount(): void {
        window.removeEventListener('popstate', this.onPopState);
    }

    onPopState = () => {
        // Only reload if the URL actually changed from what we're showing.
        if (this.state.spec && window.location.href === this.state.spec.url) return;
        const urlPuzzle = UrlReader.puzzleFromUrl();
        if (urlPuzzle) {
            this.setState({ spec: urlPuzzle, size: urlPuzzle.rules.size }, () => {
                this.gameRef.current?.reset(urlPuzzle.rules.size);
                this.statsRef.current?.update();
            });
        }
    };

    newGame = () => {
        const puz = generateDDBoard({
            size: getStoredSize(),
            throneSpec: {
                attemptFirst: .8,
                attemptSubsequent: 0.9,
            }
        });

        this.setState({ spec: puz, solns: [], }, () => {
            if (this.gameRef.current) {
                this.gameRef.current.reset(puz.rules.size);
            }
            if (this.statsRef.current) {
                this.statsRef.current.update();
            }
        });

        // Replace current URL so back button leaves the site, not cycles puzzles
        window.history.replaceState({}, '', puz.url);
    }

    toggleStats = () => {
        const next = !this.state.showStats;
        setStoredBool('showPuzzleInfo', next);
        this.setState({ showStats: next });
    };

    devSearchLowDensity = () => {
        const puz = generateDDBoard({
            size: getStoredSize(),
            throneSpec: {
                attemptFirst: .8,
                attemptSubsequent: 0.9,
            },
            maxHintDensity: this.state.devDensity / 100,
        });

        this.setState({ spec: puz, solns: [] }, () => {
            this.gameRef.current?.reset(puz.rules.size);
            this.statsRef.current?.update();
        });
        window.history.replaceState({}, '', puz.url);
    };

    render() {
        return (<>
            <div className={'toolbar'}>
                <div className={'toolbar__group'}>
                    <button className={'btn btn--primary'} onClick={this.newGame} key={'new'}>
                        🎲 New Game
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <>
                            <button
                                className={'btn'}
                                onClick={this.devSearchLowDensity}
                                title={`Dev: search for a puzzle with hint density ≤ ${this.state.devDensity}%`}
                            >
                                🔍 Low-Density
                            </button>
                            <select
                                className={'btn'}
                                value={this.state.devDensity}
                                onChange={e => this.setState({ devDensity: Number(e.target.value) })}
                                title={'Target max hint density %'}
                            >
                                {[2, 3, 4, 5, 6, 8, 10].map(n => (
                                    <option key={n} value={n}>{n}%</option>
                                ))}
                            </select>
                        </>
                    )}
                    <RulesButton />
                    <OptionsButton onChangeFn={() => this.forceUpdate()} />
                    <button
                        className={`btn ${this.state.showStats ? 'btn--active' : ''}`}
                        onClick={this.toggleStats}
                        title={this.state.showStats ? 'Hide stats panel' : 'Show stats panel'}
                    >
                        📊 Stats
                    </button>
                </div>

                <div className={'toolbar__spacer'} />

                <div className={'toolbar__group'}>
                    <button className={'btn'} onClick={e => this.gameRef.current!.attemptUndo()}
                        disabled={this.state.spec === undefined}>
                        ↩ Undo
                        <span className={'btn__shortcut'}>Z</span>
                    </button>
                    <button className={'btn btn--danger'} onClick={e => this.gameRef.current!.reset()}
                        disabled={this.state.spec === undefined}>
                        ↺ Reset
                    </button>
                </div>
            </div>

            <div className={'puzzle-display-panel'}>
                <div>{this.state.spec ?
                    <PlayBoard
                        spec={this.state.spec}
                        lockWhenSolved={getStoredBool('lockWhenSolved')}
                        onBoardChange={() => this.statsRef.current?.update()}
                        ref={this.gameRef} />
                    : <></>}</div>
                {this.state.spec && this.state.showStats ?
                    <StatsPanel puzzle={this.state.spec} ref={this.statsRef} /> : <></>}
            </div>

        </>
        );
    }
}
