import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { TourStepProps } from 'antd/es/tour/interface';
import { Tour } from 'antd';

interface TourContextType {
    registerRunPageTourStep: (step: TourStepProps) => void;
}

const TourContext = createContext<TourContextType | null>(null);

interface Props {
    children: ReactNode;
}

export function TourContextProvider({ children }: Props) {
    const [runPageTourPlayed, setRunPageTourPlayed] = useState<boolean>(
        localStorage.getItem('runPageTourPlayed') !== null,
    );
    const onRunPageTourClose = () => {
        localStorage.setItem('runPageTourPlayed', 'true');
        setRunPageTourPlayed(true);
    };

    const [runPageTourSteps, setRunPageTourSteps] = useState<TourStepProps[]>(
        [],
    );

    const runPageTourReady = useMemo(
        () => runPageTourSteps.length >= 4,
        [runPageTourSteps],
    );

    const registerRunPageTourStep = (step: TourStepProps) => {
        setRunPageTourSteps((prevSteps) => {
            const prevTitles = prevSteps.map((step) => step.title);
            if (prevTitles.includes(step.title)) {
                return prevSteps;
            }
            return [...prevSteps, step];
        });
    };

    return (
        <TourContext.Provider
            value={{
                registerRunPageTourStep,
            }}
        >
            {children}
            <Tour
                open={runPageTourReady && !runPageTourPlayed}
                onClose={onRunPageTourClose}
                steps={runPageTourSteps}
            />
        </TourContext.Provider>
    );
}

export function useTour() {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
}
