import React, { Component } from 'react';
import { RulesButton } from "./rules";
import { OptionsButton } from "./optionsButton";
import { PlayBoard } from "./playBoard";
// @ts-ignore
import '../css/toolbar.css';

export type ToolbarProps = {
    showStats: boolean;
    showAlternatives: boolean;
    showHistory: boolean;
    specLoaded: boolean;
    devDensity: number;
    gameRef: React.RefObject<PlayBoard>;
    onNewGame: () => void;
    onToggleStats: () => void;
    onToggleAlternatives: () => void;
    onToggleHistory: () => void;
    onDevSearchLowDensity: () => void;
    onDevDensityChange: (density: number) => void;
    onOptionsChange: () => void;
    onDevSolve: () => void;
};

export class Toolbar extends Component<ToolbarProps> {
    render() {
        const {
            showStats, showAlternatives, showHistory, specLoaded, devDensity, gameRef,
            onNewGame, onToggleStats, onToggleAlternatives, onToggleHistory, onDevSearchLowDensity,
            onDevDensityChange, onOptionsChange, onDevSolve,
        } = this.props;

        return (
            <div className={'toolbar'}>
                <div className={'toolbar__group'}>
                    <button className={'btn btn--primary'} onClick={onNewGame} key={'new'}>
                        🎲 New Game
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <>
                            <button
                                className={'btn'}
                                onClick={onDevSearchLowDensity}
                                title={`Dev: search for a puzzle with hint density ≤ ${devDensity}%`}
                            >
                                🔍 Low-Density
                            </button>
                            <select
                                className={'btn'}
                                value={devDensity}
                                onChange={e => onDevDensityChange(Number(e.target.value))}
                                title={'Target max hint density %'}
                            >
                                {[2, 3, 4, 5, 6, 8, 10].map(n => (
                                    <option key={n} value={n}>{n}%</option>
                                ))}
                            </select>
                        </>
                    )}
                    {process.env.NODE_ENV === 'development' && (
                        <button
                            className={'btn'}
                            onClick={onDevSolve}
                            disabled={!specLoaded}
                            title={'Dev: auto-solve the current puzzle'}
                        >
                            🧙 Solve
                        </button>
                    )}
                    <RulesButton />
                    <OptionsButton onChangeFn={onOptionsChange} />
                    <button
                        className={`btn ${showStats ? 'btn--active' : ''}`}
                        onClick={onToggleStats}
                        title={showStats ? 'Hide stats panel' : 'Show stats panel'}
                    >
                        📊 Board Stats
                    </button>
                    <button
                        className={`btn ${showHistory ? 'btn--active' : ''}`}
                        onClick={onToggleHistory}
                        title={showHistory ? 'Close history' : 'View puzzle history'}
                    >
                        📜 History
                    </button>
                    {process.env.NODE_ENV === 'development' && (<button
                        className={`btn ${showAlternatives ? 'btn--active' : ''}`}
                        onClick={onToggleAlternatives}
                        disabled={!specLoaded}
                        title={showAlternatives ? 'Hide solver solutions' : 'Show all valid solutions from solver'}
                    >
                        🔍 Solutions
                    </button>)}
                </div>

                <div className={'toolbar__spacer'} />

                <div className={'toolbar__group'}>
                    <button className={'btn'} onClick={e => gameRef.current!.attemptUndo()}
                        disabled={!specLoaded}>
                        ↩ Undo
                        <span className={'btn__shortcut'}>Z</span>
                    </button>
                    <button className={'btn btn--danger'} onClick={e => gameRef.current!.reset()}
                        disabled={!specLoaded}>
                        ↺ Reset
                    </button>
                </div>
            </div>
        );
    }
}
