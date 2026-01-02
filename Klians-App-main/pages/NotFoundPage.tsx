
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to">404</h1>
      <p className="text-2xl font-semibold mt-4 text-slate-800 dark:text-slate-100">Page Not Found</p>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Sorry, the page you are looking for does not exist.</p>
      <Link to="/home" className="mt-6">
        <Button>Go to Homepage</Button>
      </Link>
    </div>
  );
};
