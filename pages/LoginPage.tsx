
import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-slate-950 dark:text-slate-50 tracking-tight mb-2">Welcome to ADAI Language Assistant</h1>
        <p className="text-slate-700 dark:text-slate-400 mb-8">Please log in or sign up to continue.</p>
        <button
          onClick={login}
          className="w-full bg-adai-primary hover:bg-adai-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300"
        >
          Login / Sign Up
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
