import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { debates } from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Scale, // Replaces Brain for a more "Legal" icon
  ArrowLeft,
  Loader2,
  Plus,
  Gavel,
  Check,
  Edit3,
  Clock,
  AlertCircle,
  FileText
} from "lucide-react";
import Timer from "../components/Timer";

export default function NewDebate() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    topic: "",
    numPoints: 3,
    sideA: [],
    sideB: [],
    timeEnabled: false,
    timePerSide: 300, // 5 minutes in seconds
  });
  const [turn, setTurn] = useState("A");
  const [inputValue, setInputValue] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({ A: 0, B: 0 });
  const [initialTimeSet, setInitialTimeSet] = useState(false);

  // Initialize timers when entering step 2
  useEffect(() => {
    if (step === 2 && formData.timeEnabled && !initialTimeSet) {
      setTimeRemaining({
        A: formData.timePerSide,
        B: formData.timePerSide,
      });
      setInitialTimeSet(true);
    }
  }, [step, formData.timeEnabled, formData.timePerSide, initialTimeSet]);

  // Derived progress
  const totalRounds = formData.numPoints * 2;
  const currentCount = formData.sideA.length + formData.sideB.length;
  const progress = Math.floor((currentCount / totalRounds) * 100);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "numPoints" ? parseInt(value) : value,
    });
  };

  const handleAddArgument = (isTimeUp = false) => {
    if (!isTimeUp && !inputValue.trim()) {
      toast.error("Please enter a valid argument.");
      return;
    }

    const updated = { ...formData };
    const nextTurn = turn === "A" ? "B" : "A";
    const currentTime = timeRemaining[turn];

    if (turn === "A") {
      updated.sideA.push(
        inputValue.trim() || "Time expired before argument completion"
      );
      setTurn(nextTurn);
    } else {
      updated.sideB.push(
        inputValue.trim() || "Time expired before argument completion"
      );
      setTurn(nextTurn);
      setCurrentIndex((i) => i + 1);
    }

    setFormData(updated);
    setInputValue("");

    if (
      updated.sideA.length === formData.numPoints &&
      updated.sideB.length === formData.numPoints
    ) {
      toast.success("Arguments recorded. Proceeding to review.");
      setStep(3);
    } else if (isTimeUp && formData.timeEnabled) {
      if (currentTime <= 0) {
        toast.error(`Time's up for Side ${turn}!`);
      } else {
        toast.warning("Time's up for this round.");
      }
    }
  };

  const handleEditArgument = (side, index, newValue) => {
    if (formData.timeEnabled) {
      const currentTime = timeRemaining[side];
      if (currentTime <= 0) {
        toast.error(`Cannot edit - Side ${side} has no time remaining!`);
        return;
      }
    }

    const updated = { ...formData };
    if (side === "A") updated.sideA[index] = newValue;
    else updated.sideB[index] = newValue;
    setFormData(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const toastId = toast.loading("The Court is deliberating...");
    try {
      const payload = {
        topic: formData.topic,
        sideA: formData.sideA.join(" "),
        sideB: formData.sideB.join(" "),
        timeEnabled: formData.timeEnabled,
        timePerSide: formData.timePerSide,
      };
      const data = await debates.submitDebate(payload);
      toast.dismiss(toastId);
      toast.success("Verdict Reached.");
      navigate(`/debates/${data.debate.id}`);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || "Judicial process failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetDebate = () => {
    setStep(1);
    setFormData({
      topic: "",
      numPoints: 3,
      sideA: [],
      sideB: [],
      timeEnabled: false,
      timePerSide: 300,
    });
    setTurn("A");
    setResult(null);
    setCurrentIndex(0);
    setEditMode(false);
    setTimeRemaining({ A: 0, B: 0 });
    setInitialTimeSet(false);
  };

  // Helper for input styling
  const inputClasses = "w-full bg-neutral-900 border border-neutral-800 rounded text-gray-200 placeholder-neutral-600 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600/50 transition-all duration-200";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-12 px-4 sm:px-6"
    >
      {/* Background Texture match */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-[#0a0a0a] to-black opacity-80"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 border-b border-neutral-800 pb-6">
          <h1 className="text-3xl font-serif font-bold text-gray-100 flex items-center gap-3">
            <div className="p-2 bg-neutral-800 rounded border border-neutral-700 text-amber-500">
                <Scale size={24} />
            </div>
            <span>New Session</span>
          </h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-2 text-neutral-400 hover:text-amber-500 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Chambers
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Configuration */}
          {step === 1 && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[#111] shadow-2xl shadow-black/50 rounded-md border border-neutral-800 p-8 space-y-8"
            >
              <div>
                <h2 className="text-xl font-serif font-semibold text-gray-100 mb-1 flex items-center gap-2">
                    <FileText size={20} className="text-amber-600" />
                    Case Configuration
                </h2>
                <p className="text-neutral-500 text-sm">Define the parameters for this judicial session.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-2">
                    Motion / Topic
                  </label>
                  <input
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    placeholder="e.g., Should AI replace human judges?"
                    className={`${inputClasses} p-4 text-lg font-serif`}
                  />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-2">
                        Arguments per Side (1–15)
                    </label>
                    <input
                        type="number"
                        name="numPoints"
                        min="1"
                        max="15"
                        value={formData.numPoints}
                        onChange={handleChange}
                        className={`${inputClasses} p-3 w-32`}
                    />
                </div>

                <div className="pt-4 border-t border-neutral-800">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="timeEnabled"
                      name="timeEnabled"
                      checked={formData.timeEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          timeEnabled: e.target.checked,
                        })
                      }
                      className="rounded border-neutral-700 bg-neutral-900 text-amber-600 focus:ring-amber-600/50 h-4 w-4"
                    />
                    <label
                      htmlFor="timeEnabled"
                      className="ml-3 block text-sm font-medium text-gray-300"
                    >
                      Enable Strict Time Limits
                    </label>
                  </div>
                  
                  <AnimatePresence>
                    {formData.timeEnabled && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-2">
                                Time Allocation (Minutes per Side)
                            </label>
                            <input
                            type="number"
                            name="timePerSide"
                            min="1"
                            max="60"
                            value={Math.floor(formData.timePerSide / 60)}
                            onChange={(e) =>
                                setFormData({
                                ...formData,
                                timePerSide: e.target.value * 60,
                                })
                            }
                            className={`${inputClasses} p-3 w-32`}
                            />
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    formData.topic.trim()
                      ? setStep(2)
                      : toast.error("The motion requires a topic.")
                  }
                  className="px-8 py-3 bg-amber-600 text-white rounded font-medium shadow-lg shadow-amber-900/20 hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  <Gavel size={18} />
                  Commence Session
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Debate Floor */}
          {step === 2 && (
            <motion.div
              key="arguments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#111] shadow-2xl shadow-black/50 rounded-md border border-neutral-800 p-8 space-y-6"
            >
              {/* Status Bar */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-neutral-800 pb-4">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-gray-100">
                    Round {Math.ceil(currentCount / 2) + 1}
                    </h2>
                    <span className="text-neutral-500 text-sm uppercase tracking-wider">
                        Argument {currentCount + 1} of {totalRounds}
                    </span>
                </div>
                
                {formData.timeEnabled && (
                  <div className="flex items-center gap-6 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
                    <div className={`flex flex-col items-center ${turn === "A" ? "opacity-100" : "opacity-40"}`}>
                      <span className="text-[10px] uppercase text-amber-500 font-bold tracking-widest mb-1">Side A</span>
                      <Timer
                        remainingTime={timeRemaining.A}
                        isActive={turn === "A"}
                        onTimeUpdate={(time) => setTimeRemaining((prev) => ({ ...prev, A: time }))}
                        onTimeUp={() => turn === "A" && handleAddArgument(true)}
                        className="text-xl font-mono text-gray-200"
                      />
                    </div>
                    <div className="h-8 w-px bg-neutral-800"></div>
                    <div className={`flex flex-col items-center ${turn === "B" ? "opacity-100" : "opacity-40"}`}>
                      <span className="text-[10px] uppercase text-rose-500 font-bold tracking-widest mb-1">Side B</span>
                      <Timer
                        remainingTime={timeRemaining.B}
                        isActive={turn === "B"}
                        onTimeUpdate={(time) => setTimeRemaining((prev) => ({ ...prev, B: time }))}
                        onTimeUp={() => turn === "B" && handleAddArgument(true)}
                        className="text-xl font-mono text-gray-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Active Turn Indicator */}
              <div className={`flex items-center gap-3 p-4 rounded border ${
                turn === "A" 
                    ? "bg-amber-900/10 border-amber-900/30 text-amber-500" 
                    : "bg-rose-900/10 border-rose-900/30 text-rose-500"
              }`}>
                {turn === "A" ? <Scale size={20} /> : <AlertCircle size={20} />}
                <p className="font-medium tracking-wide">
                  Floor: {turn === "A" ? "SIDE A (Proposition)" : "SIDE B (Opposition)"}
                </p>
              </div>

              {/* Input Area */}
              <textarea
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Present argument for Side ${turn}...`}
                className="w-full h-40 bg-neutral-900 border border-neutral-800 rounded p-4 text-gray-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-0 resize-none font-serif text-lg leading-relaxed"
              />

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddArgument(false)}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded font-medium shadow-lg transition-colors text-white
                    ${turn === "A" 
                        ? "bg-amber-600 hover:bg-amber-700 shadow-amber-900/20" 
                        : "bg-rose-700 hover:bg-rose-800 shadow-rose-900/20"
                    }`}
                >
                  <Plus size={18} /> 
                  Submit Argument
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === 3 && !result && (
            <motion.div
              key="review"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111] shadow-2xl shadow-black/50 rounded-md border border-neutral-800 p-8 space-y-8"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                    <h2 className="text-xl font-serif font-semibold text-gray-100">Review Dockets</h2>
                    <p className="text-neutral-500 text-sm mt-1">Verify all arguments before final submission.</p>
                </div>
                
                {/* Edit Mode Toggle */}
                <button
                  onClick={() => {
                    if (formData.timeEnabled && (timeRemaining.A <= 0 || timeRemaining.B <= 0)) {
                      toast.error("Time expired. Revisions blocked.");
                      return;
                    }
                    setEditMode(!editMode);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors border ${
                      editMode 
                        ? "bg-green-900/20 border-green-900/50 text-green-500" 
                        : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white"
                  }`}
                >
                  {editMode ? <><Check size={16} /> Save Changes</> : <><Edit3 size={16} /> Edit Dockets</>}
                </button>
              </div>

              {/* Arguments Grid */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Side A */}
                <div className="space-y-4">
                    <h3 className="text-amber-500 font-bold uppercase tracking-widest text-xs border-b border-amber-900/30 pb-2 flex justify-between">
                        <span>Side A (Proposition)</span>
                        {formData.timeEnabled && <span className="font-mono text-neutral-500">{Math.floor(timeRemaining.A / 60)}m left</span>}
                    </h3>
                    <div className="space-y-3">
                        {formData.sideA.map((arg, i) => (
                            <div key={i} className="group relative">
                                {editMode ? (
                                <textarea
                                    value={arg}
                                    onChange={(e) => handleEditArgument("A", i, e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-gray-300 focus:border-amber-500 outline-none"
                                    rows={3}
                                />
                                ) : (
                                <div className="bg-neutral-900/50 border border-neutral-800 p-3 rounded text-sm text-gray-300 font-serif leading-relaxed">
                                    <span className="text-amber-700 font-bold mr-2">{i + 1}.</span> {arg}
                                </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Side B */}
                <div className="space-y-4">
                    <h3 className="text-rose-500 font-bold uppercase tracking-widest text-xs border-b border-rose-900/30 pb-2 flex justify-between">
                        <span>Side B (Opposition)</span>
                        {formData.timeEnabled && <span className="font-mono text-neutral-500">{Math.floor(timeRemaining.B / 60)}m left</span>}
                    </h3>
                    <div className="space-y-3">
                        {formData.sideB.map((arg, i) => (
                            <div key={i} className="group relative">
                                {editMode ? (
                                <textarea
                                    value={arg}
                                    onChange={(e) => handleEditArgument("B", i, e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-gray-300 focus:border-rose-500 outline-none"
                                    rows={3}
                                />
                                ) : (
                                <div className="bg-neutral-900/50 border border-neutral-800 p-3 rounded text-sm text-gray-300 font-serif leading-relaxed">
                                    <span className="text-rose-700 font-bold mr-2">{i + 1}.</span> {arg}
                                </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-neutral-800">
                <button
                  onClick={() => setStep(2)}
                  className="text-neutral-500 hover:text-white transition-colors text-sm"
                >
                  ← Resume Arguments
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`px-8 py-3 bg-amber-600 text-white rounded font-medium shadow-lg shadow-amber-900/20 hover:bg-amber-700 flex items-center gap-2 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Deliberating...
                    </>
                  ) : (
                    <>
                        <Gavel size={18} /> 
                        Submit for Judgment
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}