import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  ReactFlow,
  type Node,
  type Edge,
  type OnNodesChange,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  applyNodeChanges,
} from "@xyflow/react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import "@xyflow/react/dist/style.css";

import { useGetRelations } from "../../API/releases";
import Spinner from "../Spinner";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

const KIND_COLORS: Record<string, { bg: string; border: string }> = {
  Deployment: { bg: "#dbeafe", border: "#2563eb" },
  StatefulSet: { bg: "#dbeafe", border: "#2563eb" },
  DaemonSet: { bg: "#dbeafe", border: "#2563eb" },
  ReplicaSet: { bg: "#dbeafe", border: "#2563eb" },
  Job: { bg: "#dbeafe", border: "#2563eb" },
  CronJob: { bg: "#dbeafe", border: "#2563eb" },
  Pod: { bg: "#dbeafe", border: "#2563eb" },
  Service: { bg: "#ede9fe", border: "#7c3aed" },
  Ingress: { bg: "#ede9fe", border: "#7c3aed" },
  NetworkPolicy: { bg: "#ede9fe", border: "#7c3aed" },
  ConfigMap: { bg: "#fef3c7", border: "#d97706" },
  Secret: { bg: "#fef3c7", border: "#d97706" },
  ServiceAccount: { bg: "#d1fae5", border: "#059669" },
  Role: { bg: "#d1fae5", border: "#059669" },
  ClusterRole: { bg: "#d1fae5", border: "#059669" },
  RoleBinding: { bg: "#d1fae5", border: "#059669" },
  ClusterRoleBinding: { bg: "#d1fae5", border: "#059669" },
  PersistentVolumeClaim: { bg: "#fce7f3", border: "#db2777" },
  PersistentVolume: { bg: "#fce7f3", border: "#db2777" },
  StorageClass: { bg: "#fce7f3", border: "#db2777" },
};

const DEFAULT_COLOR = { bg: "#eff6ff", border: "#1347ff" };
const GHOST_COLOR = { bg: "#f3f4f6", border: "#9ca3af" };

interface SimNode extends SimulationNodeDatum {
  id: string;
}

interface ForceLayoutResult {
  nodes: Node[];
  pinNode: (id: string, x: number, y: number) => void;
  unpinNode: (id: string) => void;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

function useForceLayout(
  sourceNodes: Node[],
  sourceEdges: Edge[]
): ForceLayoutResult {
  const [nodes, setNodes] = useState<Node[]>([]);
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(
    null
  );
  const sourceNodesRef = useRef(sourceNodes);
  useEffect(() => {
    sourceNodesRef.current = sourceNodes;
  }, [sourceNodes]);

  useEffect(() => {
    if (!sourceNodes.length) {
      return;
    }

    const radius = Math.max(300, sourceNodes.length * 30);
    const simNodes: SimNode[] = sourceNodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / sourceNodes.length - Math.PI / 2;
      return {
        id: n.id,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      };
    });

    const nodeById = new Map(simNodes.map((n) => [n.id, n]));

    const simLinks: SimulationLinkDatum<SimNode>[] = sourceEdges
      .filter((e) => nodeById.has(e.source) && nodeById.has(e.target))
      .map((e) => ({
        source: nodeById.get(e.source) as SimNode,
        target: nodeById.get(e.target) as SimNode,
      }));

    simRef.current?.stop();

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
          .id((d: SimNode) => d.id)
          .distance(200)
      )
      .force("charge", forceManyBody().strength(-800))
      .force("center", forceCenter(0, 0))
      .force("collide", forceCollide(NODE_WIDTH * 0.7))
      .alphaDecay(0.02)
      .on("tick", () => {
        const current = sourceNodesRef.current;
        setNodes(
          current.map((n, i) => ({
            ...n,
            position: {
              x: (simNodes[i].x ?? 0) - NODE_WIDTH / 2,
              y: (simNodes[i].y ?? 0) - NODE_HEIGHT / 2,
            },
          }))
        );
      });

    simRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [sourceNodes, sourceEdges]);

  const pinNode = useCallback((nodeId: string, x: number, y: number) => {
    const sim = simRef.current;
    if (!sim) return;
    const simNode = sim.nodes().find((n: SimNode) => n.id === nodeId);
    if (simNode) {
      simNode.fx = x + NODE_WIDTH / 2;
      simNode.fy = y + NODE_HEIGHT / 2;
      sim.alpha(0.3).restart();
    }
  }, []);

  const unpinNode = useCallback((nodeId: string) => {
    const sim = simRef.current;
    if (!sim) return;
    const simNode = sim.nodes().find((n: SimNode) => n.id === nodeId);
    if (simNode) {
      simNode.fx = null;
      simNode.fy = null;
      sim.alpha(0.3).restart();
    }
  }, []);

  return { nodes, setNodes, pinNode, unpinNode };
}

export default function RevisionRelations() {
  const { namespace = "", chart = "" } = useParams();
  const { data, isLoading } = useGetRelations(namespace, chart);

  const { rfNodes, rfEdges } = useMemo(() => {
    if (!data?.nodes?.length) {
      return { rfNodes: [] as Node[], rfEdges: [] as Edge[] };
    }

    const builtNodes: Node[] = data.nodes.map((n) => {
      const color = n.inRelease
        ? (KIND_COLORS[n.kind] ?? DEFAULT_COLOR)
        : GHOST_COLOR;
      return {
        id: n.id,
        data: { label: `${n.kind}\n${n.name}` },
        position: { x: 0, y: 0 },
        draggable: true,
        style: {
          background: color.bg,
          border: `2px ${n.inRelease ? "solid" : "dashed"} ${color.border}`,
          borderRadius: n.inRelease ? "6px" : "50%",
          padding: n.inRelease ? "8px 12px" : "12px 20px",
          fontSize: "12px",
          fontWeight: 500,
          whiteSpace: "pre-line" as const,
          width: NODE_WIDTH,
          textAlign: "center" as const,
          ...(n.inRelease ? {} : { color: "#6b7280" }),
        },
      };
    });

    const builtEdges: Edge[] = data.edges.map((e, i) => ({
      id: `e-${i}`,
      source: e.source,
      target: e.target,
      label: e.type,
      type: "default",
      style: { stroke: "#9ca3af" },
      labelStyle: { fontSize: 10, fill: "#6b7280" },
      markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
    }));

    return { rfNodes: builtNodes, rfEdges: builtEdges };
  }, [data]);

  const { nodes, setNodes, pinNode, unpinNode } = useForceLayout(
    rfNodes,
    rfEdges
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onNodeDrag = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      pinNode(node.id, node.position.x, node.position.y);
    },
    [pinNode]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      unpinNode(node.id);
    },
    [unpinNode]
  );

  if (isLoading) return <Spinner />;

  if (!nodes.length) {
    return (
      <div className="mt-3 rounded-sm bg-white p-4 text-sm shadow-sm">
        No resource relations found in this release.
      </div>
    );
  }

  return (
    <div className="mt-3 h-[600px] rounded-sm bg-white shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeWidth={2}
          nodeColor={(n: Node) => {
            const found = nodes.find((nd) => nd.id === n.id);
            const borderStr = String(found?.style?.border ?? "");
            return borderStr.includes("dashed") ? "#e5e7eb" : "#dbeafe";
          }}
        />
      </ReactFlow>
    </div>
  );
}
