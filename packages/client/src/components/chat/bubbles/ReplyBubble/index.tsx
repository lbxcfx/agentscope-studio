import { Avatar, Flex, Tag } from 'antd';
import { memo, useMemo } from 'react';
import { ContentBlocks } from '@shared/types';
import BubbleBlock from '@/components/chat/bubbles/BubbleBlock';
import { useTranslation } from 'react-i18next';
import loadingData from '@/assets/lottie/loading.json';
import Lottie from 'lottie-react';
import LogoIcon from '@/assets/svgs/logo-font.svg?react';

interface Props {
    name: string;
    role: string;
    content: ContentBlocks;
    startTimeStamp: string;
    endTimeStamp?: string;
    finished: boolean;
}

const ReplyBubble = ({
    name,
    role,
    content,
    startTimeStamp,
    endTimeStamp,
    finished,
}: Props) => {
    const { t } = useTranslation();

    const totalTime = endTimeStamp
        ? (
              (new Date(endTimeStamp).getTime() -
                  new Date(startTimeStamp).getTime()) /
              1000
          ).toFixed(1)
        : null;

    // Detect debate messages
    const isDebateMessage = useMemo(() => {
        return name.toLowerCase().includes('debater') ||
               name.toLowerCase().includes('moderator');
    }, [name]);

    // Get debater info
    const debaterInfo = useMemo(() => {
        const match = name.match(/Debater_(\d+)/i);
        if (match) {
            return { type: 'debater', number: parseInt(match[1]) };
        }
        if (name.toLowerCase().includes('moderator')) {
            return { type: 'moderator', number: 0 };
        }
        return null;
    }, [name]);

    // Colors for different debaters
    const debaterColors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
    const getDebaterColor = (num: number) => debaterColors[(num - 1) % debaterColors.length];

    return (
        <Flex
            style={{
                width: '100%',
                maxWidth: 'var(--chat-max-width)',
            }}
            vertical={true}
            gap={3}
        >
            <Flex
                className={'as-reply-bubble'}
                style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 8,
                    ...(isDebateMessage && debaterInfo?.type === 'debater'
                        ? {
                              borderLeft: `4px solid ${getDebaterColor(debaterInfo.number)}`,
                              backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          }
                        : {}),
                }}
                vertical={false}
                gap={'small'}
            >
                {role === 'user' ? null : (
                    <Avatar
                        icon={<LogoIcon width={25} height={25} />}
                        style={{
                            background: isDebateMessage && debaterInfo?.type === 'debater'
                                ? getDebaterColor(debaterInfo.number)
                                : 'white',
                        }}
                    />
                )}
                <Flex
                    style={{ width: 0 }}
                    vertical={true}
                    flex={1}
                    align={role === 'user' ? 'end' : undefined}
                >
                    <Flex
                        style={{
                            height: 32,
                            width: 'fit-content',
                            fontWeight: 500,
                        }}
                        align={'center'}
                        gap={'small'}
                    >
                        {name}
                        {isDebateMessage && debaterInfo && (
                            <Tag
                                color={
                                    debaterInfo.type === 'moderator'
                                        ? 'gold'
                                        : getDebaterColor(debaterInfo.number)
                                }
                                style={{ margin: 0 }}
                            >
                                {debaterInfo.type === 'moderator' ? 'Moderator' : `Debater ${debaterInfo.number}`}
                            </Tag>
                        )}
                    </Flex>
                    <Flex
                        vertical={true}
                        style={{
                            width: role === 'user' ? 'fit-content' : '100%',
                            maxWidth: '100%',
                            height: 'fit-content',
                            wordWrap: 'break-word',
                            wordBreak: 'break-word',
                        }}
                        gap={2}
                    >
                        {content.map((block) => (
                            <BubbleBlock block={block} markdown={true} />
                        ))}
                    </Flex>
                </Flex>
                {role === 'user' ? <Avatar /> : null}
            </Flex>
            <Flex
                style={{
                    color: 'var(--muted-foreground)',
                    fontSize: 12,
                    padding: '0 8px',
                    height: 16,
                }}
                vertical={false}
                align={'center'}
                gap={'small'}
            >
                <div>{startTimeStamp.split('.')[0]}</div>

                {finished ? null : (
                    <Lottie
                        animationData={loadingData}
                        loop={true}
                        autoplay={true}
                        style={{ width: 40 }}
                    />
                )}

                {totalTime ? (
                    <div>{t('chat.title-time-total', { totalTime })}</div>
                ) : null}
            </Flex>
        </Flex>
    );
};

export default memo(ReplyBubble);
