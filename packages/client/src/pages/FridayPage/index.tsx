import { memo } from 'react';
import { Layout } from 'antd';
import TitleBar from '../../components/titlebar/TitleBar.tsx';
import ChatPage from '@/pages/FridayPage/ChatPage';
import { FridayAppRoomContextProvider } from '@/context/FridayAppRoomContext.tsx';
import SettingPage from '@/pages/FridayPage/SettingPage';
import { Route, Routes } from 'react-router-dom';
import { RouterPath } from '@/pages/RouterPath.ts';
import { FridaySettingRoomContextProvider } from '@/context/FridaySettingRoomContext.tsx';

const FridayPage = () => {
    const { Content } = Layout;

    return (
        <Layout style={{ width: '100%', height: '100%' }}>
            <TitleBar title={'AgentScope Friday'} />
            <Content>
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
                        element={
                            <FridaySettingRoomContextProvider>
                                <SettingPage />
                            </FridaySettingRoomContextProvider>
                        }
                    />
                </Routes>
            </Content>
        </Layout>
    );
};

export default memo(FridayPage);
