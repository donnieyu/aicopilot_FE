import React, { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    Panel,
    Handle,
    Position,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    MarkerType,
    useReactFlow,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
    type NodeProps,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
} from 'reactflow';
import {
    Wand2, ArrowRight, ArrowDown, LayoutList, Code, GitFork, Database,
    LayoutTemplate, MessageSquare, Library, X, Send, User, Bot,
    Paperclip, Sparkles, UploadCloud, FileText, CheckSquare, Square,
    Trash2, Info, Save, Eye, AlertTriangle, ChevronDown, Split,
    Search, Loader2, RotateCcw, Maximize, Minimize, Columns, Settings2,
    Check, AlertCircle, Locate, Activity, RefreshCw, Server, AlignLeft, Calendar, Type, Hash, List, Zap, GitBranch
} from 'lucide-react';
import { create } from 'zustand';
import { QueryClient, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import clsx from 'clsx';
import 'reactflow/dist/style.css';

/**
 * [PRIME DIRECTIVE]
 * 1. 단일 파일 구조: 모든 스토어, 훅, 컴포넌트를 이 파일 안에 통합합니다.
 * 2. 경로 오류 해결: 모든 로컬 `./store`, `./hooks` 참조를 내부 변수로 대체합니다.
 * 3. 통합 레이아웃: 좌측 MainWorkspace(3탭)와 우측 CopilotPanel(2탭) 구조를 구현합니다.
 */

// =============================================================================
// 1. TYPES & INTERFACES
// =============================================================================

type NodeType = 'USER_TASK' | 'SERVICE_TASK' | 'EXCLUSIVE_GATEWAY' | 'START' | 'END' | 'SWIMLANE';
type MainView = 'CANVAS' | 'DATA' | 'FORM';
type CopilotTab = 'CHAT' | 'KNOWLEDGE';

interface NodeConfiguration {
    configType: 'USER_TASK_CONFIG' | 'EMAIL_CONFIG' | 'GATEWAY_CONFIG';
    participantRole?: string;
    formKey?: string;
    isApproval?: boolean;
    dueDuration?: string;
    conditions?: { expression: string; targetActivityId: string }[];
}

interface Activity {
    id: string;
    type: NodeType;
    label: string;
    swimlaneId?: string;
    description?: string;
    configuration: NodeConfiguration;
    sourceRef?: any;
}

interface ProcessResponse {
    processName: string;
    description: string;
    swimlanes: { swimlaneId: string; name: string }[];
    activities: Activity[];
}

interface AnalysisResult {
    targetNodeId: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    type: string;
    message: string;
    suggestion?: string;
}

// =============================================================================
// 2. STORES (ZUSTAND)
// =============================================================================

const useUiStore = create<{
    mainView: MainView;
    activeCopilotTab: CopilotTab;
    setMainView: (view: MainView) => void;
    setActiveCopilotTab: (tab: CopilotTab) => void;
}>((set) => ({
    mainView: 'CANVAS',
    activeCopilotTab: 'CHAT',
    setMainView: (view) => set({ mainView: view }),
    setActiveCopilotTab: (tab) => set({ activeCopilotTab: tab }),
}));

const useChatStore = create<{
    messages: { id: string; role: 'user' | 'ai'; content: string; timestamp: number }[];
    input: string;
    isTyping: boolean;
    setInput: (v: string) => void;
    addMessage: (role: 'user' | 'ai', content: string) => void;
    setTyping: (v: boolean) => void;
}>((set) => ({
    messages: [{ id: 'welcome', role: 'ai', content: '안녕하세요! 워크플로우 설계를 도와드릴 AI 아키텍트입니다. 왼쪽의 Map, Data, Form 탭을 통해 결과물을 확인하고, 필요한 내용을 채팅으로 말씀해주세요.', timestamp: Date.now() }],
    input: '',
    isTyping: false,
    setInput: (v) => set({ input: v }),
    addMessage: (role, content) => set((s) => ({ messages: [...s.messages, { id: `msg_${Date.now()}`, role, content, timestamp: Date.now() }] })),
    setTyping: (v) => set({ isTyping: v }),
}));

const useAssetStore = create<{
    assets: any[];
    selectedAssetIds: string[];
    uploadAsset: (file: File) => Promise<void>;
    toggleAsset: (id: string) => void;
    removeAsset: (id: string) => void;
}>((set) => ({
    assets: [],
    selectedAssetIds: [],
    uploadAsset: async (file) => {
        const id = `asset_${Date.now()}`;
        set(s => ({ assets: [...s.assets, { id, name: file.name, status: 'ANALYZING', size: file.size }] }));
        await new Promise(r => setTimeout(r, 2000));
        set(s => ({
            assets: s.assets.map(a => a.id === id ? { ...a, status: 'READY', content: `Extracted content from ${file.name}` } : a),
            selectedAssetIds: [...s.selectedAssetIds, id]
        }));
    },
    toggleAsset: (id) => set(s => ({ selectedAssetIds: s.selectedAssetIds.includes(id) ? s.selectedAssetIds.filter(i => i !== id) : [...s.selectedAssetIds, id] })),
    removeAsset: (id) => set(s => ({ assets: s.assets.filter(a => a.id !== id), selectedAssetIds: s.selectedAssetIds.filter(i => i !== id) })),
}));

const useWorkflowStore = create<any>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    analysisResults: {},
    dataEntities: [],
    dataGroups: [],
    formDefinitions: [],
    assetUrl: null,
    viewMode: 'DEFAULT',
    layoutDirection: 'LR',
    onNodesChange: (changes: any) => set((s: any) => ({ nodes: applyNodeChanges(changes, s.nodes) })),
    onEdgesChange: (changes: any) => set((s: any) => ({ edges: applyEdgeChanges(changes, s.edges) })),
    onConnect: (params: any) => set((s: any) => ({ edges: addEdge(params, s.edges) })),
    selectNode: (id: string | null) => set({ selectedNodeId: id }),
    setProcess: (process: ProcessResponse) => {
        const nodes: Node[] = process.activities.map((a, i) => ({
            id: a.id,
            type: a.type,
            data: { label: a.label, configuration: a.configuration },
            position: { x: i * 250, y: 150 }
        }));
        set({ nodes, edges: [] });
    },
    setDataModel: (entities: any[], groups: any[]) => set({ dataEntities: entities, dataGroups: groups }),
    setFormDefinitions: (forms: any[]) => set({ formDefinitions: forms }),
    updateNodeConfiguration: (nodeId: string, config: any) => set((s: any) => ({
        nodes: s.nodes.map((n: Node) => n.id === nodeId ? { ...n, data: { ...n.data, configuration: config } } : n)
    })),
    setAnalysisResults: (results: AnalysisResult[]) => {
        const grouped: Record<string, AnalysisResult[]> = {};
        results.forEach(r => {
            const key = r.targetNodeId || 'global';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        });
        set({ analysisResults: grouped });
    },
    getAvailableVariables: (nodeId: string) => get().dataEntities,
    setViewMode: (mode: any) => set({ viewMode: mode }),
    setLayoutDirection: (dir: any) => set({ layoutDirection: dir }),
}));

// =============================================================================
// 3. API & HELPER LOGIC
// =============================================================================

const queryClient = new QueryClient();
const client = axios.create({ baseURL: '/api', timeout: 60000 });

// =============================================================================
// 4. SUB-COMPONENTS
// =============================================================================

// --- Status Badge ---
const StatusBadge = ({ type }: { type: string }) => {
    const config: any = {
        USER_TASK: { bg: 'bg-blue-50', text: 'text-blue-600', icon: User, label: 'User Task' },
        SERVICE_TASK: { bg: 'bg-purple-50', text: 'text-purple-600', icon: Server, label: 'System' },
        EXCLUSIVE_GATEWAY: { bg: 'bg-orange-50', text: 'text-orange-600', icon: GitBranch, label: 'Gateway' },
        DEFAULT: { bg: 'bg-slate-100', text: 'text-slate-500', icon: Info, label: type }
    };
    const c = config[type] || config.DEFAULT;
    return (
        <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", c.bg, c.text)}>
            <c.icon size={10} /> {c.label}
        </span>
    );
};

// --- Node Config Overlay (Floating on Canvas) ---
function NodeConfigOverlay({ nodeId, onClose }: { nodeId: string | null; onClose: () => void }) {
    const { nodes, updateNodeConfiguration, formDefinitions } = useWorkflowStore();
    const node = nodes.find((n: Node) => n.id === nodeId);
    const [localConfig, setLocalConfig] = useState<any>(node?.data?.configuration || {});

    useEffect(() => {
        if (node) setLocalConfig(node.data.configuration || {});
    }, [nodeId, node]);

    if (!node) return null;

    const handleSave = () => {
        updateNodeConfiguration(node.id, localConfig);
        onClose();
    };

    return (
        <div className="absolute top-4 right-4 bottom-4 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-30 animate-in slide-in-from-right-4">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <div>
                    <StatusBadge type={node.type || ''} />
                    <h3 className="font-bold text-slate-800 mt-1">{node.data.label}</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Participant Role</label>
                    <input
                        className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                        value={localConfig.participantRole || ''}
                        onChange={e => setLocalConfig({...localConfig, participantRole: e.target.value})}
                    />
                </div>
                {node.type === 'USER_TASK' && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Attached Form</label>
                        <select
                            className="w-full border rounded-xl px-3 py-2 text-sm bg-white"
                            value={localConfig.formKey || ''}
                            onChange={e => setLocalConfig({...localConfig, formKey: e.target.value})}
                        >
                            <option value="">None</option>
                            {formDefinitions.map((f: any) => <option key={f.formName} value={f.formName}>{f.formName}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <div className="p-4 border-t">
                <button onClick={handleSave} className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors">Save Changes</button>
            </div>
        </div>
    );
}

// --- Chat Interface (Copilot Tab 1) ---
function ChatInterface() {
    const { messages, input, setInput, addMessage, isTyping, setTyping } = useChatStore();
    const selectedAssetIds = useAssetStore(s => s.selectedAssetIds);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSend = () => {
        if (!input.trim()) return;
        const text = input;
        addMessage('user', text);
        setInput('');
        setTyping(true);
        // Mock AI interaction
        setTimeout(() => {
            addMessage('ai', `"${text}"에 대한 프로세스 설계를 시작합니다. (참고 지식: ${selectedAssetIds.length}건)`);
            setTyping(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map(m => (
                    <div key={m.id} className={clsx("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "")}>
                        <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0", m.role === 'ai' ? "bg-blue-100 text-blue-600" : "bg-slate-200")}>
                            {m.role === 'ai' ? <Bot size={18}/> : <User size={16}/>}
                        </div>
                        <div className={clsx("max-w-[80%] p-3 rounded-2xl text-sm shadow-sm", m.role === 'ai' ? "bg-blue-50 text-slate-800 border border-blue-100 rounded-tl-none" : "bg-white text-slate-700 border border-slate-100 rounded-tr-none")}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {isTyping && <div className="text-[10px] text-slate-400 animate-pulse ml-11 italic">AI Architect is thinking...</div>}
            </div>
            <div className="p-4 bg-white border-t">
                <div className="flex items-end gap-2 bg-slate-50 border rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <textarea
                        className="w-full bg-transparent border-none focus:ring-0 text-sm p-2 resize-none max-h-32"
                        rows={1}
                        placeholder="메시지를 입력하세요..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    />
                    <button onClick={handleSend} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Send size={16}/></button>
                </div>
            </div>
        </div>
    );
}

// --- Asset Manager (Copilot Tab 2) ---
function AssetManager() {
    const { assets, selectedAssetIds, uploadAsset, toggleAsset, removeAsset } = useAssetStore();

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-4 border-b bg-white">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                    <UploadCloud size={24} className="text-indigo-500 mb-2" />
                    <span className="text-xs font-bold text-slate-600">지식 데이터 (이미지/문서) 업로드</span>
                    <input type="file" className="hidden" onChange={e => e.target.files?.[0] && uploadAsset(e.target.files[0])} />
                </label>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {assets.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                        <FileText size={32} className="mx-auto mb-2"/>
                        <p className="text-xs">등록된 지식이 없습니다.</p>
                    </div>
                ) : assets.map(a => (
                    <div key={a.id} className={clsx("p-3 bg-white border rounded-xl flex items-center gap-3", selectedAssetIds.includes(a.id) && "border-indigo-500 ring-1 ring-indigo-500 shadow-sm")}>
                        <button onClick={() => a.status === 'READY' && toggleAsset(a.id)} className={selectedAssetIds.includes(a.id) ? "text-indigo-600" : "text-slate-300"}>
                            {a.status === 'READY' ? (selectedAssetIds.includes(a.id) ? <CheckSquare size={18}/> : <Square size={18}/>) : <Loader2 size={16} className="animate-spin"/>}
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">{a.name}</p>
                            <p className="text-[10px] text-slate-400">{(a.size/1024).toFixed(1)} KB • {a.status}</p>
                        </div>
                        <button onClick={() => removeAsset(a.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Workflow Header (Workspace Navigation) ---
function WorkflowHeader({ activeView, onViewChange }: { activeView: MainView, onViewChange: (v: MainView) => void }) {
    return (
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 z-20">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg"><Wand2 size={18}/></div>
                <div>
                    <h1 className="font-bold text-slate-800 text-sm leading-tight">AI Process Architect</h1>
                    <p className="text-[10px] text-slate-400 font-medium">Co-Architect Mode</p>
                </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={() => onViewChange('CANVAS')} className={clsx("flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all", activeView === 'CANVAS' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                    <GitFork size={12}/> Map
                </button>
                <button onClick={() => onViewChange('DATA')} className={clsx("flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all", activeView === 'DATA' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                    <Database size={12}/> Data
                </button>
                <button onClick={() => onViewChange('FORM')} className={clsx("flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all", activeView === 'FORM' ? "bg-white text-pink-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                    <LayoutTemplate size={12}/> Form
                </button>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-white transition-all">NEW PROJECT</button>
            </div>
        </header>
    );
}

// =============================================================================
// 5. MAIN WORKSPACE
// =============================================================================

function MainWorkspace() {
    const { mainView, setMainView } = useUiStore();
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode, selectedNodeId } = useWorkflowStore();

    const handleNodeClick = useCallback((_: any, node: Node) => selectNode(node.id), [selectNode]);
    const handlePaneClick = useCallback(() => selectNode(null), [selectNode]);

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
            <WorkflowHeader activeView={mainView} onViewChange={setMainView} />

            <div className="flex-1 relative">
                {/* 1. Canvas View */}
                <div className={clsx("w-full h-full absolute inset-0 transition-all duration-500", mainView === 'CANVAS' ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-95 pointer-events-none")}>
                    <div className="w-full h-full relative">
                        {nodes.length > 0 ? (
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onNodeClick={handleNodeClick}
                                onPaneClick={handlePaneClick}
                                fitView
                            >
                                <Background color="#e2e8f0" gap={20} />
                                <Controls />
                                <MiniMap zoomable pannable />
                            </ReactFlow>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-6">
                                <div className="w-24 h-24 border-4 border-dashed border-slate-200 rounded-3xl flex items-center justify-center animate-pulse">
                                    <Sparkles size={32} className="text-slate-200"/>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-slate-400">시작할 준비가 되었습니다.</p>
                                    <p className="text-sm">우측 채팅창에 설계하고 싶은 프로세스를 입력해보세요.</p>
                                </div>
                            </div>
                        )}
                    </div>
                    {selectedNodeId && <NodeConfigOverlay nodeId={selectedNodeId} onClose={() => selectNode(null)} />}
                </div>

                {/* 2. Data Dictionary View (Mock) */}
                <div className={clsx("w-full h-full absolute inset-0 bg-white z-20 transition-all", mainView === 'DATA' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
                    <div className="p-10 max-w-5xl mx-auto space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><Database size={32}/></div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Data Dictionary</h2>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center">
                            <Database size={48} className="mx-auto text-slate-200 mb-4"/>
                            <p className="text-slate-400">채팅을 통해 프로세스가 생성되면 관련 데이터 엔티티가 이곳에 나열됩니다.</p>
                        </div>
                    </div>
                </div>

                {/* 3. Form List View (Mock) */}
                <div className={clsx("w-full h-full absolute inset-0 bg-white z-20 transition-all", mainView === 'FORM' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
                    <div className="p-10 max-w-5xl mx-auto space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl"><LayoutTemplate size={32}/></div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Form List</h2>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 text-center">
                            <LayoutTemplate size={48} className="mx-auto text-slate-200 mb-4"/>
                            <p className="text-slate-400">워크플로우 각 단계에서 사용될 UI 폼 목록이 이곳에 생성됩니다.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// 6. COPILOT PANEL
// =============================================================================

function CopilotPanel() {
    const { activeCopilotTab, setActiveCopilotTab } = useUiStore();

    return (
        <div className="w-[450px] shrink-0 h-full bg-white flex flex-col shadow-2xl z-10 relative border-l border-slate-200">
            {/* Tab Header */}
            <div className="flex border-b border-slate-100 h-16 shrink-0 bg-white">
                <button
                    onClick={() => setActiveCopilotTab('CHAT')}
                    className={clsx(
                        "flex-1 text-xs font-black flex items-center justify-center gap-2 border-b-2 transition-all tracking-widest",
                        activeCopilotTab === 'CHAT' ? "border-blue-600 text-blue-600 bg-blue-50/30" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                >
                    <MessageSquare size={14}/> CHAT
                </button>
                <button
                    onClick={() => setActiveCopilotTab('KNOWLEDGE')}
                    className={clsx(
                        "flex-1 text-xs font-black flex items-center justify-center gap-2 border-b-2 transition-all tracking-widest",
                        activeCopilotTab === 'KNOWLEDGE' ? "border-indigo-600 text-indigo-600 bg-indigo-50/30" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                >
                    <Library size={14}/> KNOWLEDGE
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden relative bg-slate-50">
                <div className={clsx("absolute inset-0 transition-all duration-300", activeCopilotTab === 'CHAT' ? "opacity-100 z-10 translate-x-0" : "opacity-0 z-0 translate-x-8 pointer-events-none")}>
                    <ChatInterface />
                </div>
                <div className={clsx("absolute inset-0 transition-all duration-300", activeCopilotTab === 'KNOWLEDGE' ? "opacity-100 z-10 translate-x-0" : "opacity-0 z-0 -translate-x-8 pointer-events-none")}>
                    <AssetManager />
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// 7. ROOT APP COMPONENT
// =============================================================================

function WorkflowDesignerApp() {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans">
            {/* 좌측 메인 영역 */}
            <MainWorkspace />

            {/* 우측 코파일럿 패널 */}
            <CopilotPanel />
        </div>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ReactFlowProvider>
                <WorkflowDesignerApp />
            </ReactFlowProvider>
        </QueryClientProvider>
    );
}