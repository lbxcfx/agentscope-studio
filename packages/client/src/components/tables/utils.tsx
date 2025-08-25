import { SortOrder } from 'antd/lib/table/interface';
import SortIcon from '@/assets/svgs/sort.svg?react';
import ArrowUpIcon from '@/assets/svgs/arrow-up.svg?react';
import ArrowDownIcon from '@/assets/svgs/arrow-down.svg?react';
import RunningStatus from '@/assets/svgs/status-running.svg?react';
import UnknownStatus from '@/assets/svgs/status-unknown.svg?react';
import PendingStatus from '@/assets/svgs/status-pending.svg?react';
import DoneStatus from '@/assets/svgs/status-done.svg?react';
import { memo } from 'react';
import NumberCounter from '../numbers/NumberCounter';
import { Progress } from 'antd';
import { Status } from '@shared/types';
import { useTranslation } from 'react-i18next';

interface TableProgressProps {
    progress: number;
    selected: boolean;
}

export const ProgressCell = memo(
    ({ progress, selected }: TableProgressProps) => {
        return (
            <div className="flex flex-row items-center gap-2">
                <Progress
                    percent={progress}
                    steps={5}
                    showInfo={false}
                    strokeColor={
                        selected
                            ? 'var(--primary-foreground)'
                            : 'var(--primary)'
                    }
                    style={{ color: 'red !important' }}
                />
                <div
                    className={
                        selected
                            ? 'text-[var(--primary-foreground)]'
                            : undefined
                    }
                >
                    {progress}%
                </div>
            </div>
        );
    },
);

export const StatusCell = memo(
    ({ status, selected }: { status: Status; selected: boolean }) => {
        const { t } = useTranslation();
        let statusText, icon;
        switch (status) {
            case Status.RUNNING:
                icon = <RunningStatus width={13} height={13} />;
                statusText = t('status.running');
                break;
            case Status.PENDING:
                icon = <PendingStatus width={13} height={13} />;
                statusText = t('status.pending');
                break;
            case Status.DONE:
                icon = (
                    <DoneStatus
                        className="fill-green-500"
                        width={13}
                        height={13}
                    />
                );
                statusText = t('status.done');
                break;
            default:
                icon = <UnknownStatus width={13} height={13} />;
                statusText = t('status.unknown');
                break;
        }
        return (
            <div
                className={`text-[12px] flex flex-row items-center gap-1 border border-border w-fit pl-1 pr-1 rounded-md ${selected ? 'text-primary-foreground' : 'text-muted-foreground'}`}
            >
                {icon}
                {statusText}
            </div>
        );
    },
);

export const NumberCell = memo(
    ({ number, selected }: { number: number; selected: boolean }) => {
        return (
            <div className={selected ? 'text-primary-foreground' : undefined}>
                <NumberCounter number={number} style={{ paddingBottom: 2 }} />
            </div>
        );
    },
);

export const DurationCell = memo(
    ({ number, selected }: { number: number; selected: boolean }) => {
        let day = 0;
        let hour = 0;
        let min = 0;

        if (number < 60) {
            min = number;
        } else if (60 <= number && number < 60 * 24) {
            hour = Math.floor(number / 60);
            min = number % 60;
        } else if (number >= 60 * 24) {
            console.log('ere');
            day = Math.floor(number / (60 * 24));
            hour = Math.floor((number % (60 * 24)) / 60);
            min = number % 60;
        }

        return (
            <div
                className={`flex flex-row gap-1 items-center ${selected ? 'text-primary-foreground' : 'text-primary'}`}
            >
                {day > 0 ? (
                    <div className="flex flex-row items-center">
                        <NumberCell number={day} selected={selected} />d
                    </div>
                ) : null}
                {hour > 0 ? (
                    <div className="flex flex-row items-center">
                        <NumberCell number={hour} selected={selected} />h
                    </div>
                ) : null}
                {(hour > 0 || day > 0) && min === 0 ? null : (
                    <div className="flex flex-row items-center">
                        <NumberCell number={min} selected={selected} />m
                    </div>
                )}
            </div>
        );
    },
);

export const TextCell = memo(
    ({ text, selected }: { text: string; selected: boolean }) => {
        return (
            <div
                className={`truncate text-sm ${selected ? 'text-primary-foreground' : 'text-primary'}`}
            >
                {text}
            </div>
        );
    },
);

export const renderSortIcon = (
    sortOrder: { sortOrder: SortOrder },
    nullAsDefault: boolean = false,
) => {
    switch (sortOrder.sortOrder) {
        case 'ascend':
            return <ArrowUpIcon width={16} height={16} />;
        case 'descend':
            return <ArrowDownIcon width={16} height={16} />;
        case null:
            if (nullAsDefault) {
                return <SortIcon width={16} height={16} />;
            }
            return undefined;
        default:
            return <SortIcon width={16} height={16} />;
    }
};

export const renderTitle = (title: string, fontSize = 12) => {
    return (
        <span
            style={{
                fontSize: fontSize,
                fontWeight: 500,
                userSelect: 'none',
            }}
        >
            {title}
        </span>
    );
};
