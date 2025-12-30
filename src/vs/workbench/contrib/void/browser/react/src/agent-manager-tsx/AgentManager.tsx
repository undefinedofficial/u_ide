/*--------------------------------------------------------------------------------------
 *  Copyright 2025 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useIsDark, useChatThreadsState, useOnAgentManagerOpenFile, useOnAgentManagerOpenWalkthrough, useOnAgentManagerOpenContent, useWorkspaceFolders, useFileContent } from '../util/services.js';
import { SidebarChat } from '../sidebar-tsx/SidebarChat.js';
import { PastThreadsList } from '../sidebar-tsx/SidebarThreadSelector.js';
import ErrorBoundary from '../sidebar-tsx/ErrorBoundary.js';
import { Folder, MessageSquare, Code, Settings, X, Maximize2, Minimize2, Search, ExternalLink, Activity, Shield, Cpu, Zap, Loader2, ChevronLeft, ChevronRight, BarChart3, Database, Layers, Clock, TrendingUp, FileCode } from 'lucide-react';
import { BlockCode } from '../util/inputs.js';
import { URI } from '../../../../../../../base/common/uri.js';
import '../styles.css';

const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};

const CodePreview = ({ selectedFileUri }: { selectedFileUri: URI | null }) => {
    const { content, loading } = useFileContent(selectedFileUri);

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-void-fg-4 gap-4 bg-void-bg-2/30">
                <div className="relative">
                    <div className="w-12 h-12 border-3 border-void-accent/20 border-t-void-accent rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Code className="w-5 h-5 text-void-accent" />
                    </div>
                </div>
                <div className="text-center">
                    <span className="text-xs font-semibold text-void-fg-3">Loading file...</span>
                </div>
            </div>
        );
    }

    if (!content || !selectedFileUri) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-void-fg-4 bg-void-bg-2/20 border border-dashed border-void-border-3 m-4 rounded-xl">
                <div className="w-16 h-16 rounded-xl bg-void-bg-3/50 flex items-center justify-center mb-4">
                    <FileCode className="w-8 h-8 text-void-fg-4" />
                </div>
                <div className="text-center px-6">
                    <h3 className="text-sm font-semibold text-void-fg-2 mb-1">No File Selected</h3>
                    <p className="text-xs text-void-fg-4">Select a file to view its contents here</p>
                </div>
            </div>
        );
    }

    const extension = selectedFileUri.fsPath.split('.').pop() || '';

    return (
        <div className="h-full flex flex-col rounded-lg overflow-hidden bg-void-bg-2/50">
            <div className="flex-1 overflow-hidden">
                <BlockCode
                    initValue={content}
                    language={extension}
                    maxHeight={Infinity}
                    showScrollbars={true}
                />
            </div>
        </div>
    );
};

const ContentPreview = ({ title, content }: { title: string, content: string }) => {
    return (
        <div className="h-full flex flex-col rounded-lg overflow-hidden bg-void-bg-2/50">
            <div className="px-4 py-3 border-b border-void-border-2/50 bg-void-bg-3/30">
                <span className="text-xs font-semibold text-void-fg-2">{title}</span>
            </div>
            <div className="flex-1 overflow-auto p-4">
                <BlockCode
                    initValue={content}
                    language="markdown"
                    maxHeight={Infinity}
                    showScrollbars={true}
                />
            </div>
        </div>
    );
};

const WorkspacesView = () => {
    const folders = useWorkspaceFolders();

    return (
        <div className="flex flex-col gap-1.5 p-3">
            {folders.map(folder => (
                <div
                    key={folder.uri.toString()}
                    className="group flex items-center gap-3 p-3 rounded-lg border border-void-border-2/50 hover:border-void-accent/30 hover:bg-void-bg-3/50 transition-all cursor-pointer"
                >
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-void-bg-3 flex items-center justify-center group-hover:bg-void-accent/10 transition-colors">
                        <Folder className="w-4 h-4 text-void-fg-4 group-hover:text-void-accent transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-void-fg-1 block truncate">{folder.name}</span>
                        <span className="text-[11px] text-void-fg-4 truncate block mt-0.5">{folder.uri.fsPath}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-void-fg-4 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                </div>
            ))}
            {folders.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 text-void-fg-4">
                    <div className="w-14 h-14 rounded-full bg-void-bg-3/50 flex items-center justify-center mb-3">
                        <Folder className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-void-fg-3">No Workspaces Open</p>
                    <p className="text-xs text-void-fg-4 mt-1">Open a folder to see it here</p>
                </div>
            )}
        </div>
    );
};

const DashboardView = ({ stats }: { stats: any }) => {
    const StatCard = ({ icon: Icon, label, value, sublabel, color }: { icon: any, label: string, value: string | number, sublabel?: string, color: string }) => (
        <div className="p-5 rounded-xl border border-void-border-2/50 bg-void-bg-2/30 hover:border-void-border-2/80 hover:bg-void-bg-2/50 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {sublabel && (
                    <span className="text-[10px] font-medium text-void-fg-4 bg-void-bg-3/50 px-2 py-1 rounded-full">
                        {sublabel}
                    </span>
                )}
            </div>
            <div className="space-y-1">
                <div className="text-2xl font-bold text-void-fg-1">{value}</div>
                <div className="text-[11px] font-medium text-void-fg-4 uppercase tracking-wide">{label}</div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-void-fg-1">Agent Dashboard</h2>
                    <p className="text-sm text-void-fg-4 mt-1">Monitor agent performance and activity</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-void-bg-3/50 border border-void-border-2/50">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-void-fg-3">Online</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={MessageSquare}
                    label="Active Threads"
                    value={stats.threadsCount}
                    color="bg-blue-500/10 text-blue-500"
                />
                <StatCard
                    icon={Zap}
                    label="Operations"
                    value={stats.operationsCount}
                    sublabel="Last 24h"
                    color="bg-purple-500/10 text-purple-500"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Success Rate"
                    value="99.2%"
                    sublabel="All time"
                    color="bg-emerald-500/10 text-emerald-500"
                />
                <StatCard
                    icon={Clock}
                    label="Avg Response"
                    value="142ms"
                    sublabel="Latency"
                    color="bg-orange-500/10 text-orange-500"
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Recent Activity */}
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-void-fg-3 uppercase tracking-wider">Recent Activity</h3>
                        <button className="text-xs text-void-accent hover:text-void-accent-hover font-medium">View All</button>
                    </div>
                    <div className="flex-1 rounded-xl border border-void-border-2/50 bg-void-bg-2/30 overflow-hidden">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="p-4 border-b border-void-border-2/30 last:border-0 hover:bg-void-bg-3/30 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-void-bg-3/50 flex items-center justify-center">
                                        <Code className="w-4 h-4 text-void-fg-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-void-fg-1 truncate">Agent edit on SidebarChat.tsx</p>
                                        <p className="text-xs text-void-fg-4 mt-1 truncate font-mono">src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx</p>
                                    </div>
                                    <span className="text-[11px] text-void-fg-4 flex-shrink-0">{i * 2}m ago</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-semibold text-void-fg-3 uppercase tracking-wider mb-1">Quick Actions</h3>
                    <button className="flex items-center gap-3 p-4 rounded-xl border border-void-border-2/50 bg-void-bg-2/30 hover:bg-void-bg-3/50 hover:border-void-accent/30 transition-all group">
                        <div className="p-2 rounded-lg bg-void-accent/10 text-void-accent group-hover:bg-void-accent group-hover:text-white transition-all">
                            <Zap className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-void-fg-1">Launch New Agent</span>
                    </button>
                    <button className="flex items-center gap-3 p-4 rounded-xl border border-void-border-2/50 bg-void-bg-2/30 hover:bg-void-bg-3/50 transition-all group">
                        <div className="p-2 rounded-lg bg-void-bg-3/50 text-void-fg-4 group-hover:text-void-fg-2 transition-all">
                            <Shield className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-void-fg-1">Audit Log</span>
                    </button>
                    <button className="flex items-center gap-3 p-4 rounded-xl border border-void-border-2/50 bg-void-bg-2/30 hover:bg-void-bg-3/50 transition-all group">
                        <div className="p-2 rounded-lg bg-void-bg-3/50 text-void-fg-4 group-hover:text-void-fg-2 transition-all">
                            <Settings className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-void-fg-1">Agent Settings</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const NavButton = ({ active, onClick, icon: Icon, label, title }: { active: boolean, onClick: () => void, icon: any, label?: string, title: string }) => (
    <button
        onClick={onClick}
        className={`relative w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center transition-all duration-200 group`}
        title={title}
    >
        <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
            active
                ? 'bg-void-accent text-white shadow-lg shadow-void-accent/20'
                : 'text-void-fg-4 hover:text-void-fg-2 hover:bg-void-bg-3'
        }`}>
            <Icon className="w-5 h-5 lg:w-5.5 lg:h-5.5" />
        </div>
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-void-accent rounded-full" />}
    </button>
);

export const AgentManager = ({ className }: { className: string }) => {
    const isDark = useIsDark();
    const { width: windowWidth } = useWindowSize();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'chats' | 'workspaces'>('dashboard');
    const [showPreview, setShowPreview] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [walkthroughData, setWalkthroughData] = useState<{ filePath: string, preview: string } | null>(null);
    const [contentData, setContentData] = useState<{ title: string, content: string } | null>(null);

    useEffect(() => {
        if (windowWidth < 1024) {
            setShowPreview(false);
        }
        if (windowWidth < 768) {
            setShowSidebar(false);
        }
    }, [windowWidth]);

    const selectedFileUri = useMemo(() => selectedFile ? URI.file(selectedFile) : null, [selectedFile]);

    useOnAgentManagerOpenFile(useCallback((uri) => {
        setSelectedFile(uri.fsPath);
        setWalkthroughData(null);
        setContentData(null);
        setShowPreview(true);
    }, []));

    useOnAgentManagerOpenWalkthrough(useCallback((data) => {
        setWalkthroughData(data);
        setSelectedFile(null);
        setContentData(null);
        setShowPreview(true);
    }, []));

    useOnAgentManagerOpenContent(useCallback((data) => {
        setContentData(data);
        setSelectedFile(null);
        setWalkthroughData(null);
        setShowPreview(true);
    }, []));

    const chatThreadsState = useChatThreadsState();
    const currentThreadId = chatThreadsState.currentThreadId;
    const workspaceFolders = useWorkspaceFolders();

    const stats = {
        threadsCount: Object.keys(chatThreadsState.allThreads).length,
        operationsCount: 124,
    }

    return (
        <div className={`@@void-scope ${isDark ? 'dark' : ''} absolute inset-0 flex flex-col bg-void-bg-1 text-void-fg-1 overflow-hidden font-sans`}>
            {/* Header */}
            <div className="h-16 border-b border-void-border-2/50 flex items-center justify-between px-6 flex-shrink-0 bg-void-bg-2/40 backdrop-blur-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-void-accent to-void-accent-hover flex items-center justify-center shadow-lg shadow-void-accent/15">
                        <Zap className="text-white w-5 h-5 fill-current" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-sm font-semibold text-void-fg-1 tracking-tight">Control Center</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-medium text-emerald-500">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-1 justify-end">
                    <div className="relative group hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-void-fg-4 group-focus-within:text-void-accent transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-void-bg-3/50 border border-void-border-2/50 rounded-lg pl-10 pr-4 py-2 text-xs w-48 lg:w-64 focus:outline-none focus:border-void-accent/50 focus:bg-void-bg-3/80 transition-all placeholder:opacity-50"
                        />
                    </div>
                    <div className="hidden md:block h-6 w-px bg-void-border-2/50" />
                    <button className="p-2 hover:bg-void-bg-3/50 rounded-lg transition-all text-void-fg-4 hover:text-void-fg-1">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative h-full min-h-0">
                {/* Left Navigation Rail */}
                <div className="hidden sm:flex w-14 lg:w-16 border-r border-void-border-2/50 flex-col items-center py-4 bg-void-bg-2/30 flex-shrink-0 z-10 h-full">
                    <div className="flex-1 w-full flex flex-col gap-1 items-center min-h-0">
                        <NavButton
                            active={activeTab === 'dashboard'}
                            onClick={() => { setActiveTab('dashboard'); }}
                            icon={Activity}
                            label="Dashboard"
                            title="Dashboard"
                        />
                        <NavButton
                            active={activeTab === 'chats'}
                            onClick={() => { setActiveTab('chats'); setShowSidebar(true); }}
                            icon={MessageSquare}
                            label="Chats"
                            title="Chats"
                        />
                        <NavButton
                            active={activeTab === 'workspaces'}
                            onClick={() => { setActiveTab('workspaces'); setShowSidebar(true); }}
                            icon={Folder}
                            label="Workspaces"
                            title="Workspaces"
                        />
                    </div>

                    <div className="w-full px-2 flex flex-col gap-1 items-center pt-4 border-t border-void-border-2/50">
                        <button className="p-2.5 rounded-lg text-void-fg-4 hover:text-void-fg-2 hover:bg-void-bg-3/50 transition-all" title="Security">
                            <Shield className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Middle Pane - List/Threads */}
                {(showSidebar && activeTab !== 'dashboard') && (
                    <div className="w-72 border-r border-void-border-2/50 flex flex-col bg-void-bg-2/20 flex-shrink-0 absolute inset-y-0 left-0 z-20 md:relative h-full min-h-0">
                        <div className="p-4 border-b border-void-border-2/30 bg-void-bg-2/40 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xs font-semibold text-void-fg-2 uppercase tracking-wider">
                                    {activeTab === 'chats' ? 'Threads' : 'Workspaces'}
                                </h2>
                                <span className="px-2 py-0.5 rounded bg-void-bg-3/50 text-[11px] font-medium text-void-fg-4 border border-void-border-2/30">
                                    {activeTab === 'chats' ? (Object.keys(chatThreadsState.allThreads).length) : (workspaceFolders.length)}
                                </span>
                            </div>
                            <button onClick={() => setShowSidebar(false)} className="md:hidden p-1.5 hover:bg-void-bg-3/50 rounded-lg transition-all text-void-fg-4">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                            <ErrorBoundary>
                                {activeTab === 'chats' ? (
                                    <div className="p-2">
                                        <PastThreadsList />
                                    </div>
                                ) : (
                                    <WorkspacesView />
                                )}
                            </ErrorBoundary>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-void-bg-1 min-w-0 relative h-full overflow-hidden min-h-0">
                    {!showSidebar && activeTab !== 'dashboard' && (
                        <button
                            onClick={() => setShowSidebar(true)}
                            className="absolute top-4 left-4 z-10 p-2 bg-void-bg-2/80 backdrop-blur-sm border border-void-border-2/50 rounded-lg shadow-sm hover:bg-void-bg-2 text-void-fg-4 hover:text-void-fg-2 transition-all"
                            title="Show Sidebar"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                    <div className="flex-1 h-full overflow-hidden relative min-h-0">
                        <ErrorBoundary>
                            {activeTab === 'dashboard' ? (
                                <DashboardView stats={stats} />
                            ) : (
                                <SidebarChat />
                            )}
                        </ErrorBoundary>
                    </div>
                </div>

                {/* Right Preview Pane */}
                {showPreview && (
                    <div className="w-80 xl:w-96 border-l border-void-border-2/50 flex flex-col bg-void-bg-2/20 flex-shrink-0 absolute inset-y-0 right-0 md:relative z-30 h-full min-h-0">
                        <div className="h-14 border-b border-void-border-2/30 flex items-center justify-between px-4 bg-void-bg-2/40 flex-shrink-0">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="p-2 rounded-lg bg-void-bg-3/50 text-void-fg-4">
                                    <Code className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-semibold text-void-fg-4 uppercase tracking-wider">Preview</span>
                                    <span className="text-sm font-medium text-void-fg-1 truncate">
                                        {selectedFile ? selectedFile.split('/').pop() : walkthroughData ? walkthroughData.filePath.split('/').pop() : contentData ? contentData.title : 'No Preview'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {(selectedFile || walkthroughData) && (
                                    <button className="p-2 hover:bg-void-bg-3/50 rounded-lg transition-all text-void-fg-4 hover:text-void-accent" title="Open in Editor">
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        setSelectedFile(null);
                                        setWalkthroughData(null);
                                        setContentData(null);
                                    }}
                                    className="p-2 hover:bg-void-bg-3/50 rounded-lg transition-all text-void-fg-4 hover:text-void-fg-2"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden bg-void-bg-1/50 min-h-0">
                            <ErrorBoundary>
                                {selectedFileUri ? (
                                    <CodePreview selectedFileUri={selectedFileUri} />
                                ) : walkthroughData ? (
                                    <ContentPreview title="Walkthrough Preview" content={walkthroughData.preview} />
                                ) : contentData ? (
                                    <ContentPreview title={contentData.title} content={contentData.content} />
                                ) : (
                                    <CodePreview selectedFileUri={null} />
                                )}
                            </ErrorBoundary>
                        </div>
                    </div>
                )}

                {/* Floating Preview Toggle */}
                {!showPreview && (
                    <button
                        onClick={() => setShowPreview(true)}
                        className="absolute bottom-6 right-6 w-12 h-12 bg-void-accent text-white rounded-xl shadow-lg shadow-void-accent/20 flex items-center justify-center hover:bg-void-accent-hover transition-all active:scale-95 z-50"
                        title="Show Preview"
                    >
                        <Maximize2 className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};