import { memo, ReactNode, useEffect, useMemo, useState } from 'react';
import { Button, Flex, Form, Input, InputNumber, Select, Slider, Spin, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageTitleSpan from '@/components/spans/PageTitleSpan.tsx';
import QwenLogo from '@/assets/svgs/qwen.svg?react';
import OpenAILogo from '@/assets/svgs/logo-openai.svg?react';
import OllamaLogo from '@/assets/svgs/logo-ollama.svg?react';
import AnthropicLogo from '@/assets/svgs/logo-anthropic.svg?react';
import CheckSvg from '@/assets/svgs/check-circle.svg?react';
import GoogleLogo from '@/assets/svgs/logo-google.svg?react';
import { FridayConfig } from '@shared/config/friday.ts';
import { useTranslation } from 'react-i18next';
import { useMessageApi } from '@/context/MessageApiContext.tsx';
import { RouterPath } from '@/pages/RouterPath.ts';
import { useFridaySettingRoom } from '@/context/FridaySettingRoomContext.tsx';

interface ModelOptionProps {
    logo: ReactNode;
    name: string;
}

const ModelOption = ({ logo, name }: ModelOptionProps) => {
    return (
        <Flex gap={'small'} align={'center'}>
            {logo}
            {name}
        </Flex>
    );
};

const SettingPage = () => {
    const navigate = useNavigate();
    const { messageApi } = useMessageApi();
    const { t } = useTranslation();
    const formItemLayout = {
        labelCol: {
            xs: { span: 24 },
            sm: { span: 8 },
        },
        wrapperCol: {
            xs: { span: 24 },
            sm: { span: 8 },
        },
    };
    const {
        loadingConfig,
        verifyPythonEnv,
        fridayConfig,
        saveFridayConfig,
        installFridayRequirements,
    } = useFridaySettingRoom();
    const [loading, setLoading] = useState<boolean>(false);
    const [form] = Form.useForm();
    const [btnText, setBtnText] = useState<string>("Let's Go!");
    const [btnIcon, setBtnIcon] = useState<ReactNode>(null);

    // Load the existing Friday config if it exists
    useEffect(() => {
        if (fridayConfig) {
            form.setFieldsValue(fridayConfig);
        }
    }, [fridayConfig]);

    const tailFormItemLayout = {
        wrapperCol: {
            xs: {
                span: 24,
                offset: 0,
            },
            sm: {
                span: 16,
                offset: 8,
            },
        },
    };

    const llmProvider = Form.useWatch('llmProvider', form);
    const requiredAPIKey = useMemo(() => {
        return llmProvider ? llmProvider !== 'ollama' : false;
    }, [llmProvider]);

    const disabledAPIKey = useMemo(() => {
        return !llmProvider || llmProvider.startsWith('ollama');
    }, [llmProvider]);

    const modelNameHelp = useMemo(() => {
        if (!llmProvider) {
            return t('help.friday.model-name', { llmProvider });
        }
        const specificKey = `help.friday.model-name-${llmProvider}`;
        return t(specificKey);
    }, [llmProvider, t]);

    const visionModelNameHelp = useMemo(() => {
        if (!llmProvider) {
            return t('help.friday.vision-model-name', { llmProvider });
        }
        const specificKey = `help.friday.vision-model-name-${llmProvider}`;
        return t(specificKey);
    }, [llmProvider, t]);

    return (
        <div className="flex flex-col w-full h-full pl-12 pr-12 pt-8 pb-8 gap-13">
            <div className="flex flex-col w-full gap-2">
                <PageTitleSpan title={'Friday'} />
                <Flex style={{ color: 'var(--muted-foreground)' }}>
                    {t('description.friday')}
                </Flex>
            </div>

            <Spin spinning={loadingConfig}>
                <Form
                    className="flex flex-col gap-y-6"
                    variant={'filled'}
                    form={form}
                    initialValues={{
                        writePermission: false,
                        debateConfig: {
                            enabled: false,
                            agentCount: 3,
                            rounds: 3,
                        },
                    }}
                    onFinish={async (config: FridayConfig) => {
                        setLoading(true);
                        setBtnText(
                            t('message.friday.info-install-requirements'),
                        );
                        setBtnIcon(null);
                        const installFridayRequirementsRes =
                            await installFridayRequirements(config.pythonEnv);
                        if (installFridayRequirementsRes.success) {
                            setBtnIcon(
                                <CheckSvg
                                    width={14}
                                    height={14}
                                    fill={'#04b304'}
                                />,
                            );
                            setBtnText(
                                t(
                                    'message.friday.success-install-requirements',
                                ),
                            );
                            // Wait for 2 seconds to show the success message
                            await new Promise((resolve) =>
                                setTimeout(resolve, 2000),
                            );

                            // Save the config
                            setBtnIcon(null);
                            setBtnText(t('message.friday.info-save-config'));
                            const saveFridayConfigRes =
                                await saveFridayConfig(config);
                            if (saveFridayConfigRes.success) {
                                // wait for 1 second
                                setBtnIcon(
                                    <CheckSvg
                                        width={14}
                                        height={14}
                                        fill={'#04b304'}
                                    />,
                                );
                                setBtnText(
                                    t('message.friday.success-save-config'),
                                );

                                await new Promise((resolve) =>
                                    setTimeout(resolve, 2000),
                                );

                                setLoading(false);
                                navigate(
                                    `${RouterPath.FRIDAY}/${RouterPath.FRIDAY_CHAT}`,
                                );
                            } else {
                                messageApi.error(saveFridayConfigRes.message);
                                setLoading(false);
                            }
                        } else {
                            messageApi.error(
                                installFridayRequirementsRes.message,
                            );
                            setLoading(false);
                        }
                    }}
                    validateTrigger={['onBlur']}
                    {...formItemLayout}
                >
                    <Form.Item
                        name={'pythonEnv'}
                        label={'Python Environment'}
                        hasFeedback={true}
                        rules={[
                            {
                                required: true,
                                message: 'Input the Python env',
                            },
                            {
                                validator: async (_, value) => {
                                    if (!value) return;
                                    const result = await verifyPythonEnv(value);
                                    if (!result.success) {
                                        throw new Error(result.message);
                                    }
                                },
                            },
                        ]}
                    >
                        <Input placeholder={t('help.friday.python-env')} />
                    </Form.Item>
                    <Form.Item
                        name={'llmProvider'}
                        label={'LLM Provider'}
                        required
                    >
                        <Select
                            options={[
                                {
                                    label: (
                                        <ModelOption
                                            logo={
                                                <QwenLogo
                                                    width={17}
                                                    height={17}
                                                />
                                            }
                                            name={'DashScope'}
                                        />
                                    ),
                                    value: 'dashscope',
                                },
                                {
                                    label: (
                                        <ModelOption
                                            logo={
                                                <OpenAILogo
                                                    width={17}
                                                    height={17}
                                                />
                                            }
                                            name={'OpenAI'}
                                        />
                                    ),
                                    value: 'openai',
                                },
                                {
                                    label: (
                                        <ModelOption
                                            logo={
                                                <OllamaLogo
                                                    width={17}
                                                    height={17}
                                                />
                                            }
                                            name={'Ollama'}
                                        />
                                    ),
                                    value: 'ollama',
                                },
                                {
                                    label: (
                                        <ModelOption
                                            logo={
                                                <AnthropicLogo
                                                    width={20}
                                                    height={20}
                                                />
                                            }
                                            name={'Anthropic'}
                                        />
                                    ),
                                    value: 'anthropic',
                                },
                                {
                                    label: (
                                        <ModelOption
                                            logo={
                                                <GoogleLogo
                                                    width={17}
                                                    height={17}
                                                />
                                            }
                                            name={'Google Gemini'}
                                        />
                                    ),
                                    value: 'gemini',
                                },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item
                        name={'modelName'}
                        label={'Language Model Name'}
                        required
                        help={modelNameHelp}
                    >
                        <Input placeholder={
                            llmProvider === 'dashscope' ? 'e.g. qwen-max, qwen-plus' :
                            llmProvider === 'openai' ? 'e.g. gpt-4, gpt-4-turbo' :
                            llmProvider === 'anthropic' ? 'e.g. claude-3-5-sonnet-20241022' :
                            llmProvider === 'gemini' ? 'e.g. gemini-pro, gemini-1.5-flash' :
                            llmProvider === 'ollama' ? 'e.g. llama3, qwen, mistral' :
                            ''
                        } />
                    </Form.Item>
                    <Form.Item
                        name={'visionModelName'}
                        label={'Vision Model Name'}
                        help={visionModelNameHelp}
                    >
                        <Input placeholder={
                            llmProvider === 'dashscope' ? 'e.g. qwen-vl-max, qwen-vl-plus' :
                            llmProvider === 'openai' ? 'e.g. gpt-4o, gpt-4o-mini' :
                            llmProvider === 'anthropic' ? 'e.g. claude-3-opus-20240229' :
                            llmProvider === 'gemini' ? 'e.g. gemini-pro-vision, gemini-1.5-pro' :
                            llmProvider === 'ollama' ? 'e.g. llava, bakllava' :
                            ''
                        } />
                    </Form.Item>
                    <Form.Item
                        name={'apiKey'}
                        label={'API Key'}
                        required={requiredAPIKey}
                        dependencies={['model']}
                        help={t('help.friday.api-key', { llmProvider })}
                    >
                        <Input type={'password'} disabled={disabledAPIKey} />
                    </Form.Item>

                    {!["dashscope","gemini","anthropic"].includes(llmProvider) && (
                        <Form.Item
                            name={'baseUrl'}
                            label={'Base URL'}
                            help={t('help.friday.base-url')}
                        >
                            <Input placeholder={t('help.friday.base-url-placeholder')} />
                        </Form.Item>
                    )}
                    
                    <Form.Item
                        name={'writePermission'}
                        label={'Write Permission'}
                        help={t('help.friday.write-permission')}
                    >
                        <Switch size={'small'} />
                    </Form.Item>

                    <Form.Item
                        name={['debateConfig', 'enabled']}
                        label={'Debate Mode'}
                        help={'Enable multi-agent debate mode for collaborative problem solving'}
                        valuePropName={'checked'}
                    >
                        <Switch size={'small'} />
                    </Form.Item>

                    <Form.Item
                        name={['debateConfig', 'agentCount']}
                        label={'Number of Debaters'}
                        help={'How many agents will participate in the debate (2-5)'}
                        dependencies={[['debateConfig', 'enabled']]}
                    >
                        <Slider
                            min={2}
                            max={5}
                            marks={{ 2: '2', 3: '3', 4: '4', 5: '5' }}
                            disabled={!Form.useWatch(['debateConfig', 'enabled'], form)}
                        />
                    </Form.Item>

                    <Form.Item
                        name={['debateConfig', 'rounds']}
                        label={'Debate Rounds'}
                        help={'Number of debate rounds (1-10)'}
                        dependencies={[['debateConfig', 'enabled']]}
                    >
                        <InputNumber
                            min={1}
                            max={10}
                            style={{ width: '100%' }}
                            disabled={!Form.useWatch(['debateConfig', 'enabled'], form)}
                        />
                    </Form.Item>

                    <Form.Item {...tailFormItemLayout}>
                        <Button
                            type={'primary'}
                            htmlType={'submit'}
                            loading={
                                loading
                                    ? btnIcon
                                        ? { icon: btnIcon }
                                        : true
                                    : false
                            }
                        >
                            {btnText}
                        </Button>
                    </Form.Item>
                </Form>
            </Spin>
        </div>
    );
};

export default memo(SettingPage);
