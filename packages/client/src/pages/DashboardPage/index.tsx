import { memo } from 'react';
import { Layout } from 'antd';
import { Route, Routes } from 'react-router-dom';
import ProjectPage from './ProjectPage';
import TitleBar from '../../components/titlebar/TitleBar';
import { ProjectListRoomContextProvider } from '../../context/ProjectListRoomContext.tsx';
import RunPage from './RunPage';
import { useTranslation } from 'react-i18next';
import { TourContextProvider } from '@/context/TourContext.tsx';

const DashboardPage = () => {
    const { Content } = Layout;
    const { t } = useTranslation();

    return (
        <Layout style={{ height: '100%' }}>
            <TitleBar title={t('common.dashboard')} />

            <Content style={{ display: 'flex', flex: 1 }}>
                <Routes>
                    <Route
                        index
                        element={
                            <ProjectListRoomContextProvider>
                                <ProjectPage />
                            </ProjectListRoomContextProvider>
                        }
                    />
                    <Route
                        path={'/projects/:projectName/*'}
                        element={
                            <TourContextProvider>
                                <RunPage />
                            </TourContextProvider>
                        }
                    />
                    <Route
                        path={'/projects'}
                        element={
                            <ProjectListRoomContextProvider>
                                <ProjectPage />
                            </ProjectListRoomContextProvider>
                        }
                    />
                </Routes>
            </Content>
        </Layout>
    );
};

export default memo(DashboardPage);
