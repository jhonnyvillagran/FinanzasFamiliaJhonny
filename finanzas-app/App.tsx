
import React, { useState, useMemo, useEffect, useRef } from 'react';
import parseISO from 'date-fns/parseISO';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import format from 'date-fns/format';
import isSameDay from 'date-fns/isSameDay';
import isThisMonth from 'date-fns/isThisMonth';
import startOfWeek from 'date-fns/startOfWeek';
import subWeeks from 'date-fns/subWeeks';
import eachWeekOfInterval from 'date-fns/eachWeekOfInterval';
import subMonths from 'date-fns/subMonths';
import eachMonthOfInterval from 'date-fns/eachMonthOfInterval';
import subDays from 'date-fns/subDays';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import es from 'date-fns/locale/es';
import { AiAdvisor } from './components/AiAdvisor';
import { Charts } from './components/Charts';
import { CalendarView } from './components/CalendarView';
import { Calculator } from './components/Calculator';
import { Tab } from './constants';
import { Expense, Reminder } from './types';
import { initSupabase, supabase } from './services/supabase';

// Icons components
const Icons = {
    Logout: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
        </svg>
    ),
    Config: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
    ),
    Edit: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
    ),
    Trash: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
    ),
    TrendingUp: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
    ),
    Target: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
    ),
    Download: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
    )
};

// Initial States
const INITIAL_FORM_STATE = {
  description: '',
  amount: '',
  category: 'General',
  date: new Date().toISOString().split('T')[0]
};

import { EXPENSE_CATEGORIES } from './constants';
import { generateFinancialReport } from './services/geminiService';

const App: React.FC = () => {
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>(Tab.Report);
    
    // Data States
    const [budget, setBudget] = useState(0);
    const [dailyLimit, setDailyLimit] = useState(0);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);

    // UI States
    const [notification, setNotification] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Edit/Delete States
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const formRef = useRef<HTMLDivElement>(null);

    // Budget Tab State
    const [budgetMode, setBudgetMode] = useState<'set' | 'add'>('set');

    // Report State
    const [aiReport, setAiReport] = useState<string | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // Auth States
    const [urlInput, setUrlInput] = useState('');
    const [keyInput, setKeyInput] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    // PWA Install
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const processedReminders = useRef(new Set<string>());

    // 1. Check Session & Init
    useEffect(() => {
        const init = async () => {
            const savedUrl = localStorage.getItem('sb_url');
            const savedKey = localStorage.getItem('sb_key');
            const savedDarkMode = localStorage.getItem('dark-mode') === 'true';

            setIsDarkMode(savedDarkMode);
            if (savedDarkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            if (savedUrl && savedKey) {
                try {
                    initSupabase(savedUrl, savedKey);
                    setIsSupabaseConnected(true);
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        setCurrentUser({ id: session.user.id, email: session.user.email });
                    }
                } catch (e) {
                    console.error("Error en inicialización:", e);
                    localStorage.removeItem('sb_url');
                    localStorage.removeItem('sb_key');
                }
            }
            
            // Request notification permission
            if ("Notification" in window && Notification.permission !== "granted") {
                Notification.requestPermission();
            }

            // Splash screen delay
            setTimeout(() => setIsCheckingSession(false), 800);
        };
        init();

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowInstallBtn(false);
        }
    };

    // Update form when editing
    useEffect(() => {
        if (editingExpense) {
            setFormData({
                description: editingExpense.description,
                amount: editingExpense.amount.toString(),
                category: editingExpense.category,
                date: editingExpense.date.split('T')[0]
            });
        } else {
            setFormData(INITIAL_FORM_STATE);
        }
    }, [editingExpense]);

    // 2. Listen for Auth Changes
    useEffect(() => {
        if (!isSupabaseConnected) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth Event:", event);
            if (session?.user) {
                setCurrentUser({ id: session.user.id, email: session.user.email });
                // No need to fetch data here, rely on currentUser effect
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setExpenses([]);
                setReminders([]);
                setBudget(0);
                setDailyLimit(0);
            }
        });

        return () => subscription.unsubscribe();
    }, [isSupabaseConnected]);

    // 3. Fetch Data
    const fetchData = React.useCallback(async () => {
        if (!currentUser || !isSupabaseConnected) return;
        setIsLoading(true);
        try {
            // Fetch Expenses
            const { data: expData, error: expError } = await supabase
                .from('expenses')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('date', { ascending: false });
            
            if (expError) throw expError;

            // Ensure category exists
            const formattedExpenses = (expData || []).map((e: any) => ({
                ...e,
                category: e.category || 'General'
            }));
            setExpenses(formattedExpenses);

            // Fetch Budget & Daily Limit
            const { data: budgetData, error: budgetError } = await supabase
                .from('budgets')
                .select('amount, daily_limit')
                .eq('user_id', currentUser.id)
                .maybeSingle();
            
            if (budgetError) throw budgetError;

            if (budgetData) {
                setBudget(budgetData.amount || 0);
                setDailyLimit(budgetData.daily_limit || 0);
            } else {
                setBudget(0);
                setDailyLimit(0);
            }

            // Fetch Reminders
            const { data: remData, error: remError } = await supabase
                .from('reminders')
                .select('*')
                .eq('user_id', currentUser.id);
                
            if (remError) {
                if (remError.message.includes('does not exist')) {
                    console.warn("Tabla reminders no encontrada.");
                } else {
                    throw remError;
                }
            }
            setReminders(remData || []);

        } catch (error: any) {
            setNotification(`Error cargando datos: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, isSupabaseConnected]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 4. Check Reminders for Notification
    useEffect(() => {
        if (!currentUser || reminders.length === 0) return;

        const checkReminders = () => {
            const now = new Date();
            reminders.forEach(r => {
                if (r.is_completed) return;
                const reminderDate = parseISO(r.date);
                const diff = differenceInMinutes(now, reminderDate);

                // Si la hora actual coincide con la del recordatorio (margen de 1 minuto)
                if (diff >= 0 && diff < 2 && !processedReminders.current.has(r.id)) {
                    processedReminders.current.add(r.id);
                    
                    // Enviar Notificación del Navegador
                    if ("Notification" in window && Notification.permission === "granted") {
                        new Notification("🔔 FinanzasFamiliaJhonny", {
                            body: `Recordatorio: ${r.title}`,
                            icon: 'https://cdn-icons-png.flaticon.com/512/2382/2382533.png'
                        });
                    }
                    // Notificación in-app
                    setNotification(`🔔 ${r.title}`);
                    
                    // Sonido
                    try {
                        new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(() => {});
                    } catch (e) {}
                }
            });
        };

        const interval = setInterval(checkReminders, 60000); // Chequear cada minuto
        checkReminders(); // Chequeo inicial
        
        return () => clearInterval(interval);
    }, [reminders, currentUser]);

    // Notification Timeout
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 6000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // ---- Calculated Values ----
    
    const formatCurrency = (amount: number) => {
        return `$U ${new Intl.NumberFormat('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
    };

    const monthlyStats = useMemo(() => {
        const spentTotal = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        const spentMonth = expenses
            .filter(e => isThisMonth(parseISO(e.date)))
            .reduce((acc, curr) => acc + curr.amount, 0);
        
        const remaining = budget - spentMonth;
        const percentage = budget > 0 ? (spentMonth / budget) * 100 : 0;

        return { spentMonth, remaining, percentage, spentTotal };
    }, [expenses, budget]);

    const dailyStats = useMemo(() => {
        if (dailyLimit <= 0) return null;
        
        const todayStr = format(new Date(), 'yyyy-MM-dd'); // Fecha local
        const spentToday = expenses
            .filter(e => {
                // Convertir la fecha ISO (UTC) a fecha local YYYY-MM-DD para comparar correctamente
                const expenseDate = format(parseISO(e.date), 'yyyy-MM-dd');
                return expenseDate === todayStr;
            })
            .reduce((acc, e) => acc + e.amount, 0);

        const todayBalance = dailyLimit - spentToday; // Positivo = Ahorro, Negativo = Déficit

        // Cálculo acumulado del mes (Rollover)
        const dayOfMonth = new Date().getDate();
        const idealSpentByNow = dailyLimit * dayOfMonth;
        const rolloverBalance = idealSpentByNow - monthlyStats.spentMonth;

        return { spentToday, todayBalance, idealSpentByNow, rolloverBalance };
    }, [dailyLimit, expenses, monthlyStats.spentMonth]);

    // Charts Data Calculation
    const barDataDaily = useMemo(() => {
        const today = new Date();
        const start = subDays(today, 6); // Last 7 days
        const days = eachDayOfInterval({ start, end: today });
        return days.map(day => ({
            date: format(day, 'eee dd', { locale: es }),
            amount: expenses
                .filter(e => isSameDay(parseISO(e.date), day))
                .reduce((acc, curr) => acc + curr.amount, 0)
        }));
    }, [expenses]);

    const barDataWeekly = useMemo(() => {
        const today = new Date();
        const start = subWeeks(today, 3); // Last 4 weeks
        return eachWeekOfInterval({ start, end: today }, { weekStartsOn: 1 }).map(week => ({
            name: `Sem ${format(week, 'w')}`,
            total: expenses.filter(e => {
                const expenseDate = parseISO(e.date);
                return startOfWeek(expenseDate, { weekStartsOn: 1 }).getTime() === week.getTime();
            }).reduce((acc, curr) => acc + curr.amount, 0)
        }));
    }, [expenses]);

    const barDataMonthly = useMemo(() => {
        const today = new Date();
        const start = subMonths(today, 11); // Last 12 months
        return eachMonthOfInterval({ start, end: today }).map(month => ({
            name: format(month, 'MMM', { locale: es }),
            total: expenses.filter(e => format(parseISO(e.date), 'yyyy-MM') === format(month, 'yyyy-MM')).reduce((acc, curr) => acc + curr.amount, 0)
        }));
    }, [expenses]);


    // ---- Handlers ----

    const handleConnect = (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlInput || !keyInput) return;
        try {
            initSupabase(urlInput, keyInput);
            localStorage.setItem('sb_url', urlInput);
            localStorage.setItem('sb_key', keyInput);
            setIsSupabaseConnected(true);
            setNotification("Configuración guardada correctamente");
        } catch (err: any) {
            setNotification("Error de configuración: " + err.message);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAuthLoading(true);
        try {
            let result;
            if (authMode === 'login') {
                result = await supabase.auth.signInWithPassword({ email, password });
            } else {
                result = await supabase.auth.signUp({ email, password });
            }
            const { error } = result;
            if (error) {
                if (error.message.includes("Email not confirmed")) {
                    setNotification("Email no confirmado. Desactiva 'Confirm Email' en Supabase.");
                } else {
                    setNotification(error.message);
                }
            } else {
                if (authMode === 'register') {
                    setNotification("Registro exitoso. Inicia sesión.");
                    setAuthMode('login');
                }
            }
        } catch (err: any) {
            setNotification(err.message);
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleSaveBudget = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const val = parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value); 
        if (isNaN(val) || val < 0) return; // Allow 0

        const newAmount = budgetMode === 'add' ? budget + val : val;
        
        const { error } = await supabase
            .from('budgets')
            .upsert({ user_id: currentUser!.id, amount: newAmount, daily_limit: dailyLimit }, { onConflict: 'user_id' });
        
        if (error) {
            setNotification(error.message);
        } else {
            setBudget(newAmount);
            setNotification("Presupuesto Total actualizado.");
            form.reset();
        }
    };

    const handleSaveDailyLimit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const val = parseFloat((form.elements.namedItem('daily_limit') as HTMLInputElement).value);
        if (isNaN(val) || val < 0) return; // Allow 0

        const { error } = await supabase
            .from('budgets')
            .upsert({ user_id: currentUser!.id, daily_limit: val, amount: budget }, { onConflict: 'user_id' });
        
        if (error) {
            setNotification(error.message);
        } else {
            setDailyLimit(val);
            setNotification("Límite Diario actualizado.");
            form.reset();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
        // Scroll to form
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const description = formData.description;
        const amount = parseFloat(formData.amount);
        const category = formData.category;
        const dateStr = formData.date;

        if (!description || isNaN(amount)) return;

        // Crear fecha local correctamente para evitar desfase de zona horaria al guardar
        const [year, month, day] = dateStr.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        const now = new Date();
        // Si es hoy, mantenemos la hora actual, si es otro día, ponemos mediodía para evitar problemas de UTC
        if (isSameDay(localDate, now)) {
            localDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        } else {
            localDate.setHours(12, 0, 0); 
        }

        const expenseData = {
            user_id: currentUser!.id,
            description,
            amount,
            category,
            date: localDate.toISOString() // Guardar ISO
        };

        try {
            let response;
            if (editingExpense) {
                response = await supabase
                    .from('expenses')
                    .update(expenseData)
                    .eq('id', editingExpense.id)
                    .select();
            } else {
                response = await supabase
                    .from('expenses')
                    .insert([expenseData])
                    .select();
            }

            const { data, error } = response;

            if (error) throw error;
            if (!data || data.length === 0) throw new Error("No se pudo guardar. Verifica permisos (RLS) en Supabase.");

            setNotification(editingExpense ? "Gasto modificado" : "Gasto agregado");
            setEditingExpense(null);
            setFormData(INITIAL_FORM_STATE);
            fetchData(); // Reload data
        } catch (error: any) {
            setNotification(error.message || "Error al guardar");
        }
    };

    const handleDelete = async () => {
        if (expenseToDelete) {
            setDeletingId(expenseToDelete);
            try {
                const { data, error } = await supabase
                    .from('expenses')
                    .delete()
                    .eq('id', expenseToDelete)
                    .select(); // Importante: select() para confirmar el borrado

                if (error) throw error;
                if (!data || data.length === 0) {
                     // Si data viene vacío, es posible que RLS haya bloqueado o el ID no exista
                     throw new Error("Error: Supabase no permitió borrar (RLS).");
                }

                setExpenses(prev => prev.filter(e => e.id !== expenseToDelete));
                setNotification("Gasto eliminado correctamente");
            } catch (err: any) {
                setNotification(err.message || "Error al eliminar");
            } finally {
                setDeletingId(null);
                setExpenseToDelete(null); // Cerrar modal
            }
        }
    };

    const confirmDelete = (id: string) => {
        setExpenseToDelete(id);
    };

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        const report = await generateFinancialReport(
            budget,
            expenses.filter(e => isThisMonth(parseISO(e.date))),
            format(new Date(), 'MMMM', { locale: es })
        );
        setAiReport(report);
        setIsGeneratingReport(false);
    };

    // Reminder Handlers
    const handleAddReminder = async (title: string, date: Date) => {
        const { data, error } = await supabase
            .from('reminders')
            .insert([{ user_id: currentUser!.id, title, date: date.toISOString(), is_completed: false }])
            .select();
        
        if (error) {
            if (error.message.includes('does not exist')) {
                setNotification("Falta crear la tabla 'reminders' en Supabase.");
            } else {
                setNotification(error.message);
            }
        } else {
            setReminders(prev => [...prev, ...data || []]);
            setNotification("Recordatorio creado");
        }
    };

    const handleDeleteReminder = async (id: string) => {
        const { error } = await supabase.from('reminders').delete().eq('id', id);
        if (error) {
            setNotification(error.message);
        } else {
            setReminders(prev => prev.filter(r => r.id !== id));
            setNotification("Recordatorio eliminado");
        }
    };

    const handleToggleComplete = async (reminder: Reminder) => {
        const newVal = !reminder.is_completed;
        const { error } = await supabase
            .from('reminders')
            .update({ is_completed: newVal })
            .eq('id', reminder.id);

        if (error) {
            setNotification(error.message);
        } else {
            setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, is_completed: newVal } : r));
        }
    };

    // ---- RENDER ----

    if (isCheckingSession) {
        // Splash Screen
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Icons.TrendingUp />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Familia Jhonny</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Iniciando sesión segura...</p>
            </div>
        );
    }

    if (!isSupabaseConnected) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <form onSubmit={handleConnect} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 dark:border-gray-700 animate-fade-in">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">FinanzasFamiliaJhonny</h1>
                        <p className="text-gray-500 text-sm mt-2">Configura tu base de datos Supabase</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Supabase Project URL</label>
                            <input 
                                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Supabase Anon Key</label>
                            <input 
                                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                type="password"
                                value={keyInput}
                                onChange={e => setKeyInput(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <button className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg">
                        Conectar
                    </button>
                    {showInstallBtn && (
                        <button 
                            type="button"
                            onClick={handleInstallClick}
                            className="w-full mt-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Icons.Download /> Instalar Aplicación
                        </button>
                    )}
                </form>
                {notification && (
                    <div className="absolute bottom-10 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg animate-fade-in max-w-md text-center text-sm">
                        {notification}
                    </div>
                )}
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 relative">
                {/* Reset Config Button */}
                <button 
                    onClick={() => { localStorage.clear(); window.location.reload(); }}
                    className="absolute top-6 right-6 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                   <Icons.Config />
                </button>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100 dark:border-gray-700 animate-fade-in">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                            <Icons.TrendingUp />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Familia Jhonny</h1>
                        <p className="text-gray-500 text-sm mt-1">Gestión Financiera Inteligente</p>
                    </div>
                    
                    <form onSubmit={handleAuth} className="space-y-4">
                        <input 
                            type="email" 
                            placeholder="Correo electrónico" 
                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <input 
                            type="password" 
                            placeholder="Contraseña" 
                            className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <button 
                            disabled={isAuthLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 shadow-lg"
                        >
                            {isAuthLoading ? '...' : (authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse')}
                        </button>
                    </form>
                    
                    <div className="mt-6 text-center">
                        <button 
                            onClick={() => setAuthMode(prev => prev === 'login' ? 'register' : 'login')}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                            {authMode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                        </button>
                    </div>

                     {showInstallBtn && (
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <button 
                                type="button"
                                onClick={handleInstallClick}
                                className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium py-2.5 rounded-lg transition-colors text-sm"
                            >
                                <Icons.Download /> Instalar App en Móvil
                            </button>
                        </div>
                    )}
                </div>
                {notification && (
                    <div className="absolute bottom-10 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg animate-fade-in max-w-md text-center text-sm">
                        {notification}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 pb-24 sm:pb-0 font-sans relative">
            {/* Navbar */}
            <nav className="fixed top-0 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30 px-4 py-3 flex justify-between items-center shadow-sm safe-pt">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                        <Icons.TrendingUp />
                    </div>
                    <span className="font-bold text-lg text-gray-800 dark:text-white hidden sm:block">FinanzasFamiliaJhonny</span>
                    <span className="font-bold text-lg text-gray-800 dark:text-white sm:hidden">FamiliaJhonny</span>
                </div>
                
                {/* Desktop Tabs */}
                <div className="hidden sm:flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                    {Object.values(Tab).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab 
                                ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {showInstallBtn && (
                        <button 
                            onClick={handleInstallClick}
                            className="hidden md:flex p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-full"
                            title="Instalar App"
                        >
                            <Icons.Download />
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            setIsDarkMode(!isDarkMode);
                            document.documentElement.classList.toggle('dark');
                            localStorage.setItem('dark-mode', String(!isDarkMode));
                        }}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <button 
                        onClick={() => supabase.auth.signOut()}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors"
                    >
                        <span className="hidden sm:inline">Salir</span>
                        <Icons.Logout />
                    </button>
                </div>
            </nav>

            {/* Mobile Bottom Nav */}
            <div className="sm:hidden fixed bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 flex justify-around py-2 pb-safe">
                {Object.values(Tab).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex flex-col items-center p-2 text-[10px] font-medium ${
                            activeTab === tab ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                        }`}
                    >
                        <span className="text-lg mb-0.5">
                            {tab === Tab.Report && '📊'}
                            {tab === Tab.Expenses && '💸'}
                            {tab === Tab.Budget && '💰'}
                            {tab === Tab.Charts && '📈'}
                            {tab === Tab.Calendar && '📅'}
                            {tab === Tab.AI && '🤖'}
                        </span>
                        {tab}
                    </button>
                ))}
            </div>

            <main className="pt-20 px-4 max-w-6xl mx-auto animate-fade-in">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 rounded-full border-t-transparent"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === Tab.Report && (
                            <div className="space-y-6 pb-20">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Icons.TrendingUp />
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase">Presupuesto Total</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(budget)}</p>
                                        <div className="mt-4 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }}></div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase">Gastado (Mes)</p>
                                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(monthlyStats.spentMonth)}</p>
                                        <div className="mt-4 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(monthlyStats.percentage, 100)}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase">Disponible Total</p>
                                        <p className={`text-3xl font-bold mt-1 ${monthlyStats.remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {formatCurrency(monthlyStats.remaining)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-4">{monthlyStats.percentage.toFixed(1)}% del presupuesto utilizado</p>
                                    </div>
                                </div>

                                {/* Control Diario Dinámico (Rollover) */}
                                {dailyStats && (
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <Icons.Target /> Control Diario Dinámico
                                            </h3>
                                        </div>
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Sección Hoy */}
                                            <div className="space-y-2">
                                                <p className="text-xs uppercase font-bold text-gray-400 mb-2">Estado de Hoy ({format(new Date(), 'dd/MM')})</p>
                                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                                                    <span className="text-gray-600 dark:text-gray-300">Meta Diaria:</span>
                                                    <span className="font-mono text-gray-900 dark:text-white">{formatCurrency(dailyLimit)}</span>
                                                </div>
                                                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                                                    <span className="text-gray-600 dark:text-gray-300">Gastado Hoy:</span>
                                                    <span className="font-mono text-red-500">-{formatCurrency(dailyStats.spentToday)}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-1">
                                                    <span className="font-bold text-gray-800 dark:text-white">Balance Diario:</span>
                                                    <span className={`text-xl font-bold ${dailyStats.todayBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {dailyStats.todayBalance >= 0 ? '+' : ''}{formatCurrency(dailyStats.todayBalance)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-right text-gray-400 mt-1">
                                                    {dailyStats.todayBalance >= 0 ? "Superávit (Ahorro)" : "Déficit (Exceso)"}
                                                </p>
                                            </div>
                                            
                                            {/* Sección Acumulado */}
                                            <div className="md:border-l md:border-gray-100 md:dark:border-gray-700 md:pl-8 space-y-2">
                                                <p className="text-xs uppercase font-bold text-gray-400 mb-2">Acumulado Mensual</p>
                                                <div className="flex justify-between items-center pb-1">
                                                    <span className="text-gray-600 dark:text-gray-300 text-sm">Saldo a favor/contra acumulado:</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-3xl font-bold ${dailyStats.rolloverBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {dailyStats.rolloverBalance >= 0 ? '+' : ''}{formatCurrency(dailyStats.rolloverBalance)}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {dailyStats.rolloverBalance >= 0 
                                                            ? "Dinero extra disponible para gastar o ahorrar." 
                                                            : "Necesitas ahorrar en los próximos días para compensar."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* AI Report Generator */}
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border border-indigo-100 dark:border-gray-700 p-6 rounded-2xl">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <span>🧠</span> Análisis Inteligente (Familia Jhonny)
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Informe detallado de salud financiera en pesos uruguayos.</p>
                                        </div>
                                        <button 
                                            onClick={handleGenerateReport}
                                            disabled={isGeneratingReport}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isGeneratingReport ? <span className="animate-spin">↻</span> : '⚡'} Generar Informe
                                        </button>
                                    </div>
                                    
                                    {aiReport ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-indigo-100 dark:border-gray-700">
                                            <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">{aiReport}</pre>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                            Pulsa el botón para analizar las finanzas de la familia
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === Tab.Expenses && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
                                <div className="lg:col-span-1">
                                    <div ref={formRef} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 sticky top-24">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                                {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
                                            </h3>
                                            {editingExpense && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold animate-pulse">Editando...</span>
                                            )}
                                        </div>
                                        <form onSubmit={handleSaveExpense} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Descripción</label>
                                                <input
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    placeholder="Ej: Supermercado"
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Monto ($U)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        name="amount"
                                                        value={formData.amount}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        placeholder="0.00"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Categoría</label>
                                                    <select
                                                        name="category"
                                                        value={formData.category}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    >
                                                        {EXPENSE_CATEGORIES.map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Fecha</label>
                                                <input
                                                    type="date"
                                                    name="date"
                                                    value={formData.date}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                {editingExpense && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => { setEditingExpense(null); setFormData(INITIAL_FORM_STATE); }}
                                                        className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium py-2.5 rounded-lg"
                                                    >
                                                        Cancelar
                                                    </button>
                                                )}
                                                <button 
                                                    type="submit" 
                                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-md transition-all"
                                                >
                                                    {editingExpense ? 'Actualizar' : 'Agregar'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Últimos Movimientos</h3>
                                        <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{expenses.length} registros</span>
                                    </div>
                                    
                                    {expenses.length === 0 ? (
                                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                                            <p className="text-gray-400">No hay gastos registrados aún.</p>
                                        </div>
                                    ) : (
                                        expenses.map(expense => (
                                            <div key={expense.id} className="group bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex justify-between items-center shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${expense.category === 'Alimentación' ? 'bg-orange-100 text-orange-600' : expense.category === 'Transporte' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} dark:bg-gray-700 dark:text-gray-300`}>
                                                        {expense.category === 'Alimentación' ? '🍔' : expense.category === 'Transporte' ? '🚗' : expense.category === 'Vivienda' ? '🏠' : '💸'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800 dark:text-white">{expense.description}</p>
                                                        <div className="flex gap-2 text-xs text-gray-500">
                                                            <span>{format(parseISO(expense.date), 'dd MMM, yyyy', { locale: es })}</span>
                                                            <span>•</span>
                                                            <span>{expense.category}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(expense.amount)}</span>
                                                    <div className="flex gap-1 opacity-100 transition-opacity">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleEditExpense(expense)}
                                                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                                                        >
                                                            <Icons.Edit />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            disabled={deletingId === expense.id}
                                                            onClick={() => confirmDelete(expense.id)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                                                        >
                                                            {deletingId === expense.id ? (
                                                                <span className="animate-spin block w-4 h-4 border-2 border-red-500 rounded-full border-t-transparent"></span>
                                                            ) : (
                                                                <Icons.Trash />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === Tab.Budget && (
                            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20 mt-6">
                                {/* Daily Limit Card */}
                                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600">
                                            <Icons.Target />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meta de Gasto Diario</h2>
                                            <p className="text-gray-500 text-sm">¿Cuánto quieres gastar por día como máximo?</p>
                                        </div>
                                    </div>
                                    <form onSubmit={handleSaveDailyLimit} className="flex gap-4 items-end">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Límite Diario Actual: {formatCurrency(dailyLimit)}</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 sm:text-sm font-bold">$U</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    name="daily_limit"
                                                    step="1"
                                                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                                                    placeholder="Ej: 500"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all">
                                            Guardar Meta
                                        </button>
                                    </form>
                                </div>

                                {/* Monthly Budget Card */}
                                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="text-center mb-8">
                                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                            <span className="text-3xl">💰</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Presupuesto Mensual Total</h2>
                                        <p className="text-gray-500 mt-2">Total disponible: <strong className="text-indigo-600">{formatCurrency(budget)}</strong></p>
                                    </div>
                                    
                                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
                                        <button 
                                            onClick={() => setBudgetMode('set')}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${budgetMode === 'set' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                        >
                                            Definir Total
                                        </button>
                                        <button 
                                            onClick={() => setBudgetMode('add')}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${budgetMode === 'add' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                        >
                                            Agregar Fondos
                                        </button>
                                    </div>

                                    <form onSubmit={handleSaveBudget} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {budgetMode === 'set' ? 'Nuevo presupuesto total mensual' : 'Monto a agregar'}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 sm:text-sm font-bold">$U</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    step="0.01"
                                                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-lg"
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                                            {budgetMode === 'set' ? 'Guardar Nuevo Presupuesto' : 'Sumar al Presupuesto'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === Tab.Charts && (
                            <Charts 
                                expenses={expenses} // Pass full expenses list
                                barDataDaily={barDataDaily}
                                barDataWeekly={barDataWeekly}
                                barDataMonthly={barDataMonthly}
                                isDarkMode={isDarkMode} 
                            />
                        )}

                        {activeTab === Tab.Calendar && (
                            <CalendarView 
                                reminders={reminders}
                                onAddReminder={handleAddReminder}
                                onDeleteReminder={handleDeleteReminder}
                                onToggleComplete={handleToggleComplete}
                            />
                        )}

                        {activeTab === Tab.AI && (
                            <AiAdvisor budget={budget} dailyLimit={dailyLimit} expenses={expenses} />
                        )}
                    </>
                )}
            </main>
            
            <Calculator />
            
            {/* Modal Confirmar Eliminación */}
            {expenseToDelete && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-700 transform scale-100 transition-all">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 mb-4">
                                <Icons.Trash />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">¿Eliminar gasto?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Esta acción no se puede deshacer. El gasto se borrará permanentemente de tu historial.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setExpenseToDelete(null)}
                                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-md transition-colors flex items-center justify-center gap-2"
                                >
                                    {deletingId ? (
                                        <span className="animate-spin w-4 h-4 border-2 border-white rounded-full border-t-transparent"></span>
                                    ) : (
                                        'Sí, Eliminar'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {notification && (
                <div className="fixed bottom-20 sm:bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-fade-in flex items-center gap-3 max-w-xs sm:max-w-md text-center sm:text-left">
                    <span>{notification}</span>
                    <button onClick={() => setNotification(null)} className="bg-white/20 rounded-full p-0.5 hover:bg-white/40">×</button>
                </div>
            )}
        </div>
    );
};

export default App;
