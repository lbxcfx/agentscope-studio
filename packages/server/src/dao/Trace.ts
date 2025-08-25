import { ModelInvocationData } from '../../../shared/src/types/trpc';
import { ModelInvocationView } from '../models/ModelInvocationView';

import { SpanTable } from '../models/Trace';
import { SpanData, SpanKind } from '../../../shared/src/types/trace';

export class SpanDao {
    static async saveSpans(dataArray: SpanData[]): Promise<SpanTable[]> {
        try {
            // Create SpanTable 实例数组
            const spans = dataArray.map((data) => {
                return SpanTable.create(data);
            });

            // Save all spans in a single transaction
            return await SpanTable.save(spans);
        } catch (error) {
            console.error('Error saving spans:', error);
            throw error;
        }
    }

    static async getModelInvocationViewData() {
        const res = await ModelInvocationView.find();
        if (res.length > 0) {
            return res[0];
        } else {
            throw new Error('ModelInvocationView data not found');
        }
    }

    static async getModelInvocationData(runId: string) {
        // 1. 基础统计
        const basicStats = await SpanTable.createQueryBuilder('span')
            .select(
                `COUNT(CASE WHEN span.spanKind = '${SpanKind.LLM}' THEN 1 END)`,
                'totalInvocations',
            )
            .addSelect(
                `COUNT(CASE WHEN span.spanKind = '${SpanKind.LLM}' AND json_extract(span.attributes, '$.output.usage') IS NOT NULL THEN 1 END)`,
                'chatInvocations',
            )
            .where('span.runId = :runId', { runId })
            .getRawOne();

        // 2. Chat类型的token统计（总计和平均值）
        const chatTokenStats = await SpanTable.createQueryBuilder('span')
            .select([
                // 总计 - input tokens
                `COALESCE(SUM(
                    CASE WHEN span.spanKind = '${SpanKind.LLM}' AND json_extract(span.attributes, '$.output.usage') IS NOT NULL
                    THEN CAST(json_extract(span.attributes, '$.output.usage.input_tokens') AS INTEGER) 
                    ELSE 0 END
                ), 0) as totalPromptTokens`,
                // 总计 - output tokens
                `COALESCE(SUM(
                    CASE WHEN span.spanKind = '${SpanKind.LLM}' AND json_extract(span.attributes, '$.output.usage') IS NOT NULL
                    THEN CAST(json_extract(span.attributes, '$.output.usage.output_tokens') AS INTEGER) 
                    ELSE 0 END
                ), 0) as totalCompletionTokens`,
                // 平均 - input tokens
                `COALESCE(
                    CAST(SUM(
                        CASE WHEN span.spanKind = '${SpanKind.LLM}' AND json_extract(span.attributes, '$.output.usage') IS NOT NULL
                        THEN CAST(json_extract(span.attributes, '$.output.usage.input_tokens') AS INTEGER) 
                        ELSE 0 END
                    ) AS FLOAT) /
                    NULLIF(COUNT(CASE WHEN span.spanKind = '${SpanKind.LLM}' AND json_extract(span.attributes, '$.output.usage') IS NOT NULL THEN 1 END), 0)
                , 0) as avgPromptTokens`,
                // 平均 - output tokens
                `COALESCE(
                    CAST(SUM(
                        CASE WHEN span.spanKind = '${SpanKind.LLM}' AND json_extract(span.attributes, '$.output.usage') IS NOT NULL
                        THEN CAST(json_extract(span.attributes, '$.output.usage.output_tokens') AS INTEGER) 
                        ELSE 0 END
                    ) AS FLOAT) /
                    NULLIF(COUNT(CASE WHEN span.spanKind = '${SpanKind.LLM}' AND json_extract(span.attributes, '$.output.usage') IS NOT NULL THEN 1 END), 0)
                , 0) as avgCompletionTokens`,
            ])
            .where('span.runId = :runId', { runId })
            .getRawOne();

        // 3. 按模型分组的调用次数
        const modelInvocations = await SpanTable.createQueryBuilder('span')
            .select([
                "json_extract(span.attributes, '$.metadata.model_name') as modelName",
                'COUNT(*) as invocations',
            ])
            .where('span.runId = :runId', { runId })
            .andWhere('span.spanKind = :spanKind', { spanKind: SpanKind.LLM })
            .andWhere(
                "json_extract(span.attributes, '$.output.usage') IS NOT NULL",
            )
            .groupBy('modelName')
            .getRawMany();

        // 4. 按模型分组的token统计
        const modelTokenStats = await SpanTable.createQueryBuilder('span')
            .select([
                "json_extract(span.attributes, '$.metadata.model_name') as modelName",
                // 总计
                `SUM(CAST(json_extract(span.attributes, '$.output.usage.input_tokens') AS INTEGER)) as totalPromptTokens`,
                `SUM(CAST(json_extract(span.attributes, '$.output.usage.output_tokens') AS INTEGER)) as totalCompletionTokens`,
                // 平均值
                `CAST(SUM(CAST(json_extract(span.attributes, '$.output.usage.input_tokens') AS INTEGER)) AS FLOAT) / COUNT(*) as avgPromptTokens`,
                `CAST(SUM(CAST(json_extract(span.attributes, '$.output.usage.output_tokens') AS INTEGER)) AS FLOAT) / COUNT(*) as avgCompletionTokens`,
            ])
            .where('span.runId = :runId', { runId })
            .andWhere('span.spanKind = :spanKind', { spanKind: SpanKind.LLM })
            .andWhere(
                "json_extract(span.attributes, '$.output.usage') IS NOT NULL",
            )
            .groupBy('modelName')
            .getRawMany();

        // 5. 构建返回结构
        return {
            modelInvocations: Number(basicStats.totalInvocations),
            chat: {
                modelInvocations: Number(basicStats.chatInvocations),

                totalTokens: {
                    promptTokens: Number(chatTokenStats.totalPromptTokens),
                    completionTokens: Number(
                        chatTokenStats.totalCompletionTokens,
                    ),
                    totalTokens:
                        Number(chatTokenStats.totalPromptTokens) +
                        Number(chatTokenStats.totalCompletionTokens),
                },

                avgTokens: {
                    promptTokens: Number(chatTokenStats.avgPromptTokens),
                    completionTokens: Number(
                        chatTokenStats.avgCompletionTokens,
                    ),
                    totalTokens:
                        Number(chatTokenStats.avgPromptTokens) +
                        Number(chatTokenStats.avgCompletionTokens),
                },

                modelInvocationsByModel: modelInvocations.map((stat) => ({
                    modelName: stat.modelName || 'unknown',
                    invocations: Number(stat.invocations),
                })),

                totalTokensByModel: modelTokenStats.map((stat) => ({
                    modelName: stat.modelName || 'unknown',
                    promptTokens: Number(stat.totalPromptTokens),
                    completionTokens: Number(stat.totalCompletionTokens),
                    totalTokens:
                        Number(stat.totalPromptTokens) +
                        Number(stat.totalCompletionTokens),
                })),

                avgTokensByModel: modelTokenStats.map((stat) => ({
                    modelName: stat.modelName || 'unknown',
                    promptTokens: Number(stat.avgPromptTokens),
                    completionTokens: Number(stat.avgCompletionTokens),
                    totalTokens:
                        Number(stat.avgPromptTokens) +
                        Number(stat.avgCompletionTokens),
                })),
            },
        } as ModelInvocationData;
    }
}
