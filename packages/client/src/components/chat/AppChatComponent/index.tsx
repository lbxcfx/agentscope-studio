import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { BlockType, ContentBlocks, ImageBlock, ReplyData, SourceType } from '@shared/types';
import { Button, Flex, Tooltip, Upload, UploadFile } from 'antd';
import ArrowDownIcon from '../../../assets/svgs/arrow-down.svg?react';
import DeleteIcon from '../../../assets/svgs/delete.svg?react';
import { RemoveScrollBarStyle } from '@/styles.ts';
import { useTranslation } from 'react-i18next';
import ReplyBubble from '@/components/chat/bubbles/ReplyBubble';
import { useMessageApi } from '@/context/MessageApiContext.tsx';
import Lottie from 'lottie-react';
import loadingData from '@/assets/lottie/loading.json';
import UserInputComponent from '@/components/chat/UserInput';

import type { GetProp, UploadProps } from 'antd';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

interface Props {
    replies: ReplyData[];
    isReplying: boolean;
    moreReplies: boolean;
    onUserInput: (blocksInput: ContentBlocks) => void;
    onInterruptReply: () => void;
    onCleanHistory: () => void;
    isCleaningHistory: boolean;
}

const AppChatComponent = ({
    replies,
    onUserInput,
    isReplying,
    moreReplies,
    onInterruptReply,
    onCleanHistory,
    isCleaningHistory,
}: Props) => {
    const { t } = useTranslation();
    const [attachment, setAttachment] = useState<ContentBlocks>([]);
    const [inputText, setInputText] = useState<string>('');
    const [isAtBottom, setIsAtBottom] = useState<boolean>(false);
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const { messageApi } = useMessageApi();

    const hasUnFinished = replies.some((reply) => !reply.finished);

    useEffect(() => {
        if (isAtBottom) {
            if (messageContainerRef.current) {
                messageContainerRef.current.scrollTop =
                    messageContainerRef.current.scrollHeight;
            }
        }
    }, [replies, isAtBottom]);

    const sendUserInput = useCallback(() => {
        if (isReplying) {
            onInterruptReply();
            return;
        }
        const inputBlocks =
            inputText === ''
                ? attachment
                : ([
                      {
                          type: BlockType.TEXT,
                          text: inputText,
                      },
                      ...attachment,
                  ] as ContentBlocks);

        if (inputBlocks.length === 0) {
            messageApi.error(t('error.empty-input'));
        } else {
            onUserInput(inputBlocks);
            setInputText('');
            setAttachment([]);
        }
    }, [attachment, inputText, isReplying]);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const getBase64 = (file: FileType): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
        }

        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };

    const handleChange: UploadProps['onChange'] = async ({
        fileList: newFileList,
    }) => {
        setFileList(newFileList);

        // Convert uploaded files to ImageBlock format
        const imageBlocks: ContentBlocks = [];
        for (const file of newFileList) {
            if (file.originFileObj && file.status !== 'error') {
                try {
                    const base64String = await getBase64(file.originFileObj as FileType);
                    // Remove the data URL prefix (e.g., "data:image/png;base64,")
                    const base64Data = base64String.split(',')[1];

                    imageBlocks.push({
                        type: BlockType.IMAGE,
                        source: {
                            type: SourceType.BASE64,
                            media_type: file.type || 'image/png',
                            data: base64Data,
                        },
                    } as ImageBlock);
                } catch (error) {
                    console.error('Failed to convert image to base64:', error);
                    messageApi.error(`Failed to process image: ${file.name}`);
                }
            }
        }
        setAttachment(imageBlocks);
    };

    const handleRemove: UploadProps['onRemove'] = (file) => {
        const newFileList = fileList.filter((item) => item.uid !== file.uid);
        setFileList(newFileList);

        // Update attachment to match the new file list
        const updateAttachmentAsync = async () => {
            const imageBlocks: ContentBlocks = [];
            for (const f of newFileList) {
                if (f.originFileObj && f.status !== 'error') {
                    try {
                        const base64String = await getBase64(f.originFileObj as FileType);
                        const base64Data = base64String.split(',')[1];
                        imageBlocks.push({
                            type: BlockType.IMAGE,
                            source: {
                                type: SourceType.BASE64,
                                media_type: f.type || 'image/png',
                                data: base64Data,
                            },
                        } as ImageBlock);
                    } catch (error) {
                        console.error('Failed to convert image to base64:', error);
                    }
                }
            }
            setAttachment(imageBlocks);
        };
        updateAttachmentAsync();
    };
    const uploadRef = useRef<any>(null);

    return (
        <Flex
            style={{
                height: '100%',
                width: '100%',
                padding: 16,
                justifyContent: 'flex-end',
            }}
            vertical={true}
            align={'center'}
            justify={'space-between'}
        >
            <Flex
                ref={messageContainerRef}
                style={{
                    width: '100%',
                    height: 0,
                    overflow: 'auto',
                    marginBottom: 8,
                    ...RemoveScrollBarStyle,
                }}
                vertical={true}
                flex={1}
                gap={'middle'}
                onScrollEnd={(e) => {
                    const target = e.target as HTMLDivElement;
                    const isAtBottom =
                        target.scrollHeight -
                            target.scrollTop -
                            target.clientHeight <
                        100;
                    setIsAtBottom(isAtBottom);
                }}
                align={'center'}
            >
                {replies.map((reply) => {
                    return (
                        <ReplyBubble
                            name={reply.name}
                            role={reply.role}
                            content={reply.content}
                            startTimeStamp={reply.startTimeStamp}
                            endTimeStamp={reply.endTimeStamp}
                            finished={reply.finished}
                        />
                    );
                })}
                {!hasUnFinished && isReplying ? (
                    <Lottie
                        animationData={loadingData}
                        loop={true}
                        autoplay={true}
                        style={{ width: 48 }}
                    />
                ) : null}
            </Flex>

            <Flex
                vertical={true}
                style={{ width: '100%', maxWidth: 'var(--chat-max-width)' }}
                gap={'small'}
                align={'center'}
            >
                <Flex
                    style={{ height: 32, width: '100%', position: 'relative' }}
                    justify={'center'}
                    vertical={false}
                >
                    <Tooltip title={t('tooltip.button.clean-history')}>
                        <Button
                            style={{ position: 'absolute', left: 0 }}
                            icon={<DeleteIcon width={13} height={13} />}
                            type={'dashed'}
                            disabled={isReplying}
                            loading={isCleaningHistory}
                            onClick={onCleanHistory}
                        >
                            {t('action.clean-history')}
                        </Button>
                    </Tooltip>

                    {isAtBottom || replies.length == 0 ? null : (
                        <Tooltip title={t('tooltip.button.scroll-to-bottom')}>
                            <Button
                                icon={
                                    <ArrowDownIcon
                                        width={18}
                                        height={18}
                                        style={{
                                            color: 'var(--muted-foreground)',
                                        }}
                                    />
                                }
                                size={'middle'}
                                shape={'circle'}
                                onClick={() => {
                                    if (messageContainerRef.current) {
                                        messageContainerRef.current.scrollTop =
                                            messageContainerRef.current.scrollHeight;
                                    }
                                }}
                            />
                        </Tooltip>
                    )}
                </Flex>

                <UserInputComponent
                    value={inputText}
                    onChange={setInputText}
                    attachmentChildren={
                        <Upload
                            name={'attachment'}
                            beforeUpload={() => false}
                            action={''}
                            listType={'picture'}
                            fileList={fileList}
                            onPreview={handlePreview}
                            onChange={handleChange}
                            onRemove={handleRemove}
                        >
                            <Button
                                ref={uploadRef}
                                style={{ display: 'none' }}
                            />
                        </Upload>
                    }
                    sendBtnLoading={isReplying}
                    sendBtnDisabled={
                        !isReplying &&
                        inputText === '' &&
                        attachment.length === 0
                    }
                    onSendClick={sendUserInput}
                    onAttachClick={() => uploadRef.current.click()}
                />
            </Flex>
        </Flex>
    );
};

export default memo(AppChatComponent);
