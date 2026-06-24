import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { debates } from "../api/api";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Scale, 
  Trophy, 
  Gavel, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Quote
} from "lucide-react";

export default function DebateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [debate, setDebate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDebate = async () => {
      try {
        const data = await debates.getDebate(id);
        setDebate(data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to retrieve case file");
        console.error("Error fetching debate:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDebate();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-neutral-800 border-t-amber-600 rounded-full animate-spin"></div>
          <p className="text-amber-500/80 font-serif tracking-widest text-sm uppercase">Retrieving Evidence...</p>
        </div>
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-gray-100">
        <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-neutral-800">
           <FileText className="text-neutral-600" size={32} />
        </div>
        <h2 className="text-2xl font-serif text-white mb-2">Case Not Found</h2>
        <p className="text-neutral-500 mb-8">The requested record does not exist in the archives.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-amber-500 hover:text-amber-400 flex items-center gap-2 font-medium tracking-wide uppercase text-sm"
        >
          <ArrowLeft size={16} /> Return to Archives
        </button>
      </div>
    );
  }

  const isWinnerA = debate.winner.includes("Side A") || debate.scoreA > debate.scoreB;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 selection:bg-amber-500/30 selection:text-amber-200 pb-20">
      {/* Background Texture */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-[#0a0a0a] to-black opacity-60"></div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12"
      >
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded text-amber-600 shadow-lg shadow-black/50">
              <Scale size={24} />
            </div>
            <div>
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">Adjudication Record</p>
              <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                Case #{id.slice(-6)}
                <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded font-sans font-normal border border-neutral-700">Closed</span>
              </h1>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-2 text-neutral-400 hover:text-amber-500 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            <span className="hidden sm:inline">Return to Chambers</span>
          </button>
        </div>

        {/* Verdict Banner */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-12 relative overflow-hidden rounded-lg border border-neutral-800 bg-[#111] shadow-2xl shadow-black/50"
        >
           <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent opacity-50"></div>
           
           <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 p-8 md:p-12 items-center text-center md:text-left relative z-10">
              {/* Left Details */}
              <div className="space-y-4">
                <h2 className="text-neutral-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                    <Quote size={12} /> Motion for Debate
                </h2>
                <p className="text-2xl md:text-3xl font-serif text-white leading-tight">
                    "{debate.topic}"
                </p>
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-neutral-500">
                    <Calendar size={14} />
                    <span>Adjudicated on {new Date(debate.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                </div>
              </div>

              {/* Center Divider (Desktop) */}
              <div className="hidden md:block w-px h-24 bg-neutral-800"></div>

              {/* Winner Announcement */}
              <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-500/20 to-amber-900/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-500 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]">
                      <Gavel size={32} />
                  </div>
                  <h3 className="text-amber-500 text-sm font-bold uppercase tracking-[0.2em] mb-2">Final Verdict</h3>
                  <p className="text-xl font-serif font-bold text-white tracking-tight bg-neutral-900/50 px-6 py-2 rounded-full border border-neutral-800">
                    {debate.winner}
                  </p>
              </div>
           </div>
        </motion.div>

        {/* Arguments Comparison Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          
          {/* Side A Column */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`flex flex-col h-full rounded-lg border ${isWinnerA ? 'border-amber-900/40 bg-amber-950/5' : 'border-neutral-800 bg-[#111]'}`}
          >
            {/* Header */}
            <div className={`p-6 border-b flex justify-between items-center ${isWinnerA ? 'border-amber-900/30 bg-amber-900/10' : 'border-neutral-800 bg-neutral-900/30'}`}>
              <div>
                <h3 className={`font-serif text-lg font-bold ${isWinnerA ? 'text-amber-500' : 'text-neutral-400'}`}>
                    Side A (Proposition)
                </h3>
                {isWinnerA && <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 flex items-center gap-1 mt-1"><Trophy size={10} /> Victor</span>}
              </div>
              <div className="text-3xl font-serif font-bold text-white tabular-nums">
                {debate.scoreA}<span className="text-sm text-neutral-600 font-sans ml-1">/100</span>
              </div>
            </div>
            
            <div className="p-6 flex-grow space-y-8">
              {/* Arguments List */}
              <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText size={14} /> Arguments Presented
                  </h4>
                  <div className="pl-4 border-l-2 border-neutral-800 space-y-4">
                    {/* Assuming debate.sideA is an array based on previous code, if string, render directly */}
                    {Array.isArray(debate.sideA) 
                        ? debate.sideA.map((arg, i) => (
                            <p key={i} className="text-neutral-300 text-sm leading-relaxed font-light">
                                <span className="text-amber-600/50 font-bold mr-2">{i+1}.</span>
                                {arg}
                            </p>
                        ))
                        : <p className="text-neutral-300 text-sm leading-relaxed font-light italic">"{debate.sideA}"</p>
                    }
                  </div>
              </div>

              {/* Feedback Section */}
              <div className="bg-neutral-900/50 rounded border border-neutral-800 p-5 space-y-6">
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold text-green-600/80 uppercase tracking-widest mb-2">
                    <CheckCircle2 size={14} /> Merits
                  </h4>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {debate.feedback.sideA_feedback.justification}
                  </p>
                </div>
                <div className="h-px bg-neutral-800 w-full"></div>
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold text-amber-600/80 uppercase tracking-widest mb-2">
                    <AlertCircle size={14} /> Rectifications
                  </h4>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {debate.feedback.sideA_feedback.improvements}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Side B Column */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`flex flex-col h-full rounded-lg border ${!isWinnerA ? 'border-amber-900/40 bg-amber-950/5' : 'border-neutral-800 bg-[#111]'}`}
          >
            {/* Header */}
            <div className={`p-6 border-b flex justify-between items-center ${!isWinnerA ? 'border-amber-900/30 bg-amber-900/10' : 'border-neutral-800 bg-neutral-900/30'}`}>
              <div>
                <h3 className={`font-serif text-lg font-bold ${!isWinnerA ? 'text-amber-500' : 'text-neutral-400'}`}>
                    Side B (Opposition)
                </h3>
                {!isWinnerA && <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 flex items-center gap-1 mt-1"><Trophy size={10} /> Victor</span>}
              </div>
              <div className="text-3xl font-serif font-bold text-white tabular-nums">
                {debate.scoreB}<span className="text-sm text-neutral-600 font-sans ml-1">/100</span>
              </div>
            </div>
            
            <div className="p-6 flex-grow space-y-8">
              {/* Arguments List */}
              <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText size={14} /> Arguments Presented
                  </h4>
                  <div className="pl-4 border-l-2 border-neutral-800 space-y-4">
                    {Array.isArray(debate.sideB) 
                        ? debate.sideB.map((arg, i) => (
                            <p key={i} className="text-neutral-300 text-sm leading-relaxed font-light">
                                <span className="text-rose-600/50 font-bold mr-2">{i+1}.</span>
                                {arg}
                            </p>
                        ))
                        : <p className="text-neutral-300 text-sm leading-relaxed font-light italic">"{debate.sideB}"</p>
                    }
                  </div>
              </div>

              {/* Feedback Section */}
              <div className="bg-neutral-900/50 rounded border border-neutral-800 p-5 space-y-6">
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold text-green-600/80 uppercase tracking-widest mb-2">
                    <CheckCircle2 size={14} /> Merits
                  </h4>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {debate.feedback.sideB_feedback.justification}
                  </p>
                </div>
                <div className="h-px bg-neutral-800 w-full"></div>
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold text-amber-600/80 uppercase tracking-widest mb-2">
                    <AlertCircle size={14} /> Rectifications
                  </h4>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {debate.feedback.sideB_feedback.improvements}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}