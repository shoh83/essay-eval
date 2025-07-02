'use client';

import { useState, useRef, useEffect } from 'react';
// import { parseEvaluation, parseRationaleMarkdown } from '../utils/parse';
import {
  evaluationPrompt,
  revisionPrompt,
  feedbackPrompt,
} from '../utils/prompts';
import { useDiffLoader } from '../hooks/useDiffLoader';
// import { ScoreCircle } from '../components/ScoreCircle';
// import { ScoreBar } from '../components/ScoreBar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

async function askServer(prompt: string, reset = false): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, reset }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data.text;
}

  


export default function EnglishEvaluatorPage() {
  // --- State Management ---
  const [task, setTask] = useState('');
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<string>('');
  const [revisedAnswer, setRevisedAnswer] = useState('');
  const [feedbackMd, setFeedbackMd] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDiff, setShowDiff] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const diffHtml = useDiffLoader(answer, revisedAnswer, showDiff);

  const saveEvaluation = async () => {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task,
        answer,
        evaluation,
        revisedAnswer,
        feedback: feedbackMd,
      }),
    });
  };

  // Scroll into view when results or error appear
  useEffect(() => {
    if (evaluation || error) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [evaluation, error]);

  // --- Main Handler ---
  const handleSubmit = async () => {
    if (!task.trim() || !answer.trim()) {
      setError('Please provide both the task and your answer.');
      return;
    }

    setIsLoading(true);
    setError('');
    setEvaluation('');
    setRevisedAnswer('');
    setFeedbackMd('');
    setShowDiff(false);


    try {
      // 1) Evaluation, with reset=true so server clears history
      const evalText = await askServer(evaluationPrompt(task, answer), true);
      setEvaluation(evalText.trim());
      // console.log('Client evalText:', evalText);

      // 2) Revision
      const revText = await askServer(revisionPrompt(task, answer, evalText));
      setRevisedAnswer(revText.trim());

      // 3) Feedback
      const feedbackText = await askServer(feedbackPrompt(task, answer, evalText));
      // console.log('feedbackText:', feedbackText);
      setFeedbackMd(feedbackText.trim());
      // console.log("raw feedbackMd:", JSON.stringify(feedbackMd));
      await saveEvaluation();
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
      else setError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

    
  // --- Render ---
  return (
    <main className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold">Essay 평가 및 첨삭</h1>
          <p className="mt-2 text-lg text-gray-600">
            Essay에 대한 평가와 첨삭을 5분 내에 받아보세요
          </p>
        </header>

        {/* Input Section */}
        <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="space-y-6">
            <div>
              <label htmlFor="task" className="block text-lg font-medium mb-1">
                주제
              </label>
              <textarea
                id="task"
                rows={4}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Essay 주제를 여기에 입력해주세요."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="answer" className="block text-lg font-medium mb-1">
                Essay
              </label>
              <textarea
                id="answer"
                rows={20}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="작성한 Essay를 여기에 입력해주세요."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-6 w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? '평가 및 첨삭 진행 중…' : '평가 및 첨삭 시작'}
          </button>
        </section>

        {/* Results */}
        <div ref={resultsRef} className="mt-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          )}

          {evaluation && (
            <>
              {/* Numeric UI as before */}
              <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold mb-4">Evaluation</h2>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
  remarkPlugins={[remarkBreaks, remarkGfm]}
  components={{
    p(props) {
      return <p className="mb-4" {...props} />;
    },
    table(props) {
      return (
        <table
          className="w-full table-auto border-separate border-spacing-2 border border-gray-200"
          {...props}
        />
      );
    },
    th(props) {
      return (
        <th className="border border-gray-200 p-3" {...props} />
      );
    },
    td(props) {
      return (
        <td className="border border-gray-200 p-3" {...props} />
      );
    },
  }}
>
  {evaluation}
</ReactMarkdown>
                </div>                
              </section>
            </>
          )}
          

          {revisedAnswer && (
            <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">첨삭</h2>
                <button
                  onClick={() => setShowDiff((prev) => !prev)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200"
                >
                  {showDiff ? '수정 사항 숨기기' : '수정 사항 표시'}
                </button>
              </div>
              {showDiff ? (
                <div
                  className="diff-container whitespace-pre-wrap text-left text-base"
                  dangerouslySetInnerHTML={{ __html: diffHtml }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-base">{revisedAnswer}</pre>
              )}
            </section>
          )}

          {feedbackMd && (
            <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold mb-4">Feedback</h2>
              <div className="prose prose-sm max-w-none">
           <ReactMarkdown
  remarkPlugins={[remarkBreaks, remarkGfm]}
  components={{
    p(props) {
      return <p className="mb-4" {...props} />;
    },
    /* your table/th/td custom renderers here… */
  }}
>
  {feedbackMd}
</ReactMarkdown>
         </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
