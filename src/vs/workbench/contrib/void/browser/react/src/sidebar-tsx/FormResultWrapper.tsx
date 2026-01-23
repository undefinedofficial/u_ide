/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useState } from 'react';
import { Check, Square, Circle, Type, Send, AlertTriangle } from 'lucide-react';
import { useAccessor, useChatThreadsStreamState } from '../util/services.js';
import { BuiltinToolName } from '../../../../common/toolsServiceTypes.js';
import {
	ToolHeaderWrapper,
	ToolChildrenWrapper,
	SmallProseWrapper,
	getTitle,
	toolNameToDesc,
	ResultWrapper,
	ToolHeaderParams,
} from './ToolResultHelpers.js';

type QuestionType = 'single_choice' | 'multiple_choice' | 'text' | 'checkbox';

type Question = {
	id: string;
	text: string;
	type: QuestionType;
	options?: string[];
	required?: boolean;
};

type RenderFormParams = {
	title?: string;
	description?: string;
	questions: Question[];
};

const QuestionItem = ({ question, value, onChange }: { question: Question; value: any; onChange: (value: any) => void }) => {
	const isDark = document.documentElement.classList.contains('vscode-dark');

	switch (question.type) {
		case 'single_choice':
			return (
				<div className="space-y-2">
					<div className="text-sm font-medium text-void-fg-2">
						{question.text}
						{question.required && <span className="text-void-accent ml-1">*</span>}
					</div>
					<div className="space-y-1.5">
						{question.options?.map((option, idx) => (
							<label
								key={idx}
								className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 border ${
									value === option
										? 'bg-void-accent/10 border-void-accent/40'
										: 'bg-void-bg-2/30 border-void-border-2 hover:bg-void-bg-2/50 hover:border-void-border-1'
								}`}
							>
								<div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
									value === option
										? 'border-void-accent bg-void-accent'
										: 'border-void-fg-4'
								}`}>
									{value === option && <Circle size={8} className="text-white" fill="currentColor" />}
								</div>
								<span className="text-sm text-void-fg-1">{option}</span>
							</label>
						))}
					</div>
				</div>
			);

		case 'multiple_choice':
			return (
				<div className="space-y-2">
					<div className="text-sm font-medium text-void-fg-2">
						{question.text}
						{question.required && <span className="text-void-accent ml-1">*</span>}
					</div>
					<div className="space-y-1.5">
						{question.options?.map((option, idx) => {
							const isSelected = Array.isArray(value) && value.includes(option);
							return (
								<label
									key={idx}
									className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 border ${
										isSelected
											? 'bg-void-accent/10 border-void-accent/40'
											: 'bg-void-bg-2/30 border-void-border-2 hover:bg-void-bg-2/50 hover:border-void-border-1'
									}`}
								>
									<div className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
										isSelected
											? 'border-void-accent bg-void-accent'
											: 'border-void-fg-4'
									}`}>
										{isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
									</div>
									<span className="text-sm text-void-fg-1">{option}</span>
								</label>
							);
						})}
					</div>
				</div>
			);

		case 'checkbox':
			return (
				<label className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 border ${
					value === true
						? 'bg-void-accent/10 border-void-accent/40'
						: 'bg-void-bg-2/30 border-void-border-2 hover:bg-void-bg-2/50 hover:border-void-border-1'
				}`}>
					<div className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
						value === true
							? 'border-void-accent bg-void-accent'
							: 'border-void-fg-4'
					}`}>
						{value === true && <Check size={10} className="text-white" strokeWidth={3} />}
					</div>
					<span className="text-sm text-void-fg-2">
						{question.text}
						{question.required && <span className="text-void-accent ml-1">*</span>}
					</span>
				</label>
			);

		case 'text':
			return (
				<div className="space-y-2">
					<div className="text-sm font-medium text-void-fg-2">
						{question.text}
						{question.required && <span className="text-void-accent ml-1">*</span>}
					</div>
					<input
						type="text"
						value={value || ''}
						onChange={(e) => onChange(e.target.value)}
						placeholder="Type your answer..."
						className="w-full px-3 py-2 rounded-lg border border-void-border-2 bg-void-bg-2/50 text-void-fg-1 text-sm placeholder:text-void-fg-4 focus:outline-none focus:ring-2 focus:ring-void-accent/50 focus:border-void-accent transition-all"
					/>
				</div>
			);

		default:
			return null;
	}
};

export const FormResultWrapper: ResultWrapper<'render_form'> = ({ toolMessage, threadId }) => {
	const accessor = useAccessor();
	const streamState = useChatThreadsStreamState(threadId);

	const title = getTitle(toolMessage);
	const { desc1 } = toolNameToDesc(toolMessage.name as BuiltinToolName, toolMessage.params, accessor);

	const isRejected = toolMessage.type === 'rejected';

	// Form state for interactive responses
	const params = toolMessage.params as RenderFormParams;
	const [responses, setResponses] = useState<Record<string, any>>({});
	const [showError, setShowError] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	// Check if all required questions are answered
	const validateForm = (): boolean => {
		return params.questions.every(q => {
			if (!q.required) return true;
			const response = responses[q.id];
			if (response === undefined || response === null) return false;
			if (Array.isArray(response) && response.length === 0) return false;
			if (typeof response === 'string' && response.trim() === '') return false;
			return true;
		});
	};

	const handleSubmit = () => {
		if (!validateForm()) {
			setShowError(true);
			setTimeout(() => setShowError(false), 3000);
			return;
		}
		setSubmitted(true);
		// The actual submission is handled through the UI - this just marks as visually submitted
	};

	const handleQuestionChange = (questionId: string, value: any) => {
		setResponses(prev => ({ ...prev, [questionId]: value }));
		setShowError(false);
	};

	const componentParams: ToolHeaderParams = {
		title,
		desc1,
		isError: false,
		icon: <Type size={12} strokeWidth={2.5} />,
		isRejected,
		isOpen: true, // Always open for forms
	};

	if (toolMessage.type === 'success') {
		const result = toolMessage.result as any;
		const resultTemplate = result?.template || '';

		componentParams.children = (
			<ToolChildrenWrapper>
				<SmallProseWrapper>
					{resultTemplate ? (
						<div dangerouslySetInnerHTML={{ __html: resultTemplate }} />
					) : (
						<div className="text-void-fg-2">
							{submitted ? 'Form submitted!' : 'Form complete.'}
						</div>
					)}
				</SmallProseWrapper>
			</ToolChildrenWrapper>
		);
	} else if (toolMessage.type === 'tool_request' || toolMessage.type === 'running_now') {
		const activity = streamState?.isRunning === 'tool' && streamState.toolInfo.id === toolMessage.id
			? streamState.toolInfo.content
			: undefined;

		componentParams.children = (
			<ToolChildrenWrapper>
				{activity && (
					<div className="flex items-center gap-2 py-2 mb-3 border-b border-void-border-2/30">
						<div className="w-3 h-3 border-2 border-void-accent border-t-transparent rounded-full animate-spin" />
						<span className="text-xs italic text-void-fg-3">{activity}</span>
					</div>
				)}

				{params.title && (
					<div className="mb-3">
						<h3 className="text-base font-semibold text-void-fg-1">{params.title}</h3>
						{params.description && (
							<p className="text-sm text-void-fg-3 mt-1">{params.description}</p>
						)}
					</div>
				)}

				<div className="space-y-4">
					{params.questions.map((question, idx) => (
						<QuestionItem
							key={question.id || idx}
							question={question}
							value={responses[question.id]}
							onChange={(value) => handleQuestionChange(question.id, value)}
						/>
					))}
				</div>

				{showError && (
					<div className="mt-4 flex items-start gap-2 px-3 py-2 bg-void-warning/10 border border-void-warning/30 rounded-lg">
						<AlertTriangle size={14} className="text-void-warning flex-shrink-0 mt-0.5" />
						<span className="text-xs text-void-warning">
							Please answer all required questions marked with *
						</span>
					</div>
				)}

				{!submitted && (
					<div className="mt-4 pt-4 border-t border-void-border-2/50">
						<button
							onClick={handleSubmit}
							className="flex items-center gap-2 px-4 py-2 bg-void-accent hover:bg-void-accent-hover text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
						>
							<Send size={14} />
							Submit Responses
						</button>
					</div>
				)}
			</ToolChildrenWrapper>
		);
	} else if (toolMessage.type === 'tool_error') {
		componentParams.children = (
			<ToolChildrenWrapper>
				<div className="px-3 py-2 bg-void-warning/10 border border-void-warning/30 rounded-lg">
					<div className="flex items-start gap-2">
						<AlertTriangle size={14} className="text-void-warning flex-shrink-0 mt-0.5" />
						<span className="text-sm text-void-warning">
							Error: {String(toolMessage.result)}
						</span>
					</div>
				</div>
			</ToolChildrenWrapper>
		);
	}

	return <ToolHeaderWrapper {...componentParams} />;
};