import React from 'react';
import { TRENDING_TOPICS } from '../constants';
import { Card } from './ui/Card';

export const TrendingTopics: React.FC = () => {
    return (
        <Card>
            <div className="p-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Trending Topics</h3>
                <div className="space-y-4">
                    {TRENDING_TOPICS.map(topic => (
                        <div key={topic}>
                            <a href="#" className="font-semibold text-md text-slate-800 dark:text-slate-200 hover:underline">
                                {topic}
                            </a>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {Math.floor(Math.random() * 5000 + 1000).toLocaleString()} posts
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};