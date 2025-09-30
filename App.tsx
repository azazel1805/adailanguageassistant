


import React, { useState, ReactNode, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import QuestionAnalyzer from './pages/QuestionAnalyzer';
import AITutor from './pages/AITutor';
import Dictionary from './pages/Dictionary';
import History from './pages/History';
import { HistoryProvider } from './context/HistoryContext';
import { AnalyzeIcon, DictionaryIcon, HistoryIcon, DashboardIcon, LogoutIcon, TutorIcon, ReadingIcon, WritingIcon, VocabularyIcon, ListeningIcon, MenuIcon, DeconstructIcon, NewsIcon, ExamIcon, PracticeToolsIcon, CohesionIcon, DiagramIcon, PlannerIcon, PDFImporterIcon, StoryIcon, SkillTreeIcon, OrderingIcon, SpeakingSimulatorIcon, PhrasalVerbDeconstructorIcon, AdminIcon, TranslationIcon, DialogueIcon, VisualReadingIcon, CreativeWritingIcon, PragmaticIcon, VisualDictionaryIcon } from './components/icons/Icons';
import { useAuth } from './context/AuthContext';
import ReadingPractice from './pages/ReadingPractice';
import WritingAssistant from './pages/WritingAssistant';
import VocabularyTrainer from './pages/VocabularyTrainer';
import ListeningPractice from './pages/ListeningPractice';
import PassageDeconstruction from './pages/PassageDeconstruction';
import NewsReader from './pages/NewsReader';
import { Tab, MockExamResultData } from './types';
import ParagraphCohesionAnalyzer from './pages/ParagraphCohesionAnalyzer';
import SentenceDiagrammer from './pages/SentenceDiagrammer';
import StudyPlanner from './pages/StudyPlanner';
import PDFImporter from './pages/PDFImporter';
import VocabularyStoryWeaver from './pages/VocabularyStoryWeaver';
import SkillTree from './pages/SkillTree';
import SentenceOrdering from './pages/SentenceOrdering';
import SpeakingSimulator from './pages/SpeakingSimulator';
import WelcomeTour from './components/WelcomeTour';
import useLocalStorage from './hooks/useLocalStorage';
import PhrasalVerbDeconstructor from './pages/PhrasalVerbDeconstructor';
import AdminPage from './pages/AdminPage';
import TranslationAnalyst from './pages/TranslationAnalyst';
import DialogueCompletion from './pages/DialogueCompletion';
import VisualReadingTool from './pages/VisualReadingTool';
import CreativeWritingPartner from './pages/CreativeWritingPartner';
import PragmaticAnalysisTool from './pages/PragmaticAnalysisTool';
import VisualDictionary from './pages/VisualDictionary';

const ADAI_FAVICON = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGZpbHRlciBpZD0iZ2xvdy1maWx0ZXIiIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPjxmZUdhdXNzaWFuQmx1ciBpbj0iU291cmNlQWxwaGEiIHN0ZERldmlhdGlvbj0iMiIgcmVzdWx0PSJibHVyIi8+PGZlRmxvb2QgZmxvb2QtY29sb3I9IiNhODU1ZjciIHJlc3VsdD0iZmxvb2QiLz48ZmVDb21wb3NpdGUgaW49ImZsb29kIiBpbjI9ImJsdXIiIG9wZXJhdG9yPSJpbiIgcmVzdWx0PSJjb2xvcmVkQmx1ciIvPjxmZU1lcmdlPjxmZU1lcmdlTm9kZSBpbj0iY29sb3JlZEJsdXIiLz48ZmVNZXJnZU5vZGUgaW49IlNvdXJjZUdyYXBoaWMiLz48L2ZlTWVyZ2U+PC9maWx0ZXI+PC9kZWZzPjxzdHlsZT4uYmFzZS10ZXh0IHsgZm9udDogYm9sZCA0OHB4IHNhbnMtc2VyaWY7IGZpbGw6ICMxZjI5MzcgOyB9IC5pLXRleHQgeyBmb250OiBib2xkIDQ4cHggc2Fucy1zZXJpZjsgZmlsbDogI2MwODRmYzsgfTwvc3R5bGU+PHRleHQgeD0iNTAiIHk9IjYyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj48dHNwYW4gY2xhc3M9ImJhc2UtdGV4dCI+QURBPC90c3Bhbj48dHNwYW4gY2xhc3M9ImktdGV4dCIgZmlsdGVyPSJ1cmwoI2dsb3ctZmlsdGVyKSI+STwvdHNwYW4+PC90ZXh0Pjwvc3ZnPg==";

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const { user, login, logout, authReady } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tutorInitialMessage, setTutorInitialMessage] = useState<string | null>(null);
  const [theme, setTheme] = useLocalStorage<Theme>('theme-mode', 'light');

  const [hasSeenTour, setHasSeenTour] = useLocalStorage(`welcome-tour-seen-${user?.email || 'guest'}`, false);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);

  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.title = 'ADAI - Language Assistant';
    
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = ADAI_FAVICON;
  }, []);

  useEffect(() => {
    if (user && !hasSeenTour) {
      setShowWelcomeTour(true);
    }
  }, [user, hasSeenTour]);

  const handleFinishTour = () => {
    setShowWelcomeTour(false);
    setHasSeenTour(true);
  };
  
  const handleAskTutor = (context: string) => {
      setTutorInitialMessage(context);
      handleTabClick('tutor');
  };

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false); // Close mobile menu on selection
  };
  
  const handleExamFinish = (result: MockExamResultData) => {
    handleTabClick('history');
  };

  if (!authReady) {
    // Show a simple loader while Netlify Identity initializes
    return <div className="flex h-screen w-full items-center justify-center">Loading authentication...</div>;
  }

  // --- All Tab Definitions ---
  const allTabs: { [key in Tab]?: { id: Tab, label: string, icon: ReactNode } } = {
    'dashboard': { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    'skill_tree': { id: 'skill_tree', label: 'Yetenek Ağacı', icon: <SkillTreeIcon /> },
    'planner': { id: 'planner', label: 'Akıllı Planlayıcı', icon: <PlannerIcon /> },
    'tutor': { id: 'tutor', label: 'AI Eğitmen', icon: <TutorIcon /> },
    'history': { id: 'history', label: 'Geçmiş', icon: <HistoryIcon /> },
    'deconstruction': { id: 'deconstruction', label: 'Metin Analizi', icon: <DeconstructIcon /> },
    'diagrammer': { id: 'diagrammer', label: 'Cümle Görselleştirici', icon: <DiagramIcon /> },
    'cohesion_analyzer': { id: 'cohesion_analyzer', label: 'Paragraf Bağlantı Analisti', icon: <CohesionIcon /> },
    'sentence_ordering': { id: 'sentence_ordering', label: 'Cümle Sıralama', icon: <OrderingIcon /> },
    'translation_analyst': { id: 'translation_analyst', label: 'Çeviri Analisti', icon: <TranslationIcon /> },
    'pragmatic_analyzer': { id: 'pragmatic_analyzer', label: 'Pragmatik Analiz', icon: <PragmaticIcon /> },
    'dictionary': { id: 'dictionary', label: 'Sözlük', icon: <DictionaryIcon /> },
    'visual_dictionary': { id: 'visual_dictionary', label: 'Görsel Sözlük', icon: <VisualDictionaryIcon /> },
    'vocabulary': { id: 'vocabulary', label: 'Kelime Antrenörü', icon: <VocabularyIcon /> },
    'vocabulary_story_weaver': { id: 'vocabulary_story_weaver', label: 'Kelime Hikayesi', icon: <StoryIcon /> },
    'phrasal_verb_deconstructor': { id: 'phrasal_verb_deconstructor', label: 'Phrasal Verb Parçalayıcı', icon: <PhrasalVerbDeconstructorIcon /> },
    'news': { id: 'news', label: 'Etkileşimli Gündem', icon: <NewsIcon /> },
    'reading': { id: 'reading', label: 'Okuma Anlama Analizi', icon: <ReadingIcon /> },
    'visual_reading': { id: 'visual_reading', label: 'Görsel Okuma', icon: <VisualReadingIcon /> },
    'writing': { id: 'writing', label: 'Yazma Pratiği', icon: <WritingIcon /> },
    'creative_writing': { id: 'creative_writing', label: 'Creative Writing', icon: <CreativeWritingIcon /> },
    'listening': { id: 'listening', label: 'Dinleme Pratiği', icon: <ListeningIcon /> },
    'speaking_simulator': { id: 'speaking_simulator', label: 'Konuşma Simülatörü', icon: <SpeakingSimulatorIcon /> },
    'analyzer': { id: 'analyzer', label: 'Soru Analisti', icon: <AnalyzeIcon /> },
    'dialogue_completion': { id: 'dialogue_completion', label: 'Diyalog Kurucu', icon: <DialogueIcon /> },
    'pdf_importer': { id: 'pdf_importer', label: 'PDF Sınav Yükleyici', icon: <PDFImporterIcon /> },
    'admin': { id: 'admin', label: 'Admin Panel', icon: <AdminIcon /> },
  };

  const adaiMenuStructure = {
    main: ['dashboard', 'skill_tree', 'planner', 'tutor'],
    accordions: [
      { key: 'practice', label: "Pratik Araçları", icon: <PracticeToolsIcon />, tabs: ['visual_reading', 'writing', 'creative_writing', 'listening', 'speaking_simulator'] },
      { key: 'vocab', label: "Kelime ve Okuma", icon: <DictionaryIcon />, tabs: ['dictionary', 'visual_dictionary', 'vocabulary', 'vocabulary_story_weaver', 'phrasal_verb_deconstructor', 'news'] },
      { key: 'analysis', label: "Dil Analizi", icon: <DeconstructIcon />, tabs: ['deconstruction', 'diagrammer', 'translation_analyst', 'pragmatic_analyzer'] },
      { key: 'focused_analysis', label: "Odaklı Analiz", icon: <ExamIcon />, tabs: ['analyzer', 'reading', 'cohesion_analyzer', 'sentence_ordering', 'dialogue_completion', 'pdf_importer'] },
    ],
    bottom: ['history', 'admin']
  };
  
  const NavButton: React.FC<{ tab: Tab, label: string, icon: ReactNode }> = ({ tab, label, icon }) => (
    <button
      onClick={() => handleTabClick(tab)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 border-l-4 ${
        activeTab === tab
          ? 'bg-adai-secondary border-adai-primary text-white'
          : 'border-transparent text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-adai-primary'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const renderContent = (): ReactNode => {
      // If user is not logged in, show a welcome/login message.
      if (!user) {
        return (
            <div className="text-center py-10">
                <h1 className="text-4xl font-bold text-gray-950 dark:text-gray-50 tracking-tight mb-2">Welcome to ADAI Language Assistant</h1>
                <p className="text-lg text-slate-700 dark:text-slate-400 mb-8">Please log in to access your personalized learning tools.</p>
                <button
                    onClick={login}
                    className="px-8 py-3 bg-adai-primary hover:bg-adai-secondary text-white font-bold rounded-md transition duration-300"
                >
                    Login / Sign Up
                </button>
            </div>
        );
      }
      
      switch (activeTab) {
          case 'dashboard':
              return <Dashboard onNavigate={handleTabClick} />;
          case 'skill_tree':
              return <SkillTree />;
          case 'planner':
              return <StudyPlanner onNavigate={handleTabClick} />;
          case 'pdf_importer':
              return <PDFImporter onAskTutor={handleAskTutor} onExamFinish={handleExamFinish} />;
          case 'analyzer':
              return <QuestionAnalyzer onAskTutor={handleAskTutor} />;
          case 'tutor':
              return <AITutor initialMessage={tutorInitialMessage} onMessageSent={() => setTutorInitialMessage(null)} />;
          case 'reading':
              return <ReadingPractice onAskTutor={handleAskTutor} />;
          case 'visual_reading':
              return <VisualReadingTool />;
          case 'deconstruction':
              return <PassageDeconstruction />;
          case 'diagrammer':
              return <SentenceDiagrammer />;
          case 'cohesion_analyzer':
              return <ParagraphCohesionAnalyzer />;
          case 'sentence_ordering':
              return <SentenceOrdering />;
          case 'translation_analyst':
              return <TranslationAnalyst />;
          case 'pragmatic_analyzer':
              return <PragmaticAnalysisTool />;
          case 'writing':
              return <WritingAssistant />;
          case 'creative_writing':
              return <CreativeWritingPartner />;
          case 'listening':
              return <ListeningPractice onAskTutor={handleAskTutor} />;
          case 'speaking_simulator':
              return <SpeakingSimulator />;
          case 'news':
              return <NewsReader onAskTutor={handleAskTutor} />;
          case 'dictionary':
              return <Dictionary />;
          case 'visual_dictionary':
              return <VisualDictionary />;
          case 'dialogue_completion':
              return <DialogueCompletion />;
          case 'vocabulary':
              return <VocabularyTrainer />;
          case 'vocabulary_story_weaver':
              return <VocabularyStoryWeaver />;
          case 'phrasal_verb_deconstructor':
              return <PhrasalVerbDeconstructor />;
          case 'history':
              return <History />;
          case 'admin':
                return user.roles?.includes('admin') ? <AdminPage /> : <Dashboard onNavigate={handleTabClick} />;
          default:
              return <Dashboard onNavigate={handleTabClick} />;
      }
  };

  const Accordion: React.FC<{
      accordionKey: string;
      label: string;
      icon: ReactNode;
      tabs: Tab[];
  }> = ({ accordionKey, label, icon, tabs }) => {
      const isOpen = openAccordions.includes(accordionKey);
      const isActive = tabs.some(t => t === activeTab);

      const setIsOpen = (openState: boolean) => {
          setOpenAccordions(prev => 
              openState 
              ? [...prev, accordionKey] 
              : prev.filter(k => k !== accordionKey)
          );
      };

      const validTabs = tabs
        .map(tId => allTabs[tId])
        .filter((tab): tab is { id: Tab; label: string; icon: ReactNode } => !!tab);

      return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 border-l-4 ${
                    isActive
                        ? 'bg-gray-100 dark:bg-gray-700 border-adai-primary text-adai-primary'
                        : 'border-transparent text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-adai-primary'
                }`}
            >
                <div className="flex items-center gap-3">
                    {icon}
                    {label}
                </div>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="pl-4 mt-1 space-y-1">
                    {validTabs.map(tab => <NavButton key={tab.id} tab={tab.id} label={tab.label} icon={tab.icon} />)}
                </div>
            )}
        </div>
      );
  };
  
  const ThemeSwitcher: React.FC = () => (
    <button 
      onClick={toggleTheme}
      className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-adai-primary"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
      <span>{theme === 'light' ? 'Koyu Mod' : 'Açık Mod'}</span>
    </button>
  );

  const SidebarContent = () => {
    const structure = adaiMenuStructure;
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-950 dark:text-gray-50 tracking-tight">
            <span>ADA<span className="special-glow">I</span></span>
          </h1>
        </div>
        
        {user ? (
            <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
            {structure.main.map(tabId => {
                const tab = allTabs[tabId as Tab];
                return tab ? <NavButton key={tab.id} tab={tab.id} label={tab.label} icon={tab.icon} /> : null;
            })}

            {structure.accordions.map(accordion => (
                <Accordion 
                key={accordion.key}
                accordionKey={accordion.key}
                label={accordion.label}
                icon={accordion.icon}
                tabs={accordion.tabs as Tab[]}
                />
            ))}

            {structure.bottom.map(tabId => {
                if (tabId === 'admin' && !user.roles?.includes('admin')) return null;
                const tab = allTabs[tabId as Tab];
                return tab ? <NavButton key={tab.id} tab={tab.id} label={tab.label} icon={tab.icon} /> : null;
            })}
            </nav>
        ) : (
            <div className="flex-grow p-4 flex items-center justify-center text-center text-gray-500">
                Please log in to see the available tools.
            </div>
        )}

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {user ? (
            <>
                <div className="flex items-center">
                    <p className="text-sm text-gray-700 dark:text-gray-400">Signed in as <strong className="text-gray-950 dark:text-gray-50">{user.email}</strong></p>
                </div>
                <ThemeSwitcher />
                <button
                    onClick={logout}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-adai-primary"
                >
                    <LogoutIcon />
                    Çıkış Yap
                </button>
            </>
          ) : (
             <button
                onClick={login}
                className="w-full text-left flex items-center justify-center gap-3 px-3 py-2 rounded-md text-base font-bold bg-adai-primary text-white hover:bg-adai-secondary"
            >
                Login / Sign Up
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <HistoryProvider>
      {showWelcomeTour && <WelcomeTour onFinish={handleFinishTour} />}
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64 bg-white dark:bg-slate-800 shadow-lg">
            <SidebarContent />
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <div className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div onClick={() => setIsMenuOpen(false)} className="absolute inset-0 bg-black bg-opacity-60"></div>
          <div className={`relative flex flex-col w-64 h-full bg-white dark:bg-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <SidebarContent />
          </div>
        </div>

        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-slate-800 shadow items-center justify-between px-4">
            <h1 className="text-lg font-bold text-gray-950 dark:text-gray-50">
                <span>ADA<span className="special-glow">I</span></span>
            </h1>
            <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-adai-primary hover:bg-gray-100 dark:hover:bg-gray-700">
                <span className="sr-only">Open menu</span>
                <MenuIcon />
            </button>
          </header>
          
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            <div className="p-4 sm:p-6 lg:p-8">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </HistoryProvider>
  );
};

export default App;