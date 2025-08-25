import { memo } from 'react';
import { Table, TableColumnsType, TableColumnType } from 'antd';
import EmptyData from '@/components/tables/EmptyData.tsx';
import { useTranslation } from 'react-i18next';
import { TableProps } from 'antd/es/table/InternalTable';
import { renderSortIcon, renderTitle } from '@/components/tables/utils.tsx';

const AsTable = <T extends object>({ columns, ...rest }: TableProps<T>) => {
    const { t } = useTranslation();

    const generalSorter = <K extends keyof T>(a: T, b: T, key: K) => {
        const value = a[key];
        if (typeof value == 'number') {
            return (a[key] as number) - (b[key] as number);
        } else if (typeof value == 'string') {
            return (a[key] as string).localeCompare(b[key] as string);
        }
        return undefined;
    };

    const updatedColumns: TableColumnsType<T> | undefined = columns?.map(
        (column, index) => {
            const props = {
                title: renderTitle(
                    t(
                        `table.column.${column.key?.toString().replace('_', '-')}`,
                    ),
                ),
                dataIndex: column.key,
                ellipsis: true,
                sorter: (a: T, b: T) =>
                    generalSorter(a, b, column.key as keyof T),
                sortIcon: (sortOrder) => renderSortIcon(sortOrder, true),
                ...column,
            } as TableColumnType<T>;

            if (index === 0) {
                props.fixed = 'left';
                props.defaultSortOrder = 'ascend';
            }

            return {
                ...props,
                ...column,
            } as TableColumnType<T>;
        },
    );

    return (
        <Table<T>
            className="h-full w-full border border-border rounded-md"
            columns={updatedColumns}
            locale={{
                emptyText: <EmptyData />,
                cancelSort: t('tooltip.table.cancel-sort'),
                triggerAsc: t('tooltip.table.trigger-asc'),
                triggerDesc: t('tooltip.table.trigger-desc'),
                sortTitle: t('tooltip.table.sort-title'),
                ...rest.locale,
            }}
            size={'small'}
            sticky={true}
            showSorterTooltip={{ target: 'full-header' }}
            {...rest}
        />
    );
};

export default memo(AsTable) as typeof AsTable;
