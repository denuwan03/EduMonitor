import React, { useEffect, useState } from 'react';
import { fetchSubmissionAnalytics } from '../../services/submissionService';
import ProgressBar from './ProgressBar';
import CircularProgress from './CircularProgress';
import BarChartComponent from './BarChartComponent';
import PieChartComponent from './PieChartComponent';

const SubmissionDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const analytics = await fetchSubmissionAnalytics();
        setData(analytics);
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-violet-500" />
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-6 mb-8">
      {/* Top Row: Readiness & Task Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-slate-800 mb-6 w-full">Submission Readiness</h3>
          <CircularProgress 
            value={data.overallReadiness} 
            label={`You are ${data.overallReadiness}% ready to submit`}
          />
          <p className="mt-4 text-xs text-slate-500 text-center">
            Based on completed tasks and reviews
          </p>
        </div>

        {/* Task Completion Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Task Completion Status</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {data.taskCompletion.map((task, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{task.taskName}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.status === 'Reviewed' ? 'bg-emerald-100 text-emerald-700' : 
                    task.status === 'Submitted' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <ProgressBar 
                  value={task.completion} 
                  label={task.project} 
                  color={task.status === 'Reviewed' ? 'bg-emerald-500' : 'bg-violet-600'}
                />
              </div>
            ))}
            {data.taskCompletion.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No tasks assigned yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Productivity & On-time % */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Trends */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800">Productivity Trends</h3>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Avg Time Spent</p>
              <p className="text-lg font-bold text-violet-600">{data.avgSubmissionTime}m</p>
            </div>
          </div>
          <BarChartComponent data={data.productivityTrends} nameKey="date" dataKey="edits" />
          <p className="mt-2 text-[10px] text-slate-400 text-center">
            Number of edits per submission session over time
          </p>
        </div>

        {/* Late vs On-time */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Submission Punctuality</h3>
          <PieChartComponent data={data.lateVsOnTime} />
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            {data.lateVsOnTime.map((item, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-slate-50">
                <p className="text-[10px] text-slate-500 font-bold uppercase">{item.name}</p>
                <p className={`text-lg font-bold ${item.name === 'Late' ? 'text-amber-500' : 'text-violet-600'}`}>
                  {item.value}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDashboard;
