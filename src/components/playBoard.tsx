import React, {Component, CSSProperties, MouseEventHandler} from 'react';
import classNames from "classnames";
import {Location, RangeReport, Size} from "../boardgen/types";
import {gridLocations, loc2Str} from "../boardgen/graphUtils";
import {DDBoardSpec} from "../boardgen/ddBoardgen";
import {MutableGrid} from "../boardgen/mutableGrid";
import '../css/playBoard.css';
import '../css/monsters.css';

export type PlayBoardProps = {
    spec: DDBoardSpec,
    lockWhenSolved: boolean,
};

type PlayBoardState = {
    assignedWalls: MutableGrid,
    assignedFloors: MutableGrid,
};

type BlockState = 'immutable' | 'user-untouched' | 'user-wall' | 'user-floor';

type MouseBehaviour = {
    initialButtons: number,
    initialBlockState: BlockState,
    mouseAction: MouseAction,
}

type MouseAction = {
    useruntouched?: BlockState,
    userwall?: BlockState,
    userfloor?: BlockState,
}

type OverFlowCounter = {
    rows: Set<number>;
    cols: Set<number>;
}

export class PlayBoard extends Component<PlayBoardProps, PlayBoardState> {
    // canvasRef: React.RefObject<HTMLCanvasElement>;
    undoStack: PlayBoardState[];
    stateBeforeClick?: PlayBoardState;
    mouseBehaviour?: MouseBehaviour;

    constructor(props: PlayBoardProps) {
        super(props);
        this.undoStack = [];
        // this.canvasRef = React.createRef();
        const size = props.spec.rules.size;
        this.state = {
            assignedWalls: new MutableGrid(size, false),
            assignedFloors: new MutableGrid(size, false),
        };
    }

    render() {
        const {size, throneSpec} = this.props.spec.rules;
        const st = {
            '--board-height': size.height,
            '--board-width': size.width,
        } as CSSProperties;

        const solved = this.isSolved();
        const boardClasses = classNames({
            'play-board': true,
            'play-board--completed': solved,
            'play-board--incomplete': !solved,
        });

        const solutionWalls = this.props.spec.wallCounts;
        const userWalls = this.state.assignedWalls.profile(true);
        const userFloors = this.state.assignedFloors.profile(true);

        // Just a single pass to figure out which rows/cols are overfilled.
        const rows = new Set<number>();
        const cols = new Set<number>();
        for (let i = 0; i < size.height; i++) if (userWalls.rows[i] > solutionWalls.rows[i]) rows.add(i);
        for (let j = 0; j < size.width; j++) if (userWalls.cols[j] > solutionWalls.cols[j]) cols.add(j);
        const overflowCounts: OverFlowCounter = {cols: cols, rows: rows};

        return (<>

                <div className={boardClasses} style={st} key={'itstheboard'}>
                    <div className={'play-board__grid'} key={'itsthegrid'}>
                        {this.columnHints()}
                        {gridLocations(size).map((row, j) => {
                                return <>
                                    <div className={this.counterClasses('row', j)}
                                         key={`rowhint${j}`}>
                                        {solutionWalls.rows[j]}
                                        {/*<p className={'play-board__count__text'}> {wallCounts.rows[i]}</p>*/}
                                    </div>
                                    {row.map(loc =>
                                        <div className={this.blockSquareClassnames(loc, overflowCounts)}
                                             key={loc2Str(loc)}
                                             onMouseDown={this.mouseDownFn(loc)}
                                             onMouseEnter={(e) => {
                                                 if (e.buttons === this.mouseBehaviour?.initialButtons)
                                                     this.performClickBehaviour(loc);
                                             }}
                                        >
                                        </div>
                                    )}
                                </>;
                            }
                        )}
                    </div>
                </div>
                <br/>
            </>
        );
    }

    public reset(size?: Size) {
        // const {size} = this.props.spec.rules;
        if (size === undefined) size = this.props.spec.rules.size;
        this.undoStack = [];
        this.setState({
            assignedFloors: new MutableGrid(size, false),
            assignedWalls: new MutableGrid(size, false)
        });
    }

    mouseUpGlobal = (e: MouseEvent) => {
        // console.log('mouseUpGlobal fired');
        if (!this.stateBeforeClick) return;
        if (!this.stateBeforeClick.assignedFloors.equals(this.state.assignedFloors) ||
            !this.stateBeforeClick.assignedWalls.equals(this.state.assignedWalls)) {
            this.undoStack.push(this.stateBeforeClick);
        }
        this.mouseBehaviour = undefined;
        this.stateBeforeClick = undefined;
    }

    // Disable default right click behaviour.
    onContextMenu = (e: MouseEvent) => e.preventDefault();

    // Capture Z for undo and R for reset.
    keyPress = (e: KeyboardEvent) => {
        // You can't undo while clicking stuff. That's just weird.
        if (this.mouseBehaviour) return;
        // console.log(e.code);
        if (e.code === 'KeyZ') this.attemptUndo();
        if (e.code === 'KeyR') this.reset();
    }

    componentDidMount(): void {
        // Cancel the dragged action we were thinking about.
        document.addEventListener('mouseup', this.mouseUpGlobal);
        // Global prevent context menu, so we can use right click without a bunch of trash showing up on screen.
        document.addEventListener('contextmenu', this.onContextMenu);
        // For the undo button.
        document.addEventListener('keypress', this.keyPress);
    }

    componentWillUnmount(): void {
        document.removeEventListener('mouseup', this.mouseUpGlobal);
        document.removeEventListener('contextmenu', this.onContextMenu);
        document.removeEventListener('keypress', this.keyPress);
    }

    public attemptUndo() {
        const p = this.undoStack.pop();
        console.log(`undo`);
        if (p) this.setState(p)
    }

    // Set the sort of action the mouse held down over other elements will produce, depending on the status of the
    counterClasses(orientation: 'row' | 'col', order: number) {
        const report = this.rangeReport(orientation, order);
        const symbolCount = report.treasureCount + report.deadEndCount;

        // console.log(report)

        return classNames({
            'play-board__count': true,
            [`play-board__count--${orientation}`]: true,
            'play-board__count--undersatisfied': report.userWallCount < report.required,
            'play-board__count--satisfied': report.userWallCount === report.required,
            'play-board__count--oversatisfied': report.userWallCount > report.required,
            'play-board__count--floor-saturated': report.userFloorCount + symbolCount + report.required === report.size,
        });
    }

    private isSolved = () => this.state.assignedWalls.equals(this.props.spec.walls);

    private setBlockState(loc: Location, newState: BlockState | undefined) {
        // console.log(`setBlockState ${loc2Str(loc)} ${newState}`)
        const assignedWalls = this.state.assignedWalls;
        const assignedFloors = this.state.assignedFloors;

        const oldWall = assignedWalls.check(loc);
        const oldFloor = assignedFloors.check(loc);

        switch (newState) {
            case "user-floor":
                assignedWalls.setLoc(loc, false);
                assignedFloors.setLoc(loc, true);
                break;
            case "user-wall":
                assignedWalls.setLoc(loc, true);
                assignedFloors.setLoc(loc, false);
                break;
            case "user-untouched":
                assignedWalls.setLoc(loc, false);
                assignedFloors.setLoc(loc, false);
        }

        // Call for an update if we did anything.
        if (assignedWalls.check(loc) !== oldWall || assignedFloors.check(loc) !== oldFloor)
            this.forceUpdate();
    }

    rangeReport(orientation: 'row' | 'col', order: number) {
        let requiredWalls, userWalls, userFloors, size, treasureCounts, deadEndCounts;
        if (orientation === 'row') {
            requiredWalls = this.props.spec.wallCounts.rows;
            size = this.props.spec.rules.size.width;
            userWalls = this.state.assignedWalls.profile(true).rows;
            userFloors = this.state.assignedFloors.profile(true).rows;
            treasureCounts = this.props.spec.treasure.profile(true).rows;
            deadEndCounts = this.props.spec.deadends.profile(true).rows;
        } else if (orientation === 'col') {
            requiredWalls = this.props.spec.wallCounts.cols;
            size = this.props.spec.rules.size.height;
            userWalls = this.state.assignedWalls.profile(true).cols;
            userFloors = this.state.assignedFloors.profile(true).cols;
            treasureCounts = this.props.spec.treasure.profile(true).cols;
            deadEndCounts = this.props.spec.deadends.profile(true).cols;
        } else throw new Error(`Shouldn't happen ever`);

        return {
            order: order,
            orientation: orientation,
            size: size,
            required: requiredWalls[order],
            userWallCount: userWalls[order],
            userFloorCount: userFloors[order],
            deadEndCount: deadEndCounts[order],
            treasureCount: treasureCounts[order],
        } as RangeReport;
    }

    // Whether the player should ba allowed to change the appearance of a square in any way while playing.
    isImmutable(loc: Location) {
        const {deadends, treasure} = this.props.spec;
        return deadends.check(loc) || treasure.check(loc);
    }

    blockState(loc: Location): BlockState {
        if (this.isImmutable(loc)) return 'immutable';
        if (this.state.assignedWalls.check(loc)) return 'user-wall';
        if (this.state.assignedFloors.check(loc)) return 'user-floor';
        return "user-untouched";
    }

    blockSquareClassnames = (loc: Location, overflows: OverFlowCounter) => {
        const {assignedWalls, assignedFloors} = this.state;
        const isUserFloor = assignedFloors.check(loc);
        const isUserWall = assignedWalls.check(loc);

        const {floors, deadends, treasure, monsterChoices} = this.props.spec;
        const isDeadend = deadends.check(loc);
        const isTreasure = treasure.check(loc);
        const isImmutable = this.isImmutable(loc);
        const monstername = `block-square--monster${monsterChoices.get(loc2Str(loc))}`;
        const isOverflow = overflows.cols.has(loc.x) || overflows.rows.has(loc.y)

        return classNames({
            'block-square': true,
            'block-square--user-wall': isUserWall,
            'block-square--user-floor': isUserFloor,
            'block-square--user-untouched': !isImmutable && !isUserFloor && !isUserWall,
            'block-square--immutable': isImmutable,
            'block-square--deadend': isDeadend,
            'block-square--overflow': isOverflow,
            [monstername]: isDeadend,
            'block-square--treasure': isTreasure,
        });
    }

    private performClickBehaviour(loc: Location) {
        if (!this.mouseBehaviour) {
            console.log(`performBehaviour with no mouseBehaviour set`);
            return;
        }
        // Can't monkey with a solved puzzle.
        if (this.props.lockWhenSolved && this.isSolved()) return;

        let newState: BlockState | undefined;
        switch (this.blockState(loc)) {
            case "user-wall":
                newState = this.mouseBehaviour.mouseAction.userwall;
                break;
            case "user-floor":
                newState = this.mouseBehaviour.mouseAction.userfloor;
                break;
            case "user-untouched":
                newState = this.mouseBehaviour.mouseAction.useruntouched;
                break;
        }
        this.setBlockState(loc, newState);
    }

    // square it is over when the mouse if first pressed.
    private mouseDownFn(loc: Location): MouseEventHandler<HTMLDivElement> {
        return (e) => {
            // 2nd click does nothing.
            if (this.stateBeforeClick) return;

            let action: MouseAction = {};
            const initialButtons = e.buttons;
            const initialBlockState = this.blockState(loc);

            // console.log(`Mousedown inner buttons ${e.buttons}`)

            if (initialButtons === 1) {
                // Left click
                switch (initialBlockState) {
                    case "user-untouched":
                        action = {useruntouched: 'user-wall',}
                        break;
                    case "user-floor":
                        action = {useruntouched: 'user-wall', userfloor: 'user-wall'}
                        break;
                    case "user-wall":
                        action = {userwall: 'user-untouched', userfloor: 'user-untouched'}
                }
            } else if (initialButtons === 2) {
                // Right click
                switch (initialBlockState) {
                    case "user-untouched":
                        action = {useruntouched: 'user-floor',}
                        break;
                    case "user-wall":
                        action = {userwall: 'user-untouched', userfloor: 'user-untouched'}
                        break;
                    case "user-floor":
                        action = {userwall: 'user-untouched', userfloor: 'user-untouched'}
                        break;
                }
            }

            this.stateBeforeClick = {
                assignedWalls: this.state.assignedWalls.copy(),
                assignedFloors: this.state.assignedFloors.copy(),
            }
            this.mouseBehaviour = {
                initialButtons: initialButtons,
                initialBlockState: initialBlockState,
                mouseAction: action,
            }
            this.performClickBehaviour(loc);
        }
    }

    private columnHints() {
        const solutionWalls = this.props.spec.wallCounts;
        return <>
            <div className={'play-board--topcorner'} key={'topcorner'}/>
            {solutionWalls.cols.map((cnt, i) =>
                <div className={this.counterClasses('col', i)}
                     key={`colhint${i}`}>
                    {cnt}
                    {/*<p className={'play-board__count__text'}> {cnt}</p>*/}
                </div>)}

        </>
    }


}
