import { EvaluationMetaData } from '@shared/types';
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';

interface EvaluationListRoomContextType {
    evaluationListData: EvaluationMetaData[] | undefined;
    loading: boolean;
}

const EvaluationListRoomContext =
    createContext<EvaluationListRoomContextType | null>(null);

interface Props {
    benchmark: string | null;
    children: ReactNode;
}

export function EvaluationListRoomContextProvider({
    benchmark,
    children,
}: Props) {
    const initialData: EvaluationMetaData[] = [
        {
            id: '1',
            name: 'Evaluation 1',
            status: 'running',
            progress: 60,
            createdAt: new Date().toISOString(),
            time: 120441,
            metrics: [
                {
                    name: 'Accuracy',
                    type: 'discrete',
                    enum: ['Low', 'Medium', 'High'],
                },
                {
                    name: 'Response Time',
                    type: 'discrete',
                    enum: [100, 200, 300],
                },
            ],
            repeat: 3,
            results: {},
            report_dir: '',
        },
        {
            id: '2',
            name: 'Evaluation 2',
            status: 'done',
            progress: 60,
            createdAt: new Date().toISOString(),
            time: 120441,
            metrics: [
                {
                    name: 'Accuracy',
                    type: 'discrete',
                    enum: ['Low', 'Medium', 'High'],
                },
                {
                    name: 'Response Time',
                    type: 'discrete',
                    enum: [100, 200, 300],
                },
            ],
            repeat: 3,
            results: {},
            report_dir: '',
        },
        {
            id: '2',
            name: 'Evaluation 2',
            status: 'pending',
            progress: 60,
            createdAt: new Date().toISOString(),
            time: 120441,
            metrics: [
                {
                    name: 'Accuracy',
                    type: 'discrete',
                    enum: ['Low', 'Medium', 'High'],
                },
                {
                    name: 'Response Time',
                    type: 'discrete',
                    enum: [100, 200, 300],
                },
            ],
            repeat: 3,
            results: {},
            report_dir: '',
        },
        {
            id: '2',
            name: 'Evaluation 2',
            status: 'unknown',
            progress: 60,
            createdAt: new Date().toISOString(),
            time: 120441,
            metrics: [
                {
                    name: 'Accuracy',
                    type: 'discrete',
                    enum: ['Low', 'Medium', 'High'],
                },
                {
                    name: 'Response Time',
                    type: 'discrete',
                    enum: [100, 200, 300],
                },
            ],
            repeat: 3,
            results: {},
            report_dir: '',
        },
    ];

    const [evaluationListData] = useState<EvaluationMetaData[] | undefined>(
        initialData,
    );
    const [loading] = useState<boolean>(false);

    useEffect(() => {
        // TODO:
    }, [benchmark]);

    return (
        <EvaluationListRoomContext.Provider
            value={{ evaluationListData, loading }}
        >
            {children}
        </EvaluationListRoomContext.Provider>
    );
}

export function useEvaluationListRoom() {
    const context = useContext(EvaluationListRoomContext);
    if (!context) {
        throw new Error(
            'useEvaluationListRoom must be used within an EvaluationListRoomContextProvider',
        );
    }
    return context;
}
