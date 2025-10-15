import { memo } from 'react';
import { Layout } from 'antd';
import TitleBar from '../../components/titlebar/TitleBar.tsx';
import ChatPage from '@/pages/FridayPage/ChatPage';
import { FridayAppRoomContextProvider } from '@/context/FridayAppRoomContext.tsx';
import SettingPage from '@/pages/FridayPage/SettingPage';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RouterPath } from '@/pages/RouterPath.ts';
import { FridaySettingRoomContextProvider } from '@/context/FridaySettingRoomContext.tsx';

const FridayPage = () => {
    const { Content } = Layout;

    return (
        <Layout style={{ width: '100%', height: '100%' }}>
            <TitleBar title={'DeepThink Agent'} />
            <Content>
                {/* Wrap all routes with FridaySettingRoomProvider so config is available everywhere */}
                <FridaySettingRoomContextProvider>
                    <Routes>
                        <Route
                            path={RouterPath.FRIDAY_CHAT}
                            element={
                                <FridayAppRoomContextProvider>
                                    <ChatPage />
                                </FridayAppRoomContextProvider>
                            }
                        />
                        <Route
                            path={RouterPath.FRIDAY_SETTING}
                            element={<SettingPage />}
                        />
                        {/* Default route: redirect to setting page */}
                        <Route
                            path="/"
                            element={<Navigate to={RouterPath.FRIDAY_SETTING} replace />}
                        />
                    </Routes>
                </FridaySettingRoomContextProvider>
            </Content>
        </Layout>
    );
};

export default memo(FridayPage);
