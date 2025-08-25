import { BaseEntity, DataSource, ViewColumn, ViewEntity } from 'typeorm';
import { SpanKind } from '../../../shared/src/types/trace';
import { SpanTable } from './Trace';

@ViewEntity({
    expression: (dataSource: DataSource) =>
        dataSource
            .createQueryBuilder()
            .from(SpanTable, 'span')
            .select(
                `COUNT(CASE WHEN span.spanKind = '${SpanKind.LLM}' THEN 1 END)`,
                'totalModelInvocations',
            )
            .addSelect(
                `COALESCE(SUM(CASE 
            WHEN span.spanKind = '${SpanKind.LLM}' AND json_extract(span.attributes, '$.output.usage') IS NOT NULL
            THEN (
                CAST(COALESCE(json_extract(span.attributes, '$.output.usage.input_tokens'), 0) AS INTEGER) +
                CAST(COALESCE(json_extract(span.attributes, '$.output.usage.output_tokens'), 0) AS INTEGER)
            )
            ELSE 0 
        END), 0)`,
                'totalTokens',
            )
            .addSelect(
                `COUNT(CASE 
            WHEN span.spanKind = '${SpanKind.LLM}' AND json_extract(span.attributes, '$.output.usage') IS NOT NULL
            THEN 1 
        END)`,
                'chatModelInvocations',
            )
            // 一个月前的统计
            .addSelect(
                `COALESCE(SUM(CASE 
            WHEN span.spanKind = '${SpanKind.LLM}' AND json_extract(span.attributes, '$.output.usage') IS NOT NULL
                AND span.startTime > strftime('%Y-%m-%d %H:%M:%S', 'now', '-1 month')
            THEN (
                CAST(COALESCE(json_extract(span.attributes, '$.output.usage.input_tokens'), 0) AS INTEGER) +
                CAST(COALESCE(json_extract(span.attributes, '$.output.usage.output_tokens'), 0) AS INTEGER)
            )
            ELSE 0 
        END), 0)`,
                'tokensMonthAgo',
            )
            // 一周前的统计
            .addSelect(
                `COALESCE(SUM(CASE 
            WHEN span.spanKind = '${SpanKind.LLM}' AND json_extract(span.attributes, '$.output.usage') IS NOT NULL
                AND span.startTime > strftime('%Y-%m-%d %H:%M:%S', 'now', '-7 days')
            THEN (
                CAST(COALESCE(json_extract(span.attributes, '$.output.usage.input_tokens'), 0) AS INTEGER) +
                CAST(COALESCE(json_extract(span.attributes, '$.output.usage.output_tokens'), 0) AS INTEGER)
            )
            ELSE 0 
        END), 0)`,
                'tokensWeekAgo',
            )
            // 一年前的统计
            .addSelect(
                `COALESCE(SUM(CASE 
            WHEN span.spanKind = '${SpanKind.LLM}' AND json_extract(span.attributes, '$.output.usage') IS NOT NULL
                AND span.startTime > strftime('%Y-%m-%d %H:%M:%S', 'now', '-1 year')
            THEN (
                CAST(COALESCE(json_extract(span.attributes, '$.output.usage.input_tokens'), 0) AS INTEGER) +
                CAST(COALESCE(json_extract(span.attributes, '$.output.usage.output_tokens'), 0) AS INTEGER)
            )
            ELSE 0 
        END), 0)`,
                'tokensYearAgo',
            )
            // 一个月内的调用次数
            .addSelect(
                `COUNT(CASE 
                    WHEN span.spanKind = '${SpanKind.LLM}' 
                    AND span.startTime > strftime('%Y-%m-%d %H:%M:%S', 'now', '-1 month')
                    THEN 1 
                END)`,
                'modelInvocationsMonthAgo',
            )
            // 一周内的调用次数
            .addSelect(
                `COUNT(CASE 
                    WHEN span.spanKind = '${SpanKind.LLM}' 
                    AND span.startTime > strftime('%Y-%m-%d %H:%M:%S', 'now', '-7 days')
                    THEN 1 
                END)`,
                'modelInvocationsWeekAgo',
            )
            // 一年内的调用次数
            .addSelect(
                `COUNT(CASE 
                    WHEN span.spanKind = '${SpanKind.LLM}' 
                    AND span.startTime > strftime('%Y-%m-%d %H:%M:%S', 'now', '-1 year')
                    THEN 1 
                END)`,
                'modelInvocationsYearAgo',
            ),
})
export class ModelInvocationView extends BaseEntity {
    @ViewColumn()
    totalModelInvocations: number;

    @ViewColumn()
    totalTokens: number;

    @ViewColumn()
    chatModelInvocations: number;

    @ViewColumn()
    tokensWeekAgo: number;

    @ViewColumn()
    tokensMonthAgo: number;

    @ViewColumn()
    tokensYearAgo: number;

    @ViewColumn()
    modelInvocationsWeekAgo: number;

    @ViewColumn()
    modelInvocationsMonthAgo: number;

    @ViewColumn()
    modelInvocationsYearAgo: number;
}
