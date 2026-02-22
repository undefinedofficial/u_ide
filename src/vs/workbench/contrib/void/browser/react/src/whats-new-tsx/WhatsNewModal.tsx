/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, X, ExternalLink, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { useIsDark } from '../util/services.js';
import ErrorBoundary from '../sidebar-tsx/ErrorBoundary.js';
import { ChatMarkdownRender } from '../markdown/ChatMarkdownRender.js';

interface ReleaseAsset {
	name: string;
	browser_download_url: string;
}

interface GitHubRelease {
	tag_name: string;
	name: string;
	body: string;
	html_url: string;
	published_at: string;
	assets: ReleaseAsset[];
}

interface WhatsNewModalProps {
	accessor: any;
	version: string;
	release?: GitHubRelease;
	onClose: () => void;
}

interface AssetCategory {
	label: string;
	pattern: RegExp;
	icon?: string;
}

const ASSET_CATEGORIES: AssetCategory[] = [
	{ label: 'macOS (Apple Silicon)', pattern: /-darwin-arm64\.(dmg|zip)$/i },
	{ label: 'macOS (Intel)', pattern: /-darwin-x64\.(dmg|zip)$/i },
	{ label: 'Windows (x64)', pattern: /-win32-x64\.(exe|zip)$/i },
	{ label: 'Windows (ARM)', pattern: /-win32-arm64\.(exe|zip)$/i },
	{ label: 'Linux (x64)', pattern: /-linux-x64\.(tar\.gz|deb|rpm|AppImage)$/i },
	{ label: 'Linux (ARM)', pattern: /-linux-arm64\.(tar\.gz|deb|rpm|AppImage)$/i },
];

const categorizeAssets = (assets: ReleaseAsset[]) => {
	const categories: Record<string, ReleaseAsset[]> = {};
	const categorized = new Set<string>();

	for (const category of ASSET_CATEGORIES) {
		const matching = assets.filter(a => category.pattern.test(a.name) && !categorized.has(a.name));
		if (matching.length > 0) {
			categories[category.label] = matching;
			matching.forEach(a => categorized.add(a.name));
		}
	}

	// Add uncategorized assets
	const uncategorized = assets.filter(a => !categorized.has(a.name));
	if (uncategorized.length > 0) {
		categories['Other'] = uncategorized;
	}

	return categories;
};

const formatReleaseDate = (dateStr: string) => {
	try {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	} catch {
		return '';
	}
};

const ReleaseNotesSection = ({ title, content, defaultOpen = true }: { title: string; content: string; defaultOpen?: boolean }) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	if (!content.trim()) return null;

	return (
		<div className="border border-void-border-2 rounded-lg overflow-hidden bg-void-bg-2/30">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center gap-2 px-4 py-3 hover:bg-void-bg-2/50 transition-colors text-left"
			>
				{isOpen ? (
					<ChevronDown size={16} className="text-void-fg-3 flex-shrink-0" />
				) : (
					<ChevronRight size={16} className="text-void-fg-3 flex-shrink-0" />
				)}
				<span className="text-sm font-semibold text-void-fg-1">{title}</span>
			</button>
			{isOpen && (
				<div className="px-4 pb-4 border-t border-void-border-1">
					<div className="mt-3 prose prose-sm prose-headings:text-void-fg-1 prose-headings:font-bold prose-headings:tracking-tight prose-p:text-void-fg-2 prose-p:leading-relaxed prose-p:text-base prose-p:mb-4 prose-li:text-void-fg-2 prose-li:mb-2 prose-strong:text-void-fg-1 prose-strong:font-bold prose-code:text-void-accent prose-code:bg-void-accent/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-sm prose-a:text-void-link-color prose-a:underline max-w-none">
						<ChatMarkdownRender markdown={content} />
					</div>
				</div>
			)}
		</div>
	);
};

const DownloadsSection = ({ assets, version }: { assets: ReleaseAsset[]; version: string }) => {
	const [isOpen, setIsOpen] = useState(false);
	const categories = categorizeAssets(assets);

	if (assets.length === 0) return null;

	return (
		<div className="border border-void-border-2 rounded-lg overflow-hidden bg-void-bg-2/30">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center gap-2 px-4 py-3 hover:bg-void-bg-2/50 transition-colors text-left"
			>
				{isOpen ? (
					<ChevronDown size={16} className="text-void-fg-3 flex-shrink-0" />
				) : (
					<ChevronRight size={16} className="text-void-fg-3 flex-shrink-0" />
				)}
				<Download size={16} className="text-void-accent flex-shrink-0" />
				<span className="text-sm font-semibold text-void-fg-1">Downloads</span>
				<span className="text-xs text-void-fg-4 ml-auto">{assets.length} files</span>
			</button>
			{isOpen && (
				<div className="px-4 pb-4 border-t border-void-border-1">
					<div className="mt-3 space-y-3">
						{Object.entries(categories).map(([category, categoryAssets]) => (
							<div key={category}>
								<div className="text-xs font-medium text-void-fg-3 mb-2">{category}</div>
								<div className="space-y-1">
									{categoryAssets.map(asset => (
										<a
											key={asset.name}
											href={asset.browser_download_url}
											className="flex items-center gap-2 px-3 py-2 rounded-lg bg-void-bg-1/50 hover:bg-void-bg-3/50 transition-colors text-xs text-void-fg-2 hover:text-void-fg-1 group"
										>
											<Download size={12} className="text-void-fg-4 group-hover:text-void-accent flex-shrink-0" />
											<span className="truncate flex-1">{asset.name}</span>
											<ExternalLink size={12} className="text-void-fg-4 opacity-0 group-hover:opacity-100 transition-opacity" />
										</a>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export const WhatsNewModal = ({ version, release, onClose }: WhatsNewModalProps) => {
	const isDark = useIsDark();
	const modalRef = useRef<HTMLDivElement>(null);

	// Parse release notes into sections
	const parseReleaseNotes = (body: string) => {
		const sections: { title: string; content: string }[] = [];

		// Try to parse by common section headers (## or ###)
		const lines = body.split('\n');
		let currentTitle = 'Release Notes';
		let currentContent: string[] = [];

		for (const line of lines) {
			const headerMatch = line.match(/^##\s+(.+)$/);
			if (headerMatch) {
				if (currentContent.length > 0 || currentTitle !== 'Release Notes') {
					sections.push({
						title: currentTitle,
						content: currentContent.join('\n').trim()
					});
				}
				currentTitle = headerMatch[1].trim();
				currentContent = [];
			} else {
				currentContent.push(line);
			}
		}

		// Add the last section
		if (currentContent.length > 0) {
			sections.push({
				title: currentTitle,
				content: currentContent.join('\n').trim()
			});
		}

		// If no sections were found, return the whole content
		if (sections.length === 0) {
			return [{ title: 'What\'s New', content: body }];
		}

		return sections;
	};

	// Close on escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};
		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [onClose]);

	// Handle clicks outside the modal
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [onClose]);

	// Handle scroll lock
	useEffect(() => {
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = originalOverflow;
		};
	}, []);

	const sections = release?.body ? parseReleaseNotes(release.body) : [];

	return (
		<div className={`@@void-scope ${isDark ? 'dark' : ''} fixed inset-0 z-[9999] flex items-center justify-center p-4`}>
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
			<div
				ref={modalRef}
				className={`
					relative w-full max-w-2xl min-h-[200px]
					bg-void-bg-1/95 backdrop-blur-xl
					border border-void-border-2 rounded-2xl
					shadow-2xl shadow-black/40
					flex flex-col
				`}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-5 border-b border-void-border-2 flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="bg-void-accent/10 p-2.5 rounded-xl">
							<Sparkles size={20} className="text-void-accent" />
						</div>
						<div>
							<h2 className="text-lg font-bold text-void-fg-1 tracking-tight">
								{release ? `Welcome to A-Coder ${release.tag_name}` : `A-Coder Updated`}
							</h2>
							<p className="text-xs text-void-fg-3">
								{release ? formatReleaseDate(release.published_at) : `Version ${version}`}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{release?.html_url && (
							<a
								href={release.html_url}
								target="_blank"
								rel="noopener noreferrer"
								className="p-2 hover:bg-void-bg-2 rounded-lg text-void-fg-3 hover:text-void-fg-1 transition-all"
								title="View on GitHub"
							>
								<ExternalLink size={18} />
							</a>
						)}
						<button
							onClick={onClose}
							className="p-2 hover:bg-void-bg-2 rounded-lg text-void-fg-3 hover:text-void-fg-1 transition-all"
						>
							<X size={18} />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6">
					<ErrorBoundary>
						{release ? (
							<div className="space-y-4">
								{sections.map((section, index) => (
									<ReleaseNotesSection
										key={index}
										title={section.title}
										content={section.content}
										defaultOpen={index === 0}
									/>
								))}
								{release.assets && release.assets.length > 0 && (
									<DownloadsSection assets={release.assets} version={release.tag_name} />
								)}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<div className="bg-void-bg-2 p-4 rounded-full mb-4">
									<Sparkles size={32} className="text-void-accent opacity-50" />
								</div>
								<p className="text-sm text-void-fg-2 font-medium">A-Coder has been updated!</p>
								<p className="text-xs text-void-fg-4 mt-1">
									You're now running version {version}
								</p>
							</div>
						)}
					</ErrorBoundary>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-void-border-2 flex-shrink-0 bg-void-bg-2/30">
					<button
						onClick={onClose}
						className="w-full px-4 py-2.5 bg-void-accent hover:bg-void-accent/90 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
					>
						Continue
					</button>
				</div>
			</div>
		</div>
	);
};