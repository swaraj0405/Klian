import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { ICONS } from '../constants';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onPost: (content: string, image?: string) => void;
}

const IconButton: React.FC<{ title: string; children: React.ReactNode; onClick?: () => void; isActive?: boolean }> = ({ title, children, onClick, isActive }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        className={`p-2 rounded-full transition-colors ${isActive ? 'text-red-500 bg-red-100 dark:bg-red-900/40' : 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40'}`}
    >
        {children}
    </button>
);

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, user, onPost }) => {
    const [content, setContent] = useState('');
    const [image, setImage] = useState<string>('');
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset content and focus textarea when modal opens
            setContent('');
            setImage('');
            setImagePreview('');
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content]);

    const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a PNG or JPG image');
            return;
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB');
            return;
        }

        setIsLoadingImage(true);
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64String = e.target?.result as string;
                setImage(base64String);
                setImagePreview(base64String);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsLoadingImage(false);
        }
    };

    const handleRemoveImage = () => {
        setImage('');
        setImagePreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handlePost = () => {
        if (content.trim() || image) {
            onPost(content, image || undefined);
        }
    };

    const applyFormat = (format: 'bold' | 'italic' | 'underline') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);

        if (!selectedText) {
            textarea.focus();
            return;
        }

        const formatChars: Record<typeof format, string> = {
            bold: '**',
            italic: '*',
            underline: '__',
        };
        const chars = formatChars[format];
        const formattedText = `${chars}${selectedText}${chars}`;
        
        const newContent = content.substring(0, start) + formattedText + content.substring(end);
        
        setContent(newContent);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + chars.length, end + chars.length);
        }, 0);
    };

    if (!isOpen) return null;

    return (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in"
          onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <Button onClick={handlePost} disabled={!content.trim() && !image} className="!py-1.5 !px-5 !font-bold">
                        Post
                    </Button>
                </header>

                <main className="flex-1 p-4 overflow-y-auto">
                    <div className="flex items-start space-x-4">
                        <Avatar src={user.avatar} alt={user.name} />
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-transparent dark:text-slate-200 focus:outline-none resize-none text-lg placeholder:text-slate-500"
                            rows={3}
                            placeholder="What's happening?"
                        />
                    </div>
                    
                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="mt-4 relative">
                            <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="w-full rounded-lg max-h-64 object-cover"
                            />
                            <button
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                                title="Remove image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        </div>
                    )}
                </main>
                
                <footer className="p-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center -ml-2">
                             <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg"
                                onChange={handleImageSelect}
                                className="hidden"
                                disabled={isLoadingImage}
                             />
                             <IconButton 
                                title="Add Image" 
                                onClick={() => fileInputRef.current?.click()}
                                isActive={!!image}
                             >
                                {ICONS.media}
                             </IconButton>
                             <IconButton title="Add GIF">{ICONS.gif}</IconButton>
                             <IconButton title="Add Document">{ICONS.document}</IconButton>
                         </div>
                         <div className="flex items-center -mr-2">
                            <IconButton title="Bold" onClick={() => applyFormat('bold')}>{ICONS.bold}</IconButton>
                            <IconButton title="Italic" onClick={() => applyFormat('italic')}>{ICONS.italic}</IconButton>
                            <IconButton title="Underline" onClick={() => applyFormat('underline')}>{ICONS.underline}</IconButton>
                         </div>
                    </div>
                </footer>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }

                @keyframes slide-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};
