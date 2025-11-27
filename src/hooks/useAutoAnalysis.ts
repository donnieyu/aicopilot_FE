import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { analyzeProcess } from '../api/workflow';

const DEBOUNCE_TIME = 3000; // 3초간 입력 없으면 분석 시작

export const useAutoAnalysis = () => {
    // [Fix] NodeJS.Timeout 대신 ReturnType<typeof setTimeout> 사용 (브라우저 호환성 해결)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Zustand State 구독
    const nodes = useWorkflowStore((state) => state.nodes);
    const edges = useWorkflowStore((state) => state.edges);
    const setResults = useWorkflowStore((state) => state.setAnalysisResults);

    // 분석 API Mutation
    const { mutate: analyze, isPending } = useMutation({
        mutationFn: analyzeProcess,
        onSuccess: (data) => {
            console.log("🤖 Shadow Architect: Report received", data);
            setResults(data);
        },
        onError: (err) => {
            console.warn("Analysis failed silently:", err);
        }
    });

    useEffect(() => {
        // 1. 변경 발생 시 기존 타이머 취소 (Debounce Reset)
        if (timerRef.current) clearTimeout(timerRef.current);

        // 2. 최소한의 데이터가 있을 때만 타이머 시작
        if (nodes.length === 0) return;

        // 3. 3초 후 실행 예약
        timerRef.current = setTimeout(() => {
            // 전송 데이터 경량화 (UI 속성 제외하고 핵심만 전송)
            const snapshot = {
                nodes: nodes.map(n => ({
                    id: n.id,
                    type: n.type,
                    label: n.data.label,
                    nextActivityId: n.data.nextActivityId,
                    config: n.data.configuration
                })),
                edges: edges.map(e => ({
                    source: e.source,
                    target: e.target,
                    label: e.label
                }))
            };

            // console.log("⏳ User is idle. Triggering analysis...");
            analyze(snapshot);
        }, DEBOUNCE_TIME);

        // Cleanup
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // [Fix] 의존성 배열에 'analyze' 추가 (ESLint 규칙 준수)
    }, [nodes, edges, analyze]);

    return { isAnalyzing: isPending };
};