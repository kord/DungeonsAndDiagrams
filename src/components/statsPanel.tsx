import React, {Component} from 'react';
import {DDBoardSpec} from "../boardgen/ddBoardgen";
import '../css/statsPanel.css';
import {hasBeenSolved} from "../utils/localStorage";

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
        this.setState({puzzleStats: generateStats(this.props.puzzle)});
    }

    render() {
        const stats = this.state.puzzleStats;
        return (
            <div className={'stats-panel'}>
                <h2>Stats</h2>
                <div className={'stats-panel--interior'}>
                    <p className={'stat-name'}>Hint Density</p>
                    <p className={'stat-value'}>{`${Math.floor(stats.hintDensity * 1000) / 10}%`}</p>

                    <p className={'stat-name'}>Wall-count SD (rows/cols)</p>
                    <p className={'stat-value'}>{`${Math.floor(stats.rowDensitySD * 100) / 100}, ${Math.floor(100 * stats.columnDensitySD) / 100}`}</p>

                    <p className={'stat-name'}>Wall Density</p>
                    <p className={'stat-value'}>{`${Math.floor(stats.wallDensity * 1000) / 10}%`}</p>

                    <p className={'stat-name'}>Treasure Rooms</p>
                    <p className={'stat-value'}>{stats.treasureRoomCount}</p>

                    <p className={'stat-name'}>Dead Ends</p>
                    <p className={'stat-value'}>{stats.deadEndCount}</p>

                    <p className={'stat-name'}>Walls</p>
                    <p className={'stat-value'}>{stats.wallCount}</p>

                    <p className={'stat-name'}>Wall Components</p>
                    <p className={'stat-value'}>{stats.wallComponentCount}</p>

                    <p className={'stat-name'}>Graph Diameter</p>
                    <p className={'stat-value'}>{stats.diameter}</p>

                    <p className={'stat-name'}>Has been solved</p>
                    <p className={'stat-value'}>{stats.solved ? <strong>Solved</strong> : 'Unsolved'}</p>

                    {stats.generationTimeMs ? <>
                        <p className={'stat-name'}>Generator time</p>
                        <p className={'stat-value'}>{`${Math.ceil(stats.generationTimeMs)}ms`}</p>
                    </> : <></>}

                    {
                        stats.restarts !== undefined ? <>
                            <p className={'stat-name'}>Generator restarts</p>
                            <p className={'stat-value'}>{stats.restarts}</p>
                        </> : <></>
                    }
                </div>
            </div>
        );
    }
}

type PuzzleStats = {
    totalLocs: number,
    treasureRoomCount: number,
    deadEndCount: number,
    wallCount: number,
    wallComponentCount: number,
    wallDensity: number,
    hintDensity: number,
    diameter: number,
    rowDensitySD: number,
    columnDensitySD: number,
    solved: boolean,
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
        solved: hasBeenSolved(board),
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