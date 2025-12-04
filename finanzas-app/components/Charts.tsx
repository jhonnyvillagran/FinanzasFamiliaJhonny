
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';
import { Expense } from '../types';
import parseISO from 'date-fns/parseISO';
import isSameDay from 'date-fns/isSameDay';
import isSameWeek from 'date-fns/isSameWeek';
import isSameMonth from 'date-fns/isSameMonth';
import isSameYear from 'date-fns/isSameYear';

const COLORS = ['#4f46e5', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#14b8a6', '#f97316'];

interface ChartProps {
    expenses: Expense[]; // Recibimos todos los gastos para filtrar internamente
    barDataDaily: { date: string; amount: number }[];
    barDataWeekly: { name: string; total: number }[];
    barDataMonthly: { name: string; total: number }[];
    isDarkMode: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50">
                <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">{label || payload[0].name}</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-mono">
                    {`$U ${payload[0].value.toFixed(2)}`}
                </p>
                {/* Si es gráfico de torta, payload[0].name ya es la categoría */}
            </div>
        );
    }
    return null;
};

const TabButton = ({ label, period, activePeriod, onClick }: { label: string, period: string, activePeriod: string, onClick: (p: any) => void }) => (
    <button
        onClick={() => onClick(period)}
        className={`flex-1 py-2 px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
            activePeriod === period
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
    >
        {label}
    </button>
);

export const Charts: React.FC<ChartProps> = ({ expenses, barDataDaily, barDataWeekly, barDataMonthly, isDarkMode }) => {
    // Estado para el gráfico de Barras (Evolución)
    const [barPeriod, setBarPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    
    // Estado para el gráfico de Torta (Categorías)
    const [piePeriod, setPiePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

    // Datos para el gráfico de Barras
    const activeBarData = {
        daily: barDataDaily,
        weekly: barDataWeekly,
        monthly: barDataMonthly
    }[barPeriod];

    // Lógica de filtrado para el gráfico de Torta
    const pieCategoryData = useMemo(() => {
        const today = new Date();
        let filteredExpenses: Expense[] = [];

        if (piePeriod === 'daily') {
            filteredExpenses = expenses.filter(e => isSameDay(parseISO(e.date), today));
        } else if (piePeriod === 'weekly') {
            filteredExpenses = expenses.filter(e => isSameWeek(parseISO(e.date), today, { weekStartsOn: 1 }));
        } else if (piePeriod === 'monthly') {
            filteredExpenses = expenses.filter(e => isSameMonth(parseISO(e.date), today));
        } else if (piePeriod === 'yearly') {
            filteredExpenses = expenses.filter(e => isSameYear(parseISO(e.date), today));
        }

        const map: Record<string, number> = {};
        filteredExpenses.forEach(e => {
            const cat = e.category || 'General';
            map[cat] = (map[cat] || 0) + e.amount;
        });

        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Ordenar de mayor a menor
    }, [expenses, piePeriod]);

    const strokeColor = isDarkMode ? '#9ca3af' : '#6b7280';

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* GRÁFICO 1: Categorías (Donut) */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
                            Gastos por Categoría
                        </h3>
                        {/* Botonera para el gráfico de Torta */}
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-full sm:w-auto overflow-x-auto">
                            <TabButton label="Día" period="daily" activePeriod={piePeriod} onClick={setPiePeriod} />
                            <TabButton label="Sem" period="weekly" activePeriod={piePeriod} onClick={setPiePeriod} />
                            <TabButton label="Mes" period="monthly" activePeriod={piePeriod} onClick={setPiePeriod} />
                            <TabButton label="Año" period="yearly" activePeriod={piePeriod} onClick={setPiePeriod} />
                        </div>
                    </div>

                    <div className="h-72 flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieCategoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieCategoryData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={COLORS[index % COLORS.length]} 
                                            stroke={isDarkMode ? '#1f2937' : '#fff'} 
                                            strokeWidth={2}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    formatter={(value) => <span className="text-gray-600 dark:text-gray-300 text-xs ml-1">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {pieCategoryData.length === 0 && (
                        <p className="text-center text-gray-400 text-sm mt-2">No hay gastos en este periodo.</p>
                    )}
                </div>

                {/* GRÁFICO 2: Evolución (Barras) - Se mantiene igual pero en el nuevo layout */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Evolución de Gastos
                        </h3>
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-full sm:w-auto">
                            <TabButton label="Días" period="daily" activePeriod={barPeriod} onClick={setBarPeriod} />
                            <TabButton label="Sem" period="weekly" activePeriod={barPeriod} onClick={setBarPeriod} />
                            <TabButton label="Mes" period="monthly" activePeriod={barPeriod} onClick={setBarPeriod} />
                        </div>
                    </div>

                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={activeBarData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                                <XAxis 
                                    dataKey={barPeriod === 'daily' ? 'date' : 'name'} 
                                    stroke={strokeColor} 
                                    tick={{ fontSize: 12 }} 
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    stroke={strokeColor} 
                                    tick={{ fontSize: 12 }} 
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip 
                                    content={<CustomTooltip />}
                                    cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                />
                                <Bar 
                                    dataKey={barPeriod === 'daily' ? 'amount' : 'total'} 
                                    fill="#6366f1" 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={barPeriod === 'monthly' ? 40 : 20}
                                    animationDuration={1000}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
