import { memo, ReactNode } from 'react';
import { EmptyPage } from '@/pages/DefaultPage';
import { useRunRoom } from '@/context/RunRoomContext.tsx';
import TraceTree from './TraceTree';
import { useTranslation } from 'react-i18next';
import { MetaDataSection } from '@/pages/DashboardPage/RunPage/TracingComponent/ShareComponents.tsx';
import Latency from '@/pages/DashboardPage/RunPage/TracingComponent/TracePanel/latency.tsx';

export const TracePanel = () => {
    const { trace, spans } = useRunRoom();
    const { t } = useTranslation();

    if (!trace || spans.length === 0) {
        return <EmptyPage size={150} title={t('hint.empty-trace')} />;
    }

    const metadata: Record<string, string | number | undefined | ReactNode> =
        {};
    metadata[t('common.status')] = trace.status;
    metadata[t('common.span-number')] = spans.length;
    metadata[t('common.latency')] = <Latency latency={trace.latencyMs} />;
    return (
        <div className="flex flex-col max-w-full w-full h-full p-4 gap-4">
            <MetaDataSection title={t('common.metadata')} data={metadata} />
            {trace ? (
                <TraceTree spans={spans} />
            ) : (
                <EmptyPage size={150} title={t('hint.empty-trace')} />
            )}
        </div>
    );
};

export default memo(TracePanel);
