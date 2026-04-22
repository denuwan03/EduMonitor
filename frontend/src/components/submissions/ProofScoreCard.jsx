import React, { useEffect, useState } from 'react';
import { fetchProofScore } from '../../services/submissionService';
import ProgressBar from './ProgressBar';
import PieChartComponent from './PieChartComponent';

const ProofScoreCard = ({ submissionId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!submissionId) return;
    
    const loadProofScore = async () => {
      setLoading(true);
      try {
        const result = await fetchProofScore(submissionId);
        setData(result);
      } catch (error) {
        console.error("Failed to load proof score", error);
      } finally {
        setLoading(false);
      }
    };
    loadProofScore();
  }, [submissionId]);

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
    </div>
  );

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Submission Integrity: Proof Score</h3>
        <span className="text-xs font-bold text-slate-400">AI-DRIVEN VERIFICATION</span>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Pie Chart Breakdown */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Score Weightage</p>
            <div className="h-48">
               <PieChartComponent data={data.breakdown} />
            </div>
          </div>

          {/* Details & Final Score */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Time Spent</span>
                <span className="font-bold text-slate-800">{data.details.timeSpent} mins</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Edits Made</span>
                <span className="font-bold text-slate-800">{data.details.edits} sessions</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Consistency Score</span>
                <span className="font-bold text-slate-800">{data.details.consistency}%</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <ProgressBar 
                value={data.finalScore} 
                label="Overall Proof Score" 
                color={data.finalScore > 80 ? "bg-emerald-500" : data.finalScore > 60 ? "bg-violet-600" : "bg-amber-500"}
                secondaryLabel={`${data.finalScore}% / 100`}
              />
              <p className="mt-3 text-[10px] text-slate-400">
                A higher score indicates a more consistent and well-paced submission process.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProofScoreCard;
