import React, { useState } from 'react';
import { useStore } from '../store';
import { Play, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export const DesktopView = () => {
    const { articles, capsules, workspace, previewRange, addRange, cancelRange, getDerived, setSourceStatus, startRehearsal, approveCapsule } = useStore();

    const activeCapsule = capsules.find(c => c.branchId === workspace.activeBranchId);
    const derived = getDerived();

    const [dragStart, setDragStart] = useState<{ articleId: string, sectionId: string } | null>(null);
    const [dragHover, setDragHover] = useState<{ articleId: string, sectionId: string } | null>(null);
    const [foldHeld, setFoldHeld] = useState(false);

    if (!activeCapsule) return <div>No active capsule</div>;

    const handleSectionMouseDown = (articleId: string, sectionId: string) => {
        setDragStart({ articleId, sectionId });
        setDragHover({ articleId, sectionId });
    };

    const handleSectionMouseEnter = (articleId: string, sectionId: string) => {
        if (dragStart && dragStart.articleId === articleId) {
            setDragHover({ articleId, sectionId });
        }
    };

    const handleSectionMouseUp = () => {
        if (dragStart && dragHover) {
            setFoldHeld(true);
        } else {
            setDragStart(null);
            setDragHover(null);
        }
    };

    const handleDropOnSeam = (insertAt: number) => {
        if (dragStart && dragHover) {
            previewRange(dragStart.articleId, dragStart.sectionId, dragHover.sectionId, insertAt);
        }
        setDragStart(null);
        setDragHover(null);
        setFoldHeld(false);
    };

    const isSectionSelected = (articleId: string, sectionId: string) => {
        if (!dragStart || !dragHover || dragStart.articleId !== articleId) return false;
        const article = articles.find(a => a.articleId === articleId);
        if (!article) return false;

        const startIdx = article.sections.findIndex(s => s.sectionId === dragStart.sectionId);
        const endIdx = article.sections.findIndex(s => s.sectionId === dragHover.sectionId);
        const currIdx = article.sections.findIndex(s => s.sectionId === sectionId);

        const minIdx = Math.min(startIdx, endIdx);
        const maxIdx = Math.max(startIdx, endIdx);

        return currIdx >= minIdx && currIdx <= maxIdx;
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans" onMouseUp={handleSectionMouseUp}>
            {/* Left Sidebar - Articles Spine */}
            <div className="w-1/3 border-r bg-white flex flex-col">
                <div className="p-4 border-b font-semibold flex justify-between items-center bg-gray-100">
                    Sources
                    <button className="text-sm text-blue-600">Search</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    {articles.map(article => (
                        <div key={article.articleId} className="space-y-2">
                            <div className="flex justify-between items-center font-semibold text-gray-700">
                                <span>{article.title}</span>
                                <span className="text-xs px-2 py-1 bg-gray-200 rounded">{article.status}</span>
                            </div>
                            <div className="space-y-1 relative">
                                {article.sections.map((section) => (
                                    <div
                                        key={section.sectionId}
                                        onMouseDown={() => handleSectionMouseDown(article.articleId, section.sectionId)}
                                        onMouseEnter={() => handleSectionMouseEnter(article.articleId, section.sectionId)}
                                        className={`p-2 border rounded cursor-pointer transition-colors ${isSectionSelected(article.articleId, section.sectionId) ? 'bg-blue-100 border-blue-400' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-medium text-sm">{section.heading}</span>
                                            <span className="text-xs text-gray-500">{section.wordCount} words / {section.utf8Bytes} B</span>
                                        </div>
                                    </div>
                                ))}

                                {foldHeld && dragStart?.articleId === article.articleId && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded shadow-lg cursor-grab z-10 pointer-events-none"
                                    >
                                        Fold held... Drop on seam
                                    </motion.div>
                                )}
                            </div>
                            <button
                                onClick={() => setSourceStatus(article.articleId, article.status === 'available' ? 'unavailable' : 'available')}
                                className="text-xs text-blue-500 underline"
                            >
                                Toggle Availability
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Middle - Capsule Ribbon */}
            <div className="w-1/3 border-r bg-gray-100 flex flex-col">
                <div className="p-4 border-b font-semibold bg-white flex justify-between items-center">
                    Capsule: {activeCapsule.title}
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">{workspace.activeBranchId}</span>
                </div>
                <div className="p-4 bg-white border-b text-sm">
                    <div className="flex justify-between mb-1">
                        <span>Bytes: {derived.capsuleTotals?.bytes} / {activeCapsule.byteBudget}</span>
                        <span className={derived.capsuleTotals?.bytes > activeCapsule.byteBudget ? 'text-red-500 font-bold' : ''}>
                            {Math.round(derived.capsuleTotals?.bytes / activeCapsule.byteBudget * 100)}%
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Minutes: {derived.capsuleTotals?.minutes} / {activeCapsule.minuteBudget}</span>
                        <span className={derived.capsuleTotals?.minutes > activeCapsule.minuteBudget ? 'text-red-500 font-bold' : ''}>
                            {Math.round(derived.capsuleTotals?.minutes / activeCapsule.minuteBudget * 100)}%
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 relative">
                    <div className="w-full h-8 border-2 border-dashed border-gray-300 rounded mb-2 flex items-center justify-center text-gray-400 hover:bg-gray-200 cursor-pointer transition-colors" onClick={() => handleDropOnSeam(1)}>Seam 1</div>

                    {activeCapsule.entries.map((entry: any, index: number) => {
                        const isOverBudgetPreview = workspace.overBudgetPreview?.insertAt === index + 1;
                        return (
                            <React.Fragment key={entry.entryId}>
                                {isOverBudgetPreview && (
                                    <div className="p-3 mb-2 bg-yellow-100 border border-yellow-400 rounded shadow">
                                        <div className="font-bold text-yellow-800">Preview (Position {index + 1})</div>
                                        <div className="text-sm">Added Words: {workspace.overBudgetPreview.wordCount}</div>
                                        <div className="text-sm">Added Bytes: {workspace.overBudgetPreview.utf8Bytes}</div>
                                        {workspace.overBudgetPreview.willOverflowBytes && <div className="text-red-600 font-bold text-sm">Will exceed byte budget!</div>}
                                        {workspace.overBudgetPreview.willOverflowMinutes && <div className="text-red-600 font-bold text-sm">Will exceed minute budget!</div>}

                                        <div className="mt-2 flex space-x-2">
                                            <button
                                                className={`px-3 py-1 rounded text-white text-sm ${workspace.overBudgetPreview.willOverflowBytes || workspace.overBudgetPreview.willOverflowMinutes ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'}`}
                                                disabled={workspace.overBudgetPreview.willOverflowBytes || workspace.overBudgetPreview.willOverflowMinutes}
                                                onClick={() => addRange(workspace.overBudgetPreview.articleId, workspace.overBudgetPreview.firstSectionId, workspace.overBudgetPreview.lastSectionId, workspace.overBudgetPreview.insertAt)}
                                            >
                                                Confirm
                                            </button>
                                            <button className="px-3 py-1 rounded bg-gray-200 text-sm" onClick={cancelRange}>Cancel</button>
                                        </div>
                                    </div>
                                )}
                                <div className="p-3 mb-2 bg-white border rounded shadow-sm relative group">
                                    <div className="flex justify-between">
                                        <span className="font-medium text-sm">{entry.articleId} (Sec {entry.firstSectionId.split('-')[2]} - {entry.lastSectionId.split('-')[2]})</span>
                                        <span className="text-xs text-green-600">{entry.fallbackStatus}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Pos: {entry.order} | Words: {entry.wordCount} | Bytes: {entry.utf8Bytes} | Est: {entry.estimatedMinutes}m
                                    </div>
                                </div>
                                <div className="w-full h-8 border-2 border-dashed border-gray-300 rounded mb-2 flex items-center justify-center text-gray-400 hover:bg-gray-200 cursor-pointer transition-colors" onClick={() => handleDropOnSeam(index + 2)}>Seam {index + 2}</div>
                            </React.Fragment>
                        );
                    })}

                    {workspace.overBudgetPreview?.insertAt === activeCapsule.entries.length + 1 && (
                         <div className="p-3 mb-2 bg-yellow-100 border border-yellow-400 rounded shadow">
                            <div className="font-bold text-yellow-800">Preview (Position {activeCapsule.entries.length + 1})</div>
                            <div className="text-sm">Added Words: {workspace.overBudgetPreview.wordCount}</div>
                            <div className="text-sm">Added Bytes: {workspace.overBudgetPreview.utf8Bytes}</div>
                            {workspace.overBudgetPreview.willOverflowBytes && <div className="text-red-600 font-bold text-sm">Will exceed byte budget!</div>}
                            {workspace.overBudgetPreview.willOverflowMinutes && <div className="text-red-600 font-bold text-sm">Will exceed minute budget!</div>}

                            <div className="mt-2 flex space-x-2">
                                <button
                                    className={`px-3 py-1 rounded text-white text-sm ${workspace.overBudgetPreview.willOverflowBytes || workspace.overBudgetPreview.willOverflowMinutes ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'}`}
                                    disabled={workspace.overBudgetPreview.willOverflowBytes || workspace.overBudgetPreview.willOverflowMinutes}
                                    onClick={() => addRange(workspace.overBudgetPreview.articleId, workspace.overBudgetPreview.firstSectionId, workspace.overBudgetPreview.lastSectionId, workspace.overBudgetPreview.insertAt)}
                                >
                                    Confirm
                                </button>
                                <button className="px-3 py-1 rounded bg-gray-200 text-sm" onClick={cancelRange}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right - Offline Preview & Tools */}
            <div className="w-1/3 bg-white flex flex-col">
                <div className="p-4 border-b font-semibold bg-gray-100 flex justify-between items-center">
                    Offline Preview & Tools
                </div>

                <div className="p-4 border-b space-y-2">
                    <div className="flex space-x-2">
                        <button className="flex-1 flex items-center justify-center space-x-2 bg-gray-800 text-white p-2 rounded text-sm hover:bg-gray-700" onClick={startRehearsal}>
                            <Play size={16} /> <span>Rehearsal</span>
                        </button>
                        <button className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white p-2 rounded text-sm hover:bg-green-700" onClick={approveCapsule}>
                            <span>Approve</span>
                        </button>
                    </div>
                    <button className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white p-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400" disabled={!activeCapsule.isApproved}>
                        <Download size={16} /> <span>Export Packet</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 border-t">
                    <h3 className="font-semibold mb-4 text-center">Reader View</h3>
                    <div className="bg-white border rounded shadow p-6 max-w-md mx-auto prose prose-sm">
                        <h1 className="text-xl font-bold mb-4">{activeCapsule.title}</h1>
                        {activeCapsule.entries.map((entry: any) => {
                            const article = articles.find(a => a.articleId === entry.articleId);
                            const status = derived.sourceStatuses[entry.articleId];

                            return (
                                <div key={entry.entryId} className="mb-6">
                                    <h2 className="text-lg font-semibold border-b pb-1 mb-2">{article?.title}</h2>
                                    {entry.sectionIds.map((sid: string) => {
                                        const section = article?.sections.find(s => s.sectionId === sid);
                                        if (status === 'unavailable') {
                                            // Fallback reading
                                            return (
                                                <div key={sid} className="mb-2 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                                                    <h3 className="font-medium text-yellow-800">{section?.heading} (Fallback)</h3>
                                                    <p className="text-gray-600">[Saved text for {sid}]</p>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={sid} className="mb-2">
                                                <h3 className="font-medium">{section?.heading}</h3>
                                                <p className="text-gray-600">[Fictional text content for {sid} goes here...]</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
