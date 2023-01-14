import React, {Component, CSSProperties} from 'react';
import './blockBoardVis.css';
import {BoardSpecOld} from "../boardgen/boardgen";
import classNames from "classnames";
import {render} from 'graphology-canvas';
import forceLayout from "graphology-layout-force";
import {Location} from "../boardgen/types";
import {
    expandedGrid,
    GridComponent,
    HorizontalEdgeInfo,
    NodeInfo,
    Speck,
    VerticalEdgeInfo
} from "../boardgen/expandedGrid";
import {loc2Str} from "../boardgen/graphUtils";

type BlockGraphProps = {
    spec: BoardSpecOld,
};
type BlockGraphState = {};

export class BlockBoardVis2 extends Component<BlockGraphProps, BlockGraphState> {
    canvasRef: React.RefObject<HTMLCanvasElement>;

    constructor(props: BlockGraphProps) {
        super(props);
        this.canvasRef = React.createRef();
        this.state = {};
    }

    // TODO: Sort this out
    // https://codesandbox.io/s/eloquent-albattani-1ymeyj?file=/src/index.ts
    //
    drawCanvas = () => {
        const graph = this.props.spec.graph;

        forceLayout.assign(graph, 50);
        //
        // {
        //     const sensibleSettings = forceAtlas2.inferSettings(graph);
        //     forceAtlas2.assign(graph, {
        //         iterations: 5000,
        //         settings: sensibleSettings
        //     });
        // }

        const context = this.canvasRef.current?.getContext('2d')

        if (context) {
            // context.strokeStyle = 'black'
            // context.strokeText('hi', 50, 50,)
            render(graph, context, {batchSize: 500, width: 300})

            // render(graph, context, {width: 300});
        }
    }

    classNames1 = (loc: Location) => {
        const nodeName = loc2Str(loc);
        const {graph, maxDistancePairs} = this.props.spec;
        const present = graph.hasNode(nodeName);

        return classNames({
            'block-square': true,
            'block-square--present': present,
            'block-square--absent': !present,
            'block-square--1neighbour': present && graph.degree(nodeName) === 1,
            'block-square--2neighbour': present && graph.degree(nodeName) === 2,
            'block-square--3neighbour': present && graph.degree(nodeName) === 3,
            'block-square--4neighbour': present && graph.degree(nodeName) === 4,
            'block-square--with-longest-path': maxDistancePairs.some(p => p.some(node => node === nodeName)),
        });
    }


    // export type GridComponent = NodeInfo | HorizontalEdgeInfo | VerticalEdgeInfo | Speck;

    gridComponent = (info: GridComponent, key: number) => {
        const {rules, graph, maxDistancePairs, degrees} = this.props.spec

        let cl: string = '';
        switch (info.myType) {
            case 'NodeInfo': {
                const loc = (info as NodeInfo).loc;
                const nodeName = loc2Str(loc);
                const present = graph.hasNode(nodeName);
                cl = classNames({
                    'block-square': true,
                    'block-square--present': present,
                    'block-square--absent': !present,
                    'block-square--1neighbour': present && graph.degree(nodeName) === 1,
                    'block-square--2neighbour': present && graph.degree(nodeName) === 2,
                    'block-square--3neighbour': present && graph.degree(nodeName) === 3,
                    'block-square--4neighbour': present && graph.degree(nodeName) === 4,
                    'block-square--with-longest-path': maxDistancePairs.some(p => p.some(node => node === nodeName)),
                });
                break;
            }
            case 'VerticalEdgeInfo': {
                const ve = info as VerticalEdgeInfo;
                const edge = ve.edge;
                const edgeExists = graph.hasEdge(loc2Str(edge[0]), loc2Str(edge[1]));
                cl = classNames({
                    'path': true,
                    'path--available': edgeExists,
                    'path--absent': !edgeExists,
                    'path--boundary': ve.boundary,
                });
                break;
            }
            case 'HorizontalEdgeInfo': {
                const he = info as HorizontalEdgeInfo;
                const edge = he.edge;
                const edgeExists = graph.hasEdge(loc2Str(edge[0]), loc2Str(edge[1]));
                cl = classNames({
                    'path': true,
                    'path--available': edgeExists,
                    'path--absent': !edgeExists,
                    'path--boundary': he.boundary,
                });
                break;
            }
            case 'Speck': {
                const speck = info as Speck;
                const edges = speck.relevantEdges;
                const absentNeighbours = edges.filter(edge => graph.hasEdge(loc2Str(edge[0]), loc2Str(edge[1]))).length;

                cl = classNames({
                    'speck': true,
                    'speck--boundary': speck.boundary,
                    'speck--corner': speck.corner,
                    'speck--0path-available': absentNeighbours == 0,
                    'speck--1path-available': absentNeighbours == 1,
                    'speck--2path-available': absentNeighbours == 2,
                    'speck--3path-available': absentNeighbours == 3,
                    'speck--4path-available': absentNeighbours == 4,
                });
                break;
            }

        }
        return <div className={cl} key={key}/>
    }

    render() {
        const {size, wrap} = this.props.spec.rules;
        const st = {
            '--board-height': size.height,
            '--board-width': size.width,
        } as CSSProperties;


        return (<>
                <div className={'block-board-vis2'} style={st}>
                    <div className={'block-board-vis__grid2'}>
                        {expandedGrid(size).map((c, i) => this.gridComponent(c, i))}
                    </div>
                </div>

                {/*<canvas height={300} width={300} ref={this.canvasRef}/>*/}
                {/*<button onClick={this.drawCanvas}>Draw</button>*/}
            </>
        );
    }
}
