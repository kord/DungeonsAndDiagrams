import React, { Component } from 'react';
import { Size, SolnRecord } from "../utils/types";
import { DDBoardSpec, generateDDBoard } from "../boardgen/ddBoardgen";
import { PlayBoard } from "./playBoard";
import UrlReader from "../utils/urlReader";
import { getAllPuzzleRecords, getStoredBool, getStoredSize, markAsUnsolved, setStoredBool } from "../utils/localStorage";
import StatsPanel from "./statsPanel";
import { Toolbar } from "./toolbar";
import { hasMultipleSolutions } from "../boardgen/ddSolver";
import { AlternativeSolutionsPanel } from "./alternativeSolutions";
import { HistoryModal } from "./historyModal";
import '../css/puzzleGame.css';

export type PuzzleGameProps = {};

type PuzzleGameState = {
    size: Size,
    spec?: DDBoardSpec,
    solns: SolnRecord[],
    showStats: boolean,
    showAlternatives: boolean,
    showHistory: boolean,
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
            showAlternatives: false,
            showHistory: false,
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
        const current_time_msec = Math.floor(Date.now());

        markAsUnsolved(puz, current_time_msec);

        // Push state so that the back button will return to the previous puzzle.
        window.history.pushState({}, '', puz.url);
    }

    toggleStats = () => {
        const next = !this.state.showStats;
        setStoredBool('showPuzzleInfo', next);
        this.setState({ showStats: next });
    };

    toggleAlternatives = () => {
        this.setState({ showAlternatives: !this.state.showAlternatives });
    };

    toggleHistory = () => {
        this.setState({ showHistory: !this.state.showHistory });
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

    devSolve = () => {
        const { spec } = this.state;
        if (!spec) return;

        // Apply the known solution.
        this.gameRef.current?.loadSolution(spec.walls);

        // Check for multiple solutions.
        if (hasMultipleSolutions(spec)) {
            alert('⚠️ This puzzle has multiple valid solutions!');
        }
    };

    render() {
        return (<>
            <Toolbar
                showStats={this.state.showStats}
                specLoaded={this.state.spec !== undefined}
                devDensity={this.state.devDensity}
                gameRef={this.gameRef}
                onNewGame={this.newGame}
                onToggleStats={this.toggleStats}
                onDevSearchLowDensity={this.devSearchLowDensity}
                onDevDensityChange={(d: number) => this.setState({ devDensity: d })}
                onOptionsChange={() => this.forceUpdate()}
                onDevSolve={this.devSolve}
                showAlternatives={this.state.showAlternatives}
                onToggleAlternatives={this.toggleAlternatives}
                showHistory={this.state.showHistory}
                onToggleHistory={this.toggleHistory}
            />

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

            {this.state.spec && this.state.showAlternatives ?
                <AlternativeSolutionsPanel spec={this.state.spec} /> : <></>}

            {this.state.showHistory ?
                <HistoryModal
                    records={getAllPuzzleRecords()}
                    onClose={this.toggleHistory}
                    onClear={() => this.forceUpdate()}
                /> : <></>}

        </>
        );
    }
}
