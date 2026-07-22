import React, { Component } from 'react';
import { PuzzleSolutionRecord } from '../utils/localStorage';
import UrlReader from '../utils/urlReader';
import { SolutionDisplayBoard } from './solutionDisplayBoard';
import { DDBoardSpec } from '../boardgen/ddBoardgen';
// @ts-ignore
import '../css/historyModal.css';

type HistoryModalProps = {
    records: PuzzleSolutionRecord[];
    onClose: () => void;
    onClear: () => void;
};

type HistoryModalState = {
    view: 'solved' | 'unsolved';
    solvedIndex: number;
    unsolvedIndex: number;
    clearPending: boolean;
};

export class HistoryModal extends Component<HistoryModalProps, HistoryModalState> {
    constructor(props: HistoryModalProps) {
        super(props);
        this.state = { view: 'solved', solvedIndex: 0, unsolvedIndex: 0, clearPending: false };
    }

    /** Group records by size string, return sorted by total games desc. */
    computeStats() {
        const bySize = new Map<string, { total: number; solved: number }>();
        for (const r of this.props.records) {
            const key = `${r.size.height}×${r.size.width}`;
            const entry = bySize.get(key) || { total: 0, solved: 0 };
            entry.total++;
            if (r.isSolved) entry.solved++;
            bySize.set(key, entry);
        }
        return [...bySize.entries()]
            .map(([size, stats]) => ({ size, ...stats }))
            .sort((a, b) => b.total - a.total);
    }

    solvedRecords() {
        return this.props.records
            .filter(r => r.isSolved)
            .sort((a, b) => (b.solvedTime ?? 0) - (a.solvedTime ?? 0));
    }

    unsolvedRecords() {
        return this.props.records
            .filter(r => !r.isSolved)
            .sort((a, b) => (b.generatedTime ?? 0) - (a.generatedTime ?? 0));
    }

    handleClear = () => {
        if (!this.state.clearPending) {
            this.setState({ clearPending: true });
            return;
        }
        // Second click — actually clear.
        const prefix = 'dnd_solved_';
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(prefix)) keys.push(k);
        }
        keys.forEach(k => localStorage.removeItem(k));
        this.setState({ clearPending: false });
        this.props.onClear();
    };

    render() {
        const stats = this.computeStats();
        const solved = this.solvedRecords();
        const unsolved = this.unsolvedRecords();

        return (
            <div className={'history-overlay'} onClick={this.props.onClose}>
                <div className={'history-modal'} onClick={e => e.stopPropagation()}>
                    <button className={'history-modal__close'} onClick={this.props.onClose}>✕</button>
                    <h2 className={'history-modal__title'}>📜 Puzzle History</h2>

                    <div className={'history-modal__body'}>
                        {/* ── Left: Stats ─────────────────────────────── */}
                        <div className={'history-stats'}>
                            <h3 className={'history-stats__title'}>Performance by Size</h3>
                            {stats.length === 0 ? (
                                <p className={'history-stats__empty'}>No puzzles yet.</p>
                            ) : (
                                <>
                                    <table className={'history-stats__table'}>
                                        <thead>
                                            <tr>
                                                <th>Size</th>
                                                <th>Solved</th>
                                                <th>Total</th>
                                                <th>Win %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.map(s => (
                                                <tr key={s.size}>
                                                    <td>{s.size}</td>
                                                    <td>{s.solved}</td>
                                                    <td>{s.total}</td>
                                                    <td>{Math.round((s.solved / s.total) * 100)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button
                                        className={`history-stats__clear-btn ${this.state.clearPending ? 'history-stats__clear-btn--confirm' : ''}`}
                                        onClick={this.handleClear}
                                    >
                                        {this.state.clearPending ? '⚠️ Click again to clear all history' : '🗑 Clear History'}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* ── Right: Solved / Unsolved toggle ──────────── */}
                        <div className={'history-list'}>
                            <div className={'history-list__toggle'}>
                                <button
                                    className={`history-list__toggle-btn ${this.state.view === 'solved' ? 'history-list__toggle-btn--active' : ''}`}
                                    onClick={() => this.setState({ view: 'solved' })}
                                >
                                    ✅ Solved ({solved.length})
                                </button>
                                <button
                                    className={`history-list__toggle-btn ${this.state.view === 'unsolved' ? 'history-list__toggle-btn--active' : ''}`}
                                    onClick={() => this.setState({ view: 'unsolved' })}
                                >
                                    ⏳ In Progress ({unsolved.length})
                                </button>
                            </div>

                            {this.state.view === 'solved' ? (
                                <SolvedList
                                    records={solved}
                                    index={this.state.solvedIndex}
                                    onNavigate={(d) => this.setState(s => ({
                                        solvedIndex: Math.max(0, Math.min(solved.length - 1, s.solvedIndex + d))
                                    }))}
                                />
                            ) : (
                                <UnsolvedList
                                    records={unsolved}
                                    index={this.state.unsolvedIndex}
                                    onNavigate={(d) => this.setState(s => ({
                                        unsolvedIndex: Math.max(0, Math.min(unsolved.length - 1, s.unsolvedIndex + d))
                                    }))}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

// ── Solved puzzle carousel ──────────────────────────────────────

function SolvedList({ records, index, onNavigate }: {
    records: PuzzleSolutionRecord[];
    index: number;
    onNavigate: (delta: number) => void;
}) {
    if (records.length === 0) {
        return <p className={'history-list__empty'}>No solved puzzles yet.</p>;
    }
    const r = records[index];

    // Try to recover the full puzzle spec from the stored URL.
    let spec: DDBoardSpec | undefined;
    try {
        spec = UrlReader.puzzleFromUrl(r.url);
    } catch { /* URL may be unparseable */ }

    const genDate = r.generatedTime ? new Date(r.generatedTime).toLocaleDateString() : '?';
    const solveDate = r.solvedTime ? new Date(r.solvedTime).toLocaleDateString() : '?';
    const solveTime = r.generatedTime && r.solvedTime
        ? formatDuration(r.solvedTime - r.generatedTime)
        : null;

    return (
        <div className={'history-card'}>
            <div className={'history-card__nav'}>
                <button disabled={index === 0} onClick={() => onNavigate(-1)}>◀</button>
                <span>{index + 1} / {records.length}</span>
                <button disabled={index === records.length - 1} onClick={() => onNavigate(1)}>▶</button>
            </div>
            <div className={'history-card__info'}>
                <span className={'history-card__size'}>{r.size.height}×{r.size.width}</span>
                <span className={'history-card__status history-card__status--solved'}>✅ Solved</span>
            </div>
            <div className={'history-card__times'}>
                <span>Generated: {genDate}</span>
                <span>Solved: {solveDate}</span>
                {solveTime && <span>Time: {solveTime}</span>}
            </div>
            {spec ? (
                <div className={'history-card__board'}>
                    <SolutionDisplayBoard
                        spec={spec}
                        scale={0.4}
                        monsterChoices={spec.monsterChoices}
                    />
                </div>
            ) : (
                <p className={'history-card__board-fallback'}>
                    (puzzle data unavailable)
                </p>
            )}
        </div>
    );
}

// ── Unsolved puzzle carousel ────────────────────────────────────

function UnsolvedList({ records, index, onNavigate }: {
    records: PuzzleSolutionRecord[];
    index: number;
    onNavigate: (delta: number) => void;
}) {
    if (records.length === 0) {
        return <p className={'history-list__empty'}>No puzzles in progress.</p>;
    }
    const r = records[index];

    // Try to recover the full puzzle spec from the stored URL.
    let spec: DDBoardSpec | undefined;
    try {
        spec = UrlReader.puzzleFromUrl(r.url);
    } catch { /* URL may be unparseable */ }

    const genDate = r.generatedTime ? new Date(r.generatedTime).toLocaleDateString() : '?';

    const handleClick = () => {
        window.location.href = r.url;
    };

    return (
        <div className={'history-card'}>
            <div className={'history-card__nav'}>
                <button disabled={index === 0} onClick={() => onNavigate(-1)}>◀</button>
                <span>{index + 1} / {records.length}</span>
                <button disabled={index === records.length - 1} onClick={() => onNavigate(1)}>▶</button>
            </div>
            <div className={'history-card__info'}>
                <span className={'history-card__size'}>{r.size.height}×{r.size.width}</span>
                <span className={'history-card__status history-card__status--unsolved'}>⏳ Unsolved</span>
            </div>
            <div className={'history-card__times'}>
                <span>Generated: {genDate}</span>
            </div>
            {spec ? (
                <div className={'history-card__board'} onClick={handleClick} title={'Click to resume this puzzle'}>
                    <SolutionDisplayBoard
                        spec={spec}
                        scale={0.4}
                        monsterChoices={spec.monsterChoices}
                        hideSolution={true}
                    />
                </div>
            ) : (
                <p className={'history-card__board-fallback'}>
                    (puzzle data unavailable —{' '}
                    <a href={r.url}>open directly</a>)
                </p>
            )}
        </div>
    );
}

function formatDuration(ms: number): string {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${s % 60}s`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
}
