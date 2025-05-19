'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Emotion = 'happy' | 'neutral' | 'sad' | 'excited';
type Mode = 'basic' | 'scientific';

interface CalculatorState {
  display: string;
  previousValue: string;
  operation: string | null;
  emotion: Emotion;
  mode: Mode;
  memory: number;
  angleUnit: 'DEG' | 'RAD';
}

const MAX_DIGITS = 16;

export default function Calculator() {
  const [state, setState] = useState<CalculatorState>({
    display: '0',
    previousValue: '',
    operation: null,
    emotion: 'neutral',
    mode: 'basic',
    memory: 0,
    angleUnit: 'DEG'
  });

  const formatNumber = useCallback((num: string): string => {
    const parts = num.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
  }, []);

  const unformatNumber = useCallback((num: string): string => {
    return num.replace(/,/g, '');
  }, []);

  const getEmotion = useCallback((result: number): Emotion => {
    if (result > 1000) return 'excited';
    if (result > 100) return 'happy';
    if (result < 0) return 'sad';
    return 'neutral';
  }, []);

  const getEmotionEmoji = useCallback((emotion: Emotion): string => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'excited': return '🎉';
      case 'sad': return '😢';
      default: return '😐';
    }
  }, []);

  const handleNumber = useCallback((num: string) => {
    setState(prev => {
      const currentNum = unformatNumber(prev.display);
      if (currentNum.length >= MAX_DIGITS) return prev;

      const newDisplay = prev.display === '0' ? num : currentNum + num;
      return {
        ...prev,
        display: formatNumber(newDisplay),
        emotion: 'neutral'
      };
    });
  }, [formatNumber, unformatNumber]);

  const handleOperation = useCallback((op: string) => {
    setState(prev => ({
      ...prev,
      previousValue: prev.display,
      operation: op,
      display: '0',
      emotion: 'neutral'
    }));
  }, []);

  const calculate = useCallback(() => {
    setState(prev => {
      const display = prev.display;
      const previousValue = prev.previousValue;
      const operation = prev.operation;
      const prevNum = parseFloat(unformatNumber(previousValue));
      const currentNum = parseFloat(unformatNumber(display));
      let result = 0;

      switch (operation) {
        case '+': result = prevNum + currentNum; break;
        case '-': result = prevNum - currentNum; break;
        case '×': result = prevNum * currentNum; break;
        case '÷': result = prevNum / currentNum; break;
        default: return prev;
      }

      const resultString = result.toString();
      if (resultString.length > MAX_DIGITS) {
        result = parseFloat(result.toExponential(8));
      }

      return {
        ...prev,
        display: formatNumber(result.toString()),
        previousValue: '',
        operation: null,
        emotion: getEmotion(result)
      };
    });
  }, [formatNumber, unformatNumber, getEmotion]);

  const handlePercent = useCallback(() => {
    setState(prev => {
      const currentNum = parseFloat(unformatNumber(prev.display));
      if (prev.previousValue && prev.operation) {
        const base = parseFloat(unformatNumber(prev.previousValue));
        const percentValue = (base * currentNum) / 100;
        return {
          ...prev,
          display: formatNumber(percentValue.toString()),
        };
      } else {
        const percentValue = currentNum / 100;
        return {
          ...prev,
          display: formatNumber(percentValue.toString()),
        };
      }
    });
  }, [formatNumber, unformatNumber]);

  const clear = useCallback(() => {
    setState(prev => ({
      ...prev,
      display: '0',
      previousValue: '',
      operation: null,
      emotion: 'neutral'
    }));
  }, []);

  const toRadians = useCallback((degrees: number): number => {
    return degrees * (Math.PI / 180);
  }, []);

  const handleScientific = useCallback((func: string) => {
    setState(prev => {
      const currentNum = parseFloat(unformatNumber(prev.display));
      let result: number;

      switch (func) {
        case 'sin':
          result = state.angleUnit === 'DEG' ?
            Math.sin(toRadians(currentNum)) :
            Math.sin(currentNum);
          break;
        case 'cos':
          result = state.angleUnit === 'DEG' ?
            Math.cos(toRadians(currentNum)) :
            Math.cos(currentNum);
          break;
        case 'tan':
          result = state.angleUnit === 'DEG' ?
            Math.tan(toRadians(currentNum)) :
            Math.tan(currentNum);
          break;
        case 'sqrt':
          result = Math.sqrt(currentNum);
          break;
        case 'square':
          result = Math.pow(currentNum, 2);
          break;
        case 'cube':
          result = Math.pow(currentNum, 3);
          break;
        case 'log':
          result = Math.log10(currentNum);
          break;
        case 'ln':
          result = Math.log(currentNum);
          break;
        case '!':
          result = factorial(currentNum);
          break;
        case 'inv':
          result = 1 / currentNum;
          break;
        case 'exp':
          result = Math.exp(currentNum);
          break;
        case 'pi':
          result = Math.PI;
          break;
        case 'e':
          result = Math.E;
          break;
        default:
          return prev;
      }

      if (isNaN(result) || !isFinite(result)) {
        return {
          ...prev,
          display: 'Error',
          emotion: 'sad'
        };
      }

      return {
        ...prev,
        display: formatNumber(result.toString()),
        emotion: getEmotion(result)
      };
    });
  }, [state.angleUnit, toRadians, unformatNumber, formatNumber, getEmotion]);

  const toggleMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: prev.mode === 'basic' ? 'scientific' : 'basic'
    }));
  }, []);

  const toggleAngleUnit = useCallback(() => {
    setState(prev => ({
      ...prev,
      angleUnit: prev.angleUnit === 'DEG' ? 'RAD' : 'DEG'
    }));
  }, []);

  const factorial = useCallback((n: number): number => {
    if (n < 0) return NaN;
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const { key } = e;
      if (/^[0-9]$/.test(key)) {
        handleNumber(key);
      } else if (key === '.') {
        setState(prev => {
          const currentNum = unformatNumber(prev.display);
          if (currentNum.includes('.')) return prev;
          return { ...prev, display: formatNumber(currentNum + '.') };
        });
      } else if (key === '+' || key === '-') {
        handleOperation(key);
      } else if (key === '*' || key === 'x' || key === 'X') {
        handleOperation('×');
      } else if (key === '/' || key === '÷') {
        handleOperation('÷');
      } else if (key === 'Enter' || key === '=') {
        calculate();
      } else if (key === 'Backspace') {
        setState(prev => {
          const currentNum = unformatNumber(prev.display);
          const newDisplay = currentNum.slice(0, -1) || '0';
          return { ...prev, display: formatNumber(newDisplay) };
        });
      } else if (key === '%') {
        handlePercent();
      } else if (key === 'c' || key === 'C') {
        clear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumber, handleOperation, calculate, handlePercent, clear, formatNumber, unformatNumber]);

  const scientificButtons = [
    { label: 'sin', onClick: () => handleScientific('sin'), className: 'bg-blue-600' },
    { label: 'cos', onClick: () => handleScientific('cos'), className: 'bg-blue-600' },
    { label: 'tan', onClick: () => handleScientific('tan'), className: 'bg-blue-600' },
    { label: state.angleUnit, onClick: toggleAngleUnit, className: 'bg-blue-700' },
    { label: '√', onClick: () => handleScientific('sqrt'), className: 'bg-blue-600' },
    { label: 'x²', onClick: () => handleScientific('square'), className: 'bg-blue-600' },
    { label: 'x³', onClick: () => handleScientific('cube'), className: 'bg-blue-600' },
    { label: 'log', onClick: () => handleScientific('log'), className: 'bg-blue-600' },
    { label: 'ln', onClick: () => handleScientific('ln'), className: 'bg-blue-600' },
    { label: 'n!', onClick: () => handleScientific('!'), className: 'bg-blue-600' },
    { label: '1/x', onClick: () => handleScientific('inv'), className: 'bg-blue-600' },
    { label: 'eˣ', onClick: () => handleScientific('exp'), className: 'bg-blue-600' },
    { label: 'π', onClick: () => handleScientific('pi'), className: 'bg-blue-600' },
    { label: 'e', onClick: () => handleScientific('e'), className: 'bg-blue-600' },
  ];

  const buttons = [
    { label: 'C', onClick: clear, className: 'bg-red-500' },
    {
      label: '←', onClick: () => setState(prev => {
        const currentNum = unformatNumber(prev.display);
        const newDisplay = currentNum.slice(0, -1) || '0';
        return { ...prev, display: formatNumber(newDisplay) };
      }), className: 'bg-gray-500'
    },
    { label: '%', onClick: handlePercent, className: 'bg-gray-500' },
    { label: '÷', onClick: () => handleOperation('÷'), className: 'bg-orange-500' },
    { label: '7', onClick: () => handleNumber('7'), className: 'bg-gray-700' },
    { label: '8', onClick: () => handleNumber('8'), className: 'bg-gray-700' },
    { label: '9', onClick: () => handleNumber('9'), className: 'bg-gray-700' },
    { label: '×', onClick: () => handleOperation('×'), className: 'bg-orange-500' },
    { label: '4', onClick: () => handleNumber('4'), className: 'bg-gray-700' },
    { label: '5', onClick: () => handleNumber('5'), className: 'bg-gray-700' },
    { label: '6', onClick: () => handleNumber('6'), className: 'bg-gray-700' },
    { label: '-', onClick: () => handleOperation('-'), className: 'bg-orange-500' },
    { label: '1', onClick: () => handleNumber('1'), className: 'bg-gray-700' },
    { label: '2', onClick: () => handleNumber('2'), className: 'bg-gray-700' },
    { label: '3', onClick: () => handleNumber('3'), className: 'bg-gray-700' },
    { label: '+', onClick: () => handleOperation('+'), className: 'bg-orange-500' },
    { label: '0', onClick: () => handleNumber('0'), className: 'bg-gray-700 col-span-2' },
    {
      label: '.', onClick: () => setState(prev => {
        const currentNum = unformatNumber(prev.display);
        if (currentNum.includes('.')) return prev;
        return { ...prev, display: formatNumber(currentNum + '.') };
      }), className: 'bg-gray-700'
    },
    { label: '=', onClick: calculate, className: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-6 shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={toggleMode}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            {state.mode === 'basic' ? '공학용 모드' : '기본 모드'}
          </button>
          <div className="mb-4 p-3 rounded-lg bg-gray-700 text-white text-sm flex flex-col gap-1">
            <span className="font-semibold mb-1">이모지 변화 기준</span>
            <span>🎉 1000 이상</span>
            <span>😊 100 이상</span>
            <span>😢 0 미만</span>
            <span>😐 그 외</span>
          </div>
        </div>
        <div className="mb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.emotion}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-4xl text-center mb-2"
            >
              {getEmotionEmoji(state.emotion)}
            </motion.div>
          </AnimatePresence>
          <div className="text-right text-4xl text-white font-light mb-2">
            {state.previousValue && (
              <span className="text-gray-500 text-xl truncate block">
                {state.previousValue} {state.operation}
              </span>
            )}
          </div>
          <div className="text-right text-6xl text-white font-light overflow-hidden">
            <span className="block truncate" style={{ fontSize: state.display.length > 10 ? `${60 - (state.display.length - 10) * 2}px` : '60px' }}>
              {state.display}
            </span>
          </div>
        </div>
        {state.mode === 'scientific' && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {scientificButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                className={`${button.className} text-white text-sm font-light p-3 rounded-full hover:opacity-80 transition-opacity`}
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className={`${button.className} text-white text-2xl font-light p-4 rounded-full hover:opacity-80 transition-opacity`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 