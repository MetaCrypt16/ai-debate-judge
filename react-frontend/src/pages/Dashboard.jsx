import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, debates } from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Plus, Trophy, BarChart3, History, Trash2, X, Gavel, ScrollText } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [debateHistory, setDebateHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState({ show: false, debateId: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const placeholderSummaries = [
    "A rigorous examination of the proposed motion.",
    "Arguments were weighed with considerable deliberation.",
    "A spirited exchange of rhetoric and logic.",
    "The tribunal has recorded the proceedings.",
    "Conflicting ideologies clashed in this session.",
  ];

  const getStablePlaceholderIndex = (id) => {
    let hash = 0;
    const str = String(id);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash) % placeholderSummaries.length;
  };

  const handleDelete = (e, debateId) => {
    e.stopPropagation();
    setDeleteModal({ show: true, debateId });
  };

  const confirmDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    const loadingToast = toast.loading("Expunging record...");
    try {
      await debates.deleteDebate(deleteModal.debateId);
      setDebateHistory(debateHistory.filter(d => d._id !== deleteModal.debateId));
      toast.dismiss(loadingToast);
      toast.success("Record expunged.");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || "Failed to delete record");
    } finally {
      setIsDeleting(false);
      setDeleteModal({ show: false, debateId: null });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, debatesData] = await Promise.all([
          auth.getCurrentUser(),
          debates.getHistory(),
        ]);
        setUser(userData);
        setDebateHistory(debatesData);
      } catch (err) {
        setError("Failed to retrieve archives.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute user stats
  const totalDebates = debateHistory.length;
  const sideAWins = debateHistory.filter((d) => d.winner === "Side A").length;
  const sideBWins = debateHistory.filter((d) => d.winner === "Side B").length;
  const winRate = totalDebates
    ? Math.round((Math.max(sideAWins, sideBWins) / totalDebates) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-neutral-800 border-t-amber-600 rounded-full animate-spin"></div>
          <p className="text-amber-500/80 font-serif tracking-widest text-sm uppercase">Loading Archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 selection:bg-amber-500/30 selection:text-amber-200 pb-20">
      {/* Background Texture */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-900 via-[#0a0a0a] to-black opacity-60"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 border-b border-neutral-800 pb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-amber-500 text-sm font-bold tracking-widest uppercase mb-2">Adjudicator Profile</p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
             {user?.username || "Magistrate"}
            </h1>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/new-debate")}
            className="mt-6 md:mt-0 flex items-center gap-3 px-6 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded font-medium shadow-lg shadow-amber-900/20 transition-all duration-300 border border-amber-600/50 group"
          >
            <Plus size={18} className="text-amber-200 group-hover:text-white transition-colors" />
            <span className="tracking-wide">Convene Session</span>
          </motion.button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 rounded bg-red-900/10 border border-red-900/50 p-4 text-red-400 text-sm flex items-center gap-2">
            <X size={16} /> {error}
          </div>
        )}

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {/* Card 1 */}
          <div className="bg-[#111] border border-neutral-800 p-6 rounded-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <History size={64} className="text-neutral-500" />
            </div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-neutral-900 border border-neutral-800 rounded text-amber-500">
                <ScrollText size={20} />
              </div>
              <p className="text-neutral-400 text-sm font-medium uppercase tracking-wider">Total Cases</p>
            </div>
            <h3 className="text-4xl font-serif text-white ml-1">{totalDebates}</h3>
          </div>

          {/* Card 2 */}
          <div className="bg-[#111] border border-neutral-800 p-6 rounded-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy size={64} className="text-amber-500" />
            </div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-neutral-900 border border-neutral-800 rounded text-amber-500">
                <Trophy size={20} />
              </div>
              <p className="text-neutral-400 text-sm font-medium uppercase tracking-wider">Decisiveness</p>
            </div>
            <h3 className="text-4xl font-serif text-white ml-1">{winRate}<span className="text-lg text-neutral-500 font-sans">%</span></h3>
          </div>

          {/* Card 3 */}
          <div className="bg-[#111] border border-neutral-800 p-6 rounded-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BarChart3 size={64} className="text-neutral-500" />
            </div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-neutral-900 border border-neutral-800 rounded text-amber-500">
                <Gavel size={20} />
              </div>
              <p className="text-neutral-400 text-sm font-medium uppercase tracking-wider">Prevailing Side</p>
            </div>
            <h3 className="text-xl font-serif text-white mt-2 ml-1 truncate">
              {sideAWins > sideBWins ? "Proponent (A)" : sideBWins > 0 ? "Opponent (B)" : "Undecided"}
            </h3>
          </div>
        </motion.div>

        {/* History Header */}
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl font-serif font-bold text-white">Case Archives</h2>
          <div className="h-px bg-neutral-800 flex-grow"></div>
        </div>

        {/* Debate History */}
        {debateHistory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 border border-dashed border-neutral-800 rounded bg-[#0f0f0f]"
          >
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-neutral-800">
                <Gavel className="text-neutral-600" size={32} />
            </div>
            <h3 className="text-xl font-serif text-neutral-300">No Records Found</h3>
            <p className="text-neutral-500 mt-2 mb-6 text-sm max-w-sm text-center">
              The archives are empty. Initiate a new session to begin adjudicating matters of importance.
            </p>
            <button
              onClick={() => navigate("/new-debate")}
              className="text-amber-500 hover:text-amber-400 text-sm font-medium uppercase tracking-wider border-b border-amber-500/30 hover:border-amber-500 transition-all pb-0.5"
            >
              Start First Session
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {debateHistory.map((debate) => (
              <motion.div
                key={debate._id}
                whileHover={{ y: -4 }}
                className="group relative bg-[#111] border border-neutral-800 hover:border-amber-900/50 rounded-sm p-6 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-black/50"
              >
                {/* Top Row: Date & Delete */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                       Case #{debate._id.slice(-4)}
                    </span>
                    <span className="text-xs text-neutral-500 mt-1">
                      {new Date(debate.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, debate._id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-neutral-600 hover:text-red-500 transition-all"
                    title="Expunge Record"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Content */}
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(`/debates/${debate._id}`)}
                >
                  <h3 className="text-lg font-serif font-semibold text-gray-200 mb-3 line-clamp-2 group-hover:text-amber-500 transition-colors">
                    {debate.title || debate.topic}
                  </h3>
                  
                  <div className="mb-4">
                    <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest border ${
                         debate.winner === "Side A" 
                         ? "border-amber-900/50 text-amber-500 bg-amber-900/10" 
                         : "border-neutral-700 text-neutral-400 bg-neutral-900"
                    }`}>
                        Verdict: {debate.winner}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-400 line-clamp-3 mb-6 font-light leading-relaxed">
                    {debate.summary || placeholderSummaries[getStablePlaceholderIndex(debate._id)]}
                  </p>

                  <div className="flex items-center text-xs font-bold text-neutral-500 group-hover:text-amber-500 transition-colors uppercase tracking-widest">
                    <span>Review Case</span>
                    <ArrowRight size={14} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setDeleteModal({ show: false, debateId: null })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#111] border border-neutral-800 shadow-2xl p-8 rounded-sm"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-900/20 border border-red-900/50 flex items-center justify-center mb-4">
                  <Trash2 className="text-red-500" size={24} />
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-2">Expunge Record?</h3>
                <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
                  This action represents a permanent removal of the debate from the archives. This process cannot be reversed.
                </p>
                
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setDeleteModal({ show: false, debateId: null })}
                    className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-sm font-medium tracking-wide transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 bg-red-900/80 hover:bg-red-800 text-white border border-red-800 text-sm font-medium tracking-wide transition-colors shadow-lg shadow-red-900/20"
                  >
                    Permanently Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}