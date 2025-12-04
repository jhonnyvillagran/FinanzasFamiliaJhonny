
import React, { useState, useEffect, useCallback } from 'react';

export const Calculator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expression, setExpression] = useState(''); // La ecuación completa
  const [display, setDisplay] = useState('0');      // El número que se ve en grande
  const [memory, setMemory] = useState<number>(0);
  const [lastWasResult, setLastWasResult] = useState(false);

  // Manejo de teclado físico
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    const key = e.key;
    if (/[0-9.]/.test(key)) inputDigit(key);
    if (['+', '-', '*', '/'].includes(key)) performOperation(key);
    if (key === 'Enter' || key === '=') calculate();
    if (key === 'Backspace') backspace();
    if (key === 'Escape') clearAll();
    if (key === '(' || key === ')') inputDigit(key);
    if (key === '%') inputPercent();
  }, [isOpen, expression, display]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lógica de entrada de números
  const inputDigit = (digit: string) => {
    if (lastWasResult) {
      setExpression(digit);
      setDisplay(digit);
      setLastWasResult(false);
    } else {
      const newExpr = expression + digit;
      setExpression(newExpr);
      // Lógica simple para mostrar el número actual que se está escribiendo
      const parts = newExpr.split(/([+\-*/()^])/); 
      setDisplay(parts[parts.length - 1] || digit);
    }
  };

  // Operadores básicos
  const performOperation = (op: string) => {
    if (lastWasResult) {
      setExpression(display + op);
      setLastWasResult(false);
    } else {
      setExpression(prev => prev + op);
    }
  };

  // Funciones especiales
  const inputPercent = () => {
    try {
      const val = parseFloat(display);
      const newVal = val / 100;
      // Reemplazar el último número en la expresión con su porcentaje
      const newExpr = expression.slice(0, -display.length) + newVal;
      setExpression(newExpr);
      setDisplay(String(newVal));
    } catch {
      setDisplay('Error');
    }
  };

  const inputSqrt = () => {
    try {
        // Evaluar lo que hay hasta ahora para sacar la raíz del resultado o del número actual
        let valToSqrt: number;
        if (lastWasResult || !expression) {
            valToSqrt = parseFloat(display);
        } else {
             // Intentar parsear el último número
             const parts = expression.split(/([+\-*/()^])/);
             valToSqrt = parseFloat(parts[parts.length - 1]);
        }

        if (isNaN(valToSqrt)) return;
        if (valToSqrt < 0) {
            setDisplay('Error');
            return;
        }

        const res = Math.sqrt(valToSqrt);
        // Reemplazar en la expresión
        if(lastWasResult) {
            setExpression(String(res));
            setDisplay(String(res));
        } else {
            const newExpr = expression.slice(0, -String(valToSqrt).length) + res;
            setExpression(newExpr);
            setDisplay(String(res));
        }
    } catch {
        setDisplay('Error');
    }
  };

  const backspace = () => {
    if (lastWasResult) {
        clearAll();
        return;
    }
    if (expression.length > 0) {
      const newExpr = expression.slice(0, -1);
      setExpression(newExpr);
      if (newExpr.length === 0) {
        setDisplay('0');
      } else {
        const parts = newExpr.split(/([+\-*/()^])/);
        setDisplay(parts[parts.length - 1] || '0');
      }
    }
  };

  const clearAll = () => {
    setExpression('');
    setDisplay('0');
    setLastWasResult(false);
  };

  const calculate = () => {
    try {
      // Reemplazar operadores visuales por JS
      let evalExpr = expression.replace(/\^/g, '**').replace(/x/g, '*');
      
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + evalExpr)();
      
      if (!isFinite(result) || isNaN(result)) {
        setDisplay('Error');
        setExpression('');
      } else {
        // Formatear decimales si es necesario
        const formatted = String(Math.round(result * 100000000) / 100000000);
        setDisplay(formatted);
        setExpression(formatted);
        setLastWasResult(true);
      }
    } catch (e) {
      setDisplay('Error');
    }
  };

  // Funciones de Memoria
  const memoryClear = () => setMemory(0);
  const memoryRecall = () => {
    if (lastWasResult) {
        setExpression(String(memory));
        setDisplay(String(memory));
        setLastWasResult(false);
    } else {
        setExpression(prev => prev + memory);
        setDisplay(String(memory));
    }
  };
  const memoryAdd = () => {
    try {
        const val = parseFloat(display);
        setMemory(prev => prev + val);
    } catch {}
  };
  const memorySub = () => {
     try {
        const val = parseFloat(display);
        setMemory(prev => prev - val);
    } catch {}
  };

  return (
    <div className="fixed bottom-24 right-5 z-40 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-72 animate-fade-in overflow-hidden flex flex-col gap-3">
          
          {/* Pantalla */}
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl text-right shadow-inner flex flex-col justify-end h-24">
            <div className="text-gray-500 dark:text-gray-400 text-xs h-5 overflow-hidden text-ellipsis whitespace-nowrap">
              {expression || ''}
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white overflow-hidden text-ellipsis whitespace-nowrap font-mono">
              {display}
            </div>
          </div>

          {/* Botones de Memoria */}
          <div className="flex justify-between gap-1 mb-1">
             <button onClick={memoryClear} className="text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 p-1">MC</button>
             <button onClick={memoryRecall} className="text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 p-1">MR</button>
             <button onClick={memoryAdd} className="text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 p-1">M+</button>
             <button onClick={memorySub} className="text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 p-1">M-</button>
             <div className="text-[10px] text-indigo-500 font-mono self-center px-1">{memory !== 0 ? 'M' : ''}</div>
          </div>

          {/* Grid Principal */}
          <div className="grid grid-cols-4 gap-2">
            {/* Fila Científica / Limpieza */}
            <button onClick={clearAll} className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition">AC</button>
            <button onClick={backspace} className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-bold hover:brightness-110 transition">⌫</button>
            <button onClick={inputPercent} className="p-3 bg-gray-200 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold hover:brightness-110 transition">%</button>
            <button onClick={() => performOperation('/')} className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold hover:bg-indigo-200 transition">÷</button>

            {/* Fila 2 */}
            <button onClick={() => performOperation('^')} className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-bold text-sm hover:brightness-110 transition">xʸ</button>
            <button onClick={inputSqrt} className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-bold text-sm hover:brightness-110 transition">√</button>
            <button onClick={() => inputDigit('(')} className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-bold text-sm hover:brightness-110 transition">(</button>
            <button onClick={() => inputDigit(')')} className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-bold text-sm hover:brightness-110 transition">)</button>

            {/* Números y Operadores */}
            <button onClick={() => inputDigit('7')} className="p-3 bg-white dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition">7</button>
            <button onClick={() => inputDigit('8')} className="p-3 bg-white dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition">8</button>
            <button onClick={() => inputDigit('9')} className="p-3 bg-white dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition">9</button>
            <button onClick={() => performOperation('*')} className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold hover:bg-indigo-200 transition">×</button>

            <button onClick={() => inputDigit('4')} className="p-3 bg-white dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition">4</button>
            <button onClick={() => inputDigit('5')} className="p-3 bg-white dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition">5</button>
            <button onClick={() => inputDigit('6')} className="p-3 bg-white dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition">6</button>
            <button onClick={() => performOperation('-')} className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold hover:bg-indigo-200 transition">-</button>

            <button onClick={() => inputDigit('1')} className="p-3 bg-white dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition">1</button>
            <button onClick={() => inputDigit('2')} className="p-3 bg-white dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition">2</button>
            <button onClick={() => inputDigit('3')} className="p-3 bg-white dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition">3</button>
            <button onClick={() => performOperation('+')} className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold hover:bg-indigo-200 transition">+</button>

            <button onClick={() => inputDigit('0')} className="col-span-2 p-3 bg-white dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition">0</button>
            <button onClick={() => inputDigit('.')} className="p-3 bg-white dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 transition">.</button>
            <button onClick={calculate} className="p-3 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 transition">=</button>
          </div>
        </div>
      )}
      
      {/* Botón Flotante (Toggle) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center"
        title="Calculadora"
      >
        {isOpen ? (
           <span className="text-xl font-bold">×</span>
        ) : (
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
        )}
      </button>
    </div>
  );
};
