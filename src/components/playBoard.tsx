import React, {Component, CSSProperties, MouseEventHandler} from 'react';
import classNames from "classnames";
import {Linestats, Location} from "../boardgen/types";
import {gridLocations, loc2Str} from "../boardgen/graphUtils";
import {DDBoardSpec} from "../boardgen/ddBoardgen";
import '../css/playBoard.css';
import {MutableGrid} from "../boardgen/mutableGrid";

export type PlayBoardProps = {
    spec: DDBoardSpec,
    scale?: number,
};
type PlayBoardState = {
    assignedWalls: MutableGrid,
    assignedFloors: MutableGrid,
};

type WallChange = {
    locs: Location[],
    before: [boolean, boolean],
    after: [boolean, boolean],
}

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

export class PlayBoard extends Component<PlayBoardProps, PlayBoardState> {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    undoStack: PlayBoardState[];
    stateBeforeClick: PlayBoardState;
    mouseBehaviour?: MouseBehaviour;

    constructor(props: PlayBoardProps) {
        super(props);
        this.undoStack = [];
        this.canvasRef = React.createRef();
        this.stateBeforeClick = {
            assignedWalls: new MutableGrid(props.spec.rules.size, false),
            assignedFloors: new MutableGrid(props.spec.rules.size, false),
        }
        this.state = {
            assignedWalls: new MutableGrid(props.spec.rules.size, false),
            assignedFloors: new MutableGrid(props.spec.rules.size, false),
        };
    }

    public reset() {
        const size = this.props.spec.rules.size;
        this.undoStack = [];
        this.setState({
            assignedFloors: new MutableGrid(size, false),
            assignedWalls: new MutableGrid(size, false)
        });
    }

    mouseUpGlobal = (e: MouseEvent) => {
        if (!this.stateBeforeClick.assignedFloors.equals(this.state.assignedFloors) ||
            !this.stateBeforeClick.assignedWalls.equals(this.state.assignedWalls)) {
            this.undoStack.push(this.stateBeforeClick);
        }
        this.mouseBehaviour = undefined;
    }

    onContextMenu = (e: MouseEvent) => e.preventDefault();

    keyPress = (e: KeyboardEvent) => {
        // console.log(`keypress ${e.key} code ${e.code}`);

        // You can't undo while clicking stuff. That's just weird.
        if (this.mouseBehaviour) return;
        if (e.code == 'KeyZ' && e.ctrlKey) this.attemptUndo();
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

    blockSquareClassnames = (loc: Location) => {
        const {assignedWalls, assignedFloors} = this.state;
        const isUserFloor = assignedFloors.check(loc);
        const isUserWall = assignedWalls.check(loc);

        const {floors, deadends, treasure} = this.props.spec;
        const isDeadend = deadends.check(loc);
        const isTreasure = treasure.check(loc);
        const isImmutable = this.isImmutable(loc);

        return classNames({
            'block-square': true,
            'block-square--user-wall': isUserWall,
            'block-square--user-floor': isUserFloor,
            'block-square--user-untouched': !isImmutable && !isUserFloor && !isUserWall,
            'block-square--immutable': isImmutable,
            'block-square--deadend': isDeadend,
            'block-square--treasure': isTreasure,
        });
    }

    render() {
        const {size, throneSpec} = this.props.spec.rules;
        const st = {
            '--board-height': size.height,
            '--board-width': size.width,
            '--scale': this.props.scale || 1.0,
            // '--side-color': wrap.wrapX ? 'white' : 'black',
            // '--top-bottom-color': wrap.wrapY ? 'white' : 'black',
        } as CSSProperties;

        const boardClasses = classNames({
            'play-board': true,
            'play-board--completed': this.state.assignedWalls.equals(this.props.spec.walls),
            'play-board--incomplete': !this.state.assignedWalls.equals(this.props.spec.walls),
        })

        // --side-color: black;
        // --top-bottom-color: black;

        const solutionWalls = this.props.spec.wallCounts;
        const userWalls = this.state.assignedWalls.profile(true);

        return (<>

                <div className={boardClasses} style={st}>
                    <div className={'play-board__grid'}>
                        {this.columnHints(userWalls)}
                        {gridLocations(size).map((row, j) => {
                            return <>
                                <div className={this.counterClasses('row', solutionWalls.rows[j], userWalls.rows[j])}
                                     key={`rowhint${j}`}>
                                    {solutionWalls.rows[j]}
                                    {/*<p className={'play-board__count__text'}> {wallCounts.rows[i]}</p>*/}
                                </div>
                                {row.map(loc =>
                                        <div className={this.blockSquareClassnames(loc)}
                                             key={loc2Str(loc)}
                                             onMouseDown={this.mouseDown(loc)}

                                            // onMouseDown={(e) => {
                                            //     console.log(`onMouseDown in ${loc2Str(loc)}`);
                                            //     (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
                                            //     this.captureMouse(loc, e.buttons);
                                            // }}
                                            // onMouseUp={(e) => {
                                            //     // if (e.buttons == 1)
                                            //     //     this.blockClick(loc);
                                            //     // else if (e.buttons == 2)
                                            //     //     this.blockRightClick(loc);
                                            //     console.log(`onMouseUp in ${loc2Str(loc)}`)
                                            // }}
                                             onMouseEnter={(e) => {
                                                 if (e.buttons === this.mouseBehaviour?.initialButtons)
                                                     this.performBehaviour(loc);
                                                 // if (e.buttons == 1) {
                                                 //     console.log(`Entered ${loc2Str(loc)}`);
                                                 //     this.blockClick(loc);
                                                 // }
                                                 // if (e.buttons == 2) {
                                                 //     console.log(`Entered ${loc2Str(loc)} ${e.buttons}`);
                                                 //     this.blockRightClick(loc);
                                                 // }
                                             }}
                                            // onDragOver={(e) => {
                                            //     console.log(`onDragOver ${loc2Str(loc)} with ${e.buttons}`)
                                            //     // if (e.buttons == 1) {
                                            //     //     console.log(`Entered ${loc2Str(loc)}`);
                                            //     //     this.blockClick(loc);
                                            //     // }
                                            //     // if (e.buttons == 2) {
                                            //     //     console.log(`Entered ${loc2Str(loc)} ${e.buttons}`);
                                            //     //     this.blockRightClick(loc);
                                            //     // }
                                            // }}
                                        >
                                            {}
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

    counterClasses(orientation: string, required: number, current: number) {
        let fig: Record<string, boolean> = {};
        fig[`play-board__count`] = true;
        fig[`play-board__count--${orientation}`] = true;
        fig[`play-board__count--undersatisfied`] = current < required;
        fig[`play-board__count--satisfied`] = current == required;
        fig[`play-board__count--oversatisfied`] = current > required;
        return classNames(fig);
    }

    private attemptUndo() {
        const p = this.undoStack.pop();
        console.log(`undo`)
        if (p) this.setState(p)
    }

    private mouseDown(loc: Location): MouseEventHandler<HTMLDivElement> {
        return (e) => {
            let action: MouseAction = {};
            const initialButtons = e.buttons;
            const initialBlockState = this.blockState(loc);

            console.log(`Mousedown inner buttons ${e.buttons}`)

            if (initialButtons == 1) {
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
            } else if (initialButtons == 2) {
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
            this.performBehaviour(loc);
        }
    }

    private performBehaviour(loc: Location) {
        if (!this.mouseBehaviour) {
            console.log(`performBehaviour with no mouseBehaviour set`);
            return;
        }
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

    private setBlockState(loc: Location, newState: BlockState | undefined) {
        console.log(`setBlockState ${loc2Str(loc)} ${newState}`)
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
        if (assignedWalls.check(loc) != oldWall || assignedFloors.check(loc) != oldFloor)
            this.forceUpdate();
    }

    private columnHints(userWalls: Linestats) {
        const solutionWalls = this.props.spec.wallCounts;
        return <>
            <div className={'play-board--topcorner'}/>
            {this.props.spec.wallCounts.cols.map((cnt, i) =>
                <div className={this.counterClasses('col', cnt, userWalls.cols[i])}
                     key={`colhint${i}`}>
                    {cnt}
                    {/*<p className={'play-board__count__text'}> {cnt}</p>*/}
                </div>)}

        </>
    }


}
