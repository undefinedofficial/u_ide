/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BookOpen, Trophy, Target, Flame, Settings, Share, Bookmark, Star, ChevronDown, ChevronUp, Menu, X } from 'lucide-react';
import '../styles.css';
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js';
import { useAccessor, useIsDark } from '../util/services.js';
import { LessonThemeProvider, useLessonTheme } from '../util/LessonThemeProvider.js';
import { ProgressTracker, SectionCompletionTracker, MiniProgressBar, ScoreCard } from '../learning-tsx/ProgressTracker.js';
import { CollapsibleLessonSection, ProgressSection, TableOfContents } from '../learning-tsx/CollapsibleLessonSection.js';
import { InlineExerciseBlock } from '../learning-tsx/InlineExerciseBlock.js';
import { HintSystem, InlineHintButton } from '../learning-tsx/HintSystem.js';
import { CelebrationEffect, CelebrationType, useCelebration } from '../learning-tsx/CelebrationEffect.js';

export interface LearningPreviewProps {
	title: string;
	content: string;
	lessonId?: string;
	lessonTopic?: string;
	threadId?: string;
	onSectionToggle?: (sectionId: string, isExpanded: boolean) => void;
	onSectionComplete?: (sectionId: string) => void;
	onBookmarkToggle?: (lessonId: string, sectionId: string) => void;
	onNoteAdd?: (lessonId: string, sectionId: string, note: string) => void;
	exercises?: Array<{
		id: string;
		type: 'fill_blank' | 'fix_bug' | 'write_function' | 'extend_code';
		title?: string;
		instructions: string;
		initialCode: string;
		expectedSolution?: string;
	}>;
	sections?: Array<{
		id: string;
		title: string;
		content: string;
		exerciseIds?: string[];
	}>;
}

// Lesson state tracking
interface LessonState {
	sections: Record<string, { completed: boolean; expanded: boolean; read: boolean; bookmarked: boolean }>;
	exercises: Record<string, { attempts: number; solved: boolean; hintsUsed: number }>;
	timeSpent: number;
	startTime: number;
	showProgress: boolean;
	showSidebar: boolean;
	activeSection: string | null;
}

// Parse content into sections
function parseContentIntoSections(content: string, exerciseIds: string[] = []): Array<{ id: string; title: string; content: string }> {
	const sections: Array<{ id: string; title: string; content: string }> = [];
	const sectionRegex = /#{3,}\s+(.+?)\n/g;
	let lastIndex = 0;
	let match;
	let sectionIndex = 0;

	while ((match = sectionRegex.exec(content)) !== null) {
		if (lastIndex < match.index) {
			sections.push({
				id: `section-${sectionIndex++}`,
				title: 'Introduction',
				content: content.slice(lastIndex, match.index),
			});
		}

		sections.push({
			id: `section-${sectionIndex++}`,
			title: match[1].trim(),
			content: '',
		});

		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < content.length) {
		sections.push({
			id: `section-${sectionIndex}`,
			title: 'Summary',
			content: content.slice(lastIndex),
		});
	}

	return sections;
}

// Component for displaying inline exercises in markdown
const InlineExerciseRenderer: React.FC<{
	exercise: LearningPreviewProps['exercises'][0];
	threadId?: string;
	lessonId: string;
	onSubmit?: (studentCode: string) => Promise<{ isCorrect: boolean; feedback: string }>;
	onRequestHint?: () => Promise<string>;
	onComplete?: () => void;
}> = ({ exercise, threadId, lessonId, onSubmit, onRequestHint, onComplete }) => {
	const { trigger: triggerCelebration } = useCelebration();

	const handleSubmit = async (studentCode: string) => {
		const result = await onSubmit?.(studentCode);
		if (result?.isCorrect) {
			triggerCelebration('confetti', 1500, 'medium');
			onComplete?.();
		}
		return result;
	};

	return (
		<InlineExerciseBlock
			exerciseId={exercise.id}
			lessonId={lessonId}
			type={exercise.type}
			title={exercise.title}
			instructions={exercise.instructions}
			initialCode={exercise.initialCode}
			expectedSolution={exercise.expectedSolution}
			onSubmit={handleSubmit}
			onRequestHint={onRequestHint}
			threadId={threadId}
		/>
	);
};

// Learning Dashboard Component
const LearningDashboard: React.FC<{
	progress: LessonState;
	stats: any;
	onClose: () => void;
}> = ({ progress, stats, onClose }) => {
	const { theme, getColor } = useLessonTheme();

	return (
		<div
			className="learning-dashboard fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
			onClick={onClose}
		>
			<div
				className="rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden"
				style={{
					backgroundColor: theme.colors.background,
					border: `1px solid ${theme.colors.border}`
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: theme.colors.backgroundLight, borderColor: theme.colors.border }}>
					<div className="flex items-center gap-2">
						<Trophy size={20} style={{ color: getColor('accent') }} />
						<h2 className="text-lg font-semibold" style={{ color: getColor('text') }}>
							Learning Dashboard
						</h2>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-opacity-20 rounded-lg transition-colors"
						style={{ backgroundColor: `${getColor('accent')}10` }}
					>
						<X size={20} style={{ color: getColor('text-muted') }} />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
					{/* Streak */}
					<div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: `${getColor('accent')}10`, border: `1px solid ${getColor('accent')}30` }}>
						<div className="p-3 rounded-full" style={{ backgroundColor: `${getColor('accent')}20` }}>
							<Flame size={24} style={{ color: getColor('accent') }} />
						</div>
						<div>
							<div className="text-xs" style={{ color: getColor('text-muted') }}>Learning Streak</div>
							<div className="text-2xl font-bold" style={{ color: getColor('accent') }}>
								{stats?.streak || 3} days
							</div>
						</div>
					</div>

					{/* Stats Grid */}
					<div className="grid grid-cols-2 gap-4">
						<div className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.backgroundLight }}>
							<div className="text-xs mb-1" style={{ color: getColor('text-muted') }}>Lessons</div>
							<div className="text-2xl font-bold" style={{ color: getColor('text') }}>
								{stats?.lessonsCompleted || 2}
							</div>
						</div>
						<div className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.backgroundLight }}>
							<div className="text-xs mb-1" style={{ color: getColor('text-muted') }}>Exercises</div>
							<div className="text-2xl font-bold" style={{ color: getColor('text') }}>
								{stats?.exercisesSolved || 5}
							</div>
						</div>
					</div>

					{/* Recent Progress */}
					<div>
						<h3 className="text-sm font-semibold mb-3" style={{ color: getColor('text') }}>
							Recent Progress
						</h3>
						<div className="space-y-2">
							{['Loops', 'Arrays', 'Functions'].map((lesson) => (
								<div key={lesson} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.backgroundLight }}>
									<BookOpen size={16} style={{ color: getColor('text-muted') }} />
									<span className="flex-1 text-sm" style={{ color: getColor('text') }}>{lesson}</span>
									<Star size={14} style={{ color: getColor('accent') }} />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// Main LearningPreview Component
export const LearningPreview: React.FC<LearningPreviewProps> = ({
	title,
	content,
	lessonId,
	lessonTopic,
	threadId,
	onSectionToggle,
	onSectionComplete,
	onBookmarkToggle,
	onNoteAdd,
	exercises = [],
	sections: providedSections,
}) => {
	const isDark = useIsDark();
	const { theme, getColor } = useLessonTheme();

	// Lesson state
	const [lessonState, setLessonState] = useState<LessonState>({
		sections: {},
		exercises: {},
		timeSpent: 0,
		startTime: Date.now(),
		showProgress: true,
		showSidebar: false,
		activeSection: null,
	});

	const [showDashboard, setShowDashboard] = useState(false);
	const [showMenu, setShowMenu] = useState(false);
	const timerRef = useRef<NodeJS.Timeout>();

	// Parse content into sections
	const parsedSections = providedSections || parseContentIntoSections(content, exercises.map(e => e.id));

	// Time tracking
	useEffect(() => {
		timerRef.current = setInterval(() => {
			setLessonState(prev => ({
				...prev,
				timeSpent: Math.floor((Date.now() - prev.startTime) / 1000),
			}));
		}, 1000);

		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, []);

	// Initialize section states
	useEffect(() => {
		setLessonState(prev => {
			const newSections = { ...prev.sections };
			parsedSections.forEach(section => {
				if (!newSections[section.id]) {
					newSections[section.id] = {
						completed: false,
						expanded: section.id === 'section-0',
						read: false,
						bookmarked: false,
					};
				}
			});
			return { ...prev, sections: newSections };
		});
	}, [parsedSections]);

	// Handlers
	const handleSectionToggle = useCallback((sectionId: string, isExpanded: boolean) => {
		setLessonState(prev => ({
			...prev,
			sections: {
				...prev.sections,
				[sectionId]: {
					...prev.sections[sectionId],
					expanded: isExpanded,
					read: isExpanded ? true : prev.sections[sectionId].read,
				},
			},
		}));
		onSectionToggle?.(sectionId, isExpanded);
	}, [onSectionToggle]);

	const handleSectionComplete = useCallback((sectionId: string) => {
		setLessonState(prev => ({
			...prev,
			sections: {
				...prev.sections,
				[sectionId]: {
					...prev.sections[sectionId],
					completed: !prev.sections[sectionId].completed,
				},
			},
		}));
		onSectionComplete?.(sectionId);
	}, [onSectionComplete]);

	const handleBookmarkToggle = useCallback((sectionId: string) => {
		setLessonState(prev => ({
			...prev,
			sections: {
				...prev.sections,
				[sectionId]: {
					...prev.sections[sectionId],
					bookmarked: !prev.sections[sectionId].bookmarked,
				},
			},
		}));
		onBookmarkToggle?.(lessonId || '', sectionId);
	}, [lessonId, onBookmarkToggle]);

	// Calculate progress
	const progress = useMemo(() => {
		const completedCount = Object.values(lessonState.sections).filter(s => s.completed).length;
		const totalCount = parsedSections.length;
		return totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
	}, [lessonState.sections, parsedSections]);

	const sectionList = parsedSections.map(section => ({
		id: section.id,
		title: section.title,
		isCompleted: lessonState.sections[section.id]?.completed || false,
		isExpanded: lessonState.sections[section.id]?.expanded || false,
	}));

	// Format time
	const formatTime = (seconds: number): string => {
		if (seconds < 60) return `${seconds}s`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
		return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
	};

	// Get section icon
	const getSectionIcon = (sectionId: string): React.ReactNode => {
		if (lessonState.sections[sectionId]?.completed) return <Trophy size={16} />;
		return <BookOpen size={16} />;
	};

	return (
		<div className={`@@void-scope ${isDark ? 'dark' : ''}`} style={{ height: '100%', width: '100%' }}>
			{showDashboard && (
				<LearningDashboard
					progress={lessonState}
					stats={{ streak: 3, lessonsCompleted: 2, exercisesSolved: 5 }}
					onClose={() => setShowDashboard(false)}
				/>
			)}

			<div className="void-preview-container h-full flex flex-col overflow-hidden font-sans"
				style={{ backgroundColor: theme.colors.background, color: theme.colors.text }}
			>

				{/* Top Header */}
				<header className="px-6 py-4 flex-shrink-0 flex items-center justify-between border-b z-20"
					style={{
						backgroundColor: `${theme.colors.backgroundLight}80`,
						borderColor: theme.colors.border,
						backdropFilter: 'blur(12px)'
					}}
				>
					<div className="flex items-center gap-3 overflow-hidden">
						<div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border"
							style={{
								backgroundColor: `${getColor('accent')}10`,
								borderColor: `${getColor('accent')}20`
							}}
						>
							<BookOpen className="w-5 h-5" style={{ color: getColor('accent') }} />
						</div>
						<div className="flex flex-col min-w-0">
							<h1 className="text-sm font-semibold truncate tracking-tight" style={{ color: getColor('text') }}>{title}</h1>
							<div className="flex items-center gap-2">
								<span className="text-[10px] font-medium uppercase tracking-wider opacity-60" style={{ color: getColor('text-muted') }}>
									Lesson
								</span>
								{lessonState.showProgress && (
									<>
										<span className="text-[10px] opacity-30">•</span>
										<span className="text-[10px] opacity-60" style={{ color: getColor('text-muted') }}>
											{Math.round(progress)}% Complete
										</span>
									</>
								)}
								<>
									<span className="text-[10px] opacity-30">•</span>
									<span className="text-[10px] opacity-60" style={{ color: getColor('text-muted') }}>
										{formatTime(lessonState.timeSpent)}
									</span>
								</>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<button
							onClick={() => setShowDashboard(true)}
							className="p-2 rounded-lg transition-colors"
							style={{ color: getColor('text-muted') }}
							title="Learning Dashboard"
						>
							<Trophy size={18} />
						</button>
						<button
							onClick={() => setLessonState(prev => ({ ...prev, showSidebar: !prev.showSidebar }))}
							className="p-2 rounded-lg transition-colors"
							style={{ color: getColor('text-muted') }}
							title="Table of Contents"
						>
							{lessonState.showSidebar ? <X size={18} /> : <Menu size={18} />}
						</button>
						<button
							onClick={() => setShowMenu(!showMenu)}
							className="p-2 rounded-lg transition-colors"
							style={{ color: getColor('text-muted') }}
						>
							<Settings size={18} />
						</button>
					</div>
				</header>

				{/* Main Content Area */}
				<div className="flex-1 overflow-hidden relative z-10 flex">
					{/* Sidebar (Table of Contents) */}
					{lessonState.showSidebar && (
						<div className="w-64 border-r overflow-y-auto custom-scrollbar"
							style={{ backgroundColor: `${theme.colors.backgroundLight}50`, borderColor: theme.colors.border }}
						>
							<div className="p-4 space-y-4">
								<ProgressTracker
									lessonId={lessonId || title}
									threadId={threadId}
									showDetailed={true}
									showStreak={true}
									showBadges={false}
								/>
								<TableOfContents
									sections={sectionList}
									onSectionClick={(sectionId) => {
										handleSectionToggle(sectionId, true);
										const element = document.getElementById(sectionId);
										if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
									}}
								/>
							</div>
						</div>
					)}

					{/* Scroll Area */}
					<div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center">
						{/* Main Content */}
						<main className="w-full max-w-4xl mx-auto px-6 py-8 md:px-12 space-y-6">
							{/* Progress Section */}
							{lessonState.showProgress && (
								<ProgressSection
									totalSections={parsedSections.length}
									completedSections={Object.values(lessonState.sections).filter(s => s.completed).length}
									estimatedTime="10 min"
									onJumpToSection={(sectionId) => {
										handleSectionToggle(sectionId, true);
										const element = document.getElementById(sectionId);
										if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
									}}
								/>
							)}

							{/* Lesson Badge */}
							<div className="mb-4 flex justify-center">
								<span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
									style={{
										backgroundColor: `${getColor('accent')}20`,
										color: getColor('accent'),
										border: `1px solid ${getColor('accent')}30`,
									}}
								>
									Lesson
								</span>
							</div>

							{/* Render Sections */}
							{parsedSections.map((section, idx) => (
								<CollapsibleLessonSection
									key={section.id}
									id={section.id}
									lessonId={lessonId || title}
									title={section.title}
									icon={getSectionIcon(section.id)}
									defaultExpanded={idx === 0}
									onToggle={handleSectionToggle}
									onMarkComplete={handleSectionComplete}
									isCompleted={lessonState.sections[section.id]?.completed}
									isBookmarked={lessonState.sections[section.id]?.bookmarked}
									onToggleBookmark={handleBookmarkToggle}
									order={idx + 1}
								>
									<div className="prose prose-invert max-w-none" style={{ color: getColor('text') }}>
										<ChatMarkdownRender
											string={section.content}
											chatMessageLocation={undefined}
											isApplyEnabled={false}
											isLinkDetectionEnabled={true}
										/>
									</div>

									{/* Render exercises for this section */}
									{section.exerciseIds?.map(exerciseId => {
										const exercise = exercises.find(e => e.id === exerciseId);
										if (!exercise) return null;

										return (
											<div key={exercise.id} className="mt-6">
												<InlineExerciseRenderer
													exercise={exercise}
													threadId={threadId}
													lessonId={lessonId || title}
													onComplete={() => {
														// Mark section as progress when exercise solved
													}}
												/>
											</div>
										);
									})}
								</CollapsibleLessonSection>
							))}

							{/* Footer Disclaimer */}
							<div className="mt-8 text-center">
								<p className="text-xs opacity-40" style={{ color: getColor('text-muted') }}>
									Interactive Lesson • Generated by A-Coder
								</p>
							</div>

							{/* Bottom Spacing */}
							<div className="h-32" />
						</main>
					</div>
				</div>

				{/* Celebration effect Container */}
				<div id="celebration-container" className="fixed inset-0 pointer-events-none z-50" />
			</div>
		</div>
	);
};

// Export wrapped version with LessonThemeProvider
export const LearningPreviewWithTheme: React.FC<LearningPreviewProps> = (props) => {
	return (
		<LessonThemeProvider lessonId={props.lessonId || props.title} topic={props.lessonTopic}>
			<LearningPreview {...props} />
		</LessonThemeProvider>
	);
};

export default LearningPreviewWithTheme;