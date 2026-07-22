import React, { Component } from 'react';
import { DDBoardSpec } from "../boardgen/ddBoardgen";
import '../css/statsPanel.css';
import { hasBeenSolved } from "../utils/localStorage";

type StatsPanelProps = {
    puzzle: DDBoardSpec,
}

type StatsPanelState = {
    puzzleStats: PuzzleStats,
}

class StatsPanel extends Component<StatsPanelProps, StatsPanelState> {
    constructor(props: StatsPanelProps) {
        super(props);
        this.state = {
            puzzleStats: generateStats(this.props.puzzle),
        }
    }

    update() {
        this.setState({ puzzleStats: generateStats(this.props.puzzle) });
    }

    render() {
        const stats = this.state.puzzleStats;
        const solved = hasBeenSolved(this.props.puzzle);
        return (
            <div className={'stats-panel'}>
                <div className={'stats-panel__header'}>
                    <h2 className={'stats-panel__title'}>Stats</h2>
                    <span className={`stats-panel__solved-badge ${solved ? 'stats-panel__solved-badge--yes' : ''}`}>
                        {solved ? '✅ Solved' : '⏳ Unsolved'}
                    </span>
                </div>

                <div className={'stats-panel__section'}>
                    <h3 className={'stats-panel__section-title'}>Density</h3>
                    <div className={'stats-panel__row'}>
                        <span className={'stat-name'}>Wall Density</span>
                        <span className={'stat-value'}>{`${Math.floor(stats.wallDensity * 1000) / 10}%`}</span>
                    </div>
                    <div className={'stats-panel__row'}>
                        <span className={'stat-name'}>Hint Density</span>
                        <span className={'stat-value'}>{`${Math.floor(stats.hintDensity * 1000) / 10}%`}</span>
                    </div>
                    <div className={'stats-panel__row'}>
                        <span className={'stat-name'}>Wall-count SD</span>
                        <span className={'stat-value'}>
                            {`rows ${Math.floor(stats.rowDensitySD * 100) / 100}, cols ${Math.floor(100 * stats.columnDensitySD) / 100}`}
                        </span>
                    </div>
                </div>

                <div className={'stats-panel__section'}>
                    <h3 className={'stats-panel__section-title'}>Structure</h3>
                    <div className={'stats-panel__row'}>
                        <span className={'stat-name'}>Size</span>
                        <span className={'stat-value'}>{`${stats.rows} × ${stats.columns}`}</span>
                    </div>
                    <div className={'stats-panel__row'}>
                        <span className={'stat-name'}>Treasure Rooms</span>
                        <span className={'stat-value'}>{stats.treasureRoomCount}</span>
                    </div>
                    <div className={'stats-panel__row'}>
                        <span className={'stat-name'}>Dead Ends</span>
                        <span className={'stat-value'}>{stats.deadEndCount}</span>
                    </div>
                    <div className={'stats-panel__row'}>
                        <span className={'stat-name'}>Walls</span>
                        <span className={'stat-value'}>{stats.wallCount}</span>
                    </div>
                    <div className={'stats-panel__row'}>
                        <span className={'stat-name'}>Wall Components</span>
                        <span className={'stat-value'}>{stats.wallComponentCount}</span>
                    </div>
                    <div className={'stats-panel__row'}>
                        <span className={'stat-name'}>Graph Diameter</span>
                        <span className={'stat-value'}>{stats.diameter}</span>
                    </div>
                </div>

                {(stats.generationTimeMs !== undefined || stats.restarts !== undefined) && (
                    <div className={'stats-panel__section'}>
                        <h3 className={'stats-panel__section-title'}>Generation</h3>
                        {stats.generationTimeMs !== undefined && (
                            <div className={'stats-panel__row'}>
                                <span className={'stat-name'}>Generator Time</span>
                                <span className={'stat-value'}>{`${Math.ceil(stats.generationTimeMs)}ms`}</span>
                            </div>
                        )}
                        {stats.restarts !== undefined && (
                            <div className={'stats-panel__row'}>
                                <span className={'stat-name'}>Restarts</span>
                                <span className={'stat-value'}>{stats.restarts}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
}

type PuzzleStats = {
    totalLocs: number,
    rows: number,
    columns: number,
    treasureRoomCount: number,
    deadEndCount: number,
    wallCount: number,
    wallComponentCount: number,
    wallDensity: number,
    hintDensity: number,
    diameter: number,
    rowDensitySD: number,
    columnDensitySD: number,
    restarts?: number,
    generationTimeMs?: number,
}

function generateStats(board: DDBoardSpec): PuzzleStats {
    const diameter = board.floors.calculateDiameter();
    const wallCount = board.walls.trueLocs().length;
    const totalLocs = board.rules.size.height * board.rules.size.width;
    const deadEndCount = board.deadends.trueLocs().length;
    return {
        totalLocs: totalLocs,
        rows: board.rules.size.height,
        columns: board.rules.size.width,
        treasureRoomCount: board.throneCount,
        deadEndCount: deadEndCount,
        wallCount: wallCount,
        wallComponentCount: board.walls.componentCount(),
        wallDensity: wallCount / totalLocs,
        // We could maybe count treasure rooms as larger for this purpose.
        hintDensity: (deadEndCount + board.throneCount) / totalLocs,
        diameter: diameter ? diameter.distance : -1,
        rowDensitySD: Math.sqrt(sampleVariance(board.wallCounts.rows)),
        columnDensitySD: Math.sqrt(sampleVariance(board.wallCounts.cols)),
        restarts: board.restarts,
        generationTimeMs: board.generationTimeMs,
    }
}

function sampleVariance(nums: Array<number>) {
    let sum = 0, sumsq = 0;
    nums.forEach(n => {
        sum += n;
        sumsq += n ** 2
    });
    const cnt = nums.length;
    const mean = sum / cnt;
    return (sumsq - (sum ** 2) / cnt) / (cnt - 1);
}

export default StatsPanel;