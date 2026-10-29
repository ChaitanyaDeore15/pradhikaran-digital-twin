import React, { useState, useRef } from 'react';
import { Grievance, GrievanceUpdate, User, VisionDepartmentPrediction } from '../../types';
import { api } from '../../services/api';
import {
  AlertTriangle,
  PlusCircle,
  Image as ImageIcon,
  X,
  UploadCloud,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  HardHat,
  Lock,
  ShieldAlert,
  Sparkles,
  Brain,
  Cpu,
  BarChart2,
  Activity,
} from 'lucide-react';

interface GrievancePanelProps {
  grievances: Grievance[];
  onRefresh: () => void;
  onSelectGrievance?: (g: Grievance) => void;
  currentUser?: User | null;
  onOpenAuthorityLogin?: () => void;
}

export const GrievancePanel: React.FC<GrievancePanelProps> = ({
  grievances,
  onRefresh,
  onSelectGrievance,
  currentUser,
  onOpenAuthorityLogin,
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('pothole');
  const [description, setDescription] = useState<string>('');
  const [severity, setSeverity] = useState<string>('MODERATE');
  const [latitude, setLatitude] = useState<number>(18.6520);
  const [longitude, setLongitude] = useState<number>(73.7615);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthority = currentUser?.role === 'AUTHORITY_ADMIN' || currentUser?.role === 'CAMPUS_AUTHORITY';

  // Authority Updates State
  const [expandedGrievanceId, setExpandedGrievanceId] = useState<string | null>(null);
  const [authorityName, setAuthorityName] = useState<string>(currentUser?.displayName || 'PCMC Infrastructure Officer');
  const [authorityRole, setAuthorityRole] = useState<string>(currentUser?.designation || 'Road Maintenance Division');
  const [authorityRemarks, setAuthorityRemarks] = useState<string>('');
  const [authorityStatusChange, setAuthorityStatusChange] = useState<string>('IN_PROGRESS');
  const [updatingAuthority, setUpdatingAuthority] = useState<boolean>(false);

  // Full-size image modal state
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // AI Computer Vision State
  const [visionPrediction, setVisionPrediction] = useState<VisionDepartmentPrediction | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState<boolean>(false);
  const [visionError, setVisionError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be under 5 MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Str = reader.result as string;
        setImagePreview(base64Str);
        setVisionPrediction(null);
        setVisionError(null);
        setAnalyzingImage(true);

        try {
          const prediction = await api.classifyDepartmentImage({
            imageBase64: base64Str,
            filename: file.name,
          });
          setVisionPrediction(prediction);
          if (prediction?.predictedCategory) {
            setCategory(prediction.predictedCategory);
          }
        } catch (err: any) {
          console.error('AI Vision classification error:', err);
          setVisionError(err?.message || 'Automatic visual classification service unavailable');
        } finally {
          setAnalyzingImage(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setVisionPrediction(null);
    setVisionError(null);
    setAnalyzingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      setSubmitting(true);
      await api.submitGrievance({
        category,
        description,
        latitude,
        longitude,
        severity,
        imageUrl: imagePreview || undefined,
      });
      setDescription('');
      handleClearImage();
      setShowSubmitModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAuthorityUpdate = async (grievanceId: string) => {
    if (!authorityRemarks.trim()) return;

    try {
      setUpdatingAuthority(true);
      await api.addGrievanceUpdate(grievanceId, {
        authorName: authorityName,
        authorRole: authorityRole,
        remarks: authorityRemarks,
        statusChange: authorityStatusChange,
      });
      setAuthorityRemarks('');
      onRefresh();
    } catch (err: any) {
      alert(`Failed to add authority update: ${err.message}`);
    } finally {
      setUpdatingAuthority(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold tracking-wider uppercase flex items-center gap-2 text-orange-400">
            <AlertTriangle className="w-4 h-4" /> Module B: Civic Grievance Portal
          </h2>
          <span className="text-[11px] text-slate-400">
            Citizen Reporting & Municipal Authority Progress Tracking
          </span>
        </div>
        <button
          onClick={() => setShowSubmitModal(!showSubmitModal)}
          className="flex items-center gap-1.5 text-xs bg-orange-600 hover:bg-orange-500 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-md"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Report Problem
        </button>
      </div>

      {/* Citizen Problem Submission Form */}
      {showSubmitModal && (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col gap-3 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Submit New Infrastructure Report</span>
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Issue Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="pothole">Pothole / Road Damage</option>
                <option value="waterlogging">Waterlogging / Blocked Drain</option>
                <option value="waste_accumulation">Waste / Garbage Dump</option>
                <option value="broken_streetlight">Broken Streetlight / Electrical</option>
                <option value="pipeline_leakage">Water Pipeline Leakage / Burst</option>
                <option value="fallen_tree">Fallen Tree / Overgrown Foliage</option>
                <option value="damaged_sidewalk">Damaged Footpath / Kerb</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Severity Tier</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="LOW">LOW (Cosmetic Wear)</option>
                <option value="MODERATE">MODERATE (Traffic Delay)</option>
                <option value="SEVERE">SEVERE (Vehicle Hazard)</option>
                <option value="HAZARDOUS">HAZARDOUS (Accident Risk)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs block mb-1">Description & Landmark Details</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Deep pothole right outside PCCOE gate 2 on Krantisinha Nana Patil road..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* User Image Upload Component with Automatic AI Vision Model Categorization */}
          <div>
            <label className="text-slate-400 text-xs block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 font-medium">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> Evidence Photo (Upload Image)
              </span>
              <span className="text-[10px] text-purple-400 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 text-purple-400" /> Auto-classified by Computer Vision
              </span>
            </label>

            {imagePreview ? (
              <div className="relative border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
                <img
                  src={imagePreview}
                  alt="Evidence preview"
                  className="w-full h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 bg-red-600/90 text-white p-1 rounded-full hover:bg-red-500 transition shadow"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-lg p-3 text-center cursor-pointer transition bg-slate-900/60"
              >
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-xs text-slate-300 block font-medium">
                  Click to browse or take an infrastructure photo
                </span>
                <span className="text-[10px] text-slate-500">Supports JPG, PNG, WebP (Max 5 MB)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}

            {/* AI Vision Processing State */}
            {analyzingImage && (
              <div className="mt-2.5 p-3 rounded-lg border border-purple-800/80 bg-purple-950/40 text-purple-200 flex items-center gap-2.5 text-xs animate-pulse">
                <Activity className="w-4 h-4 text-purple-400 animate-spin" />
                <div>
                  <div className="font-semibold text-purple-300">AI Computer Vision Model Active</div>
                  <div className="text-[10px] text-purple-400">
                    Extracting multi-spectral edge gradients, specular water reflectance, and chromatic scatter...
                  </div>
                </div>
              </div>
            )}

            {/* AI Vision Model Prediction & Feature Breakdown Card */}
            {visionPrediction && (
              <div className="mt-2.5 p-3 rounded-xl border border-emerald-700/70 bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 shadow-lg text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>AI Model Defect & Department Assignment</span>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-mono font-bold">
                    {(visionPrediction.confidence * 100).toFixed(1)}% Match
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Assigned Department</span>
                    <span className="font-semibold text-slate-100 block mt-0.5">{visionPrediction.departmentName}</span>
                    <span className="text-[9px] text-emerald-400 font-mono">ID: {visionPrediction.departmentId}</span>
                  </div>
                  <div className="bg-slate-800/70 p-2 rounded-lg border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Detected Defect Category</span>
                    <span className="font-semibold text-orange-300 block mt-0.5 capitalize">{visionPrediction.predictedCategory.replace('_', ' ')}</span>
                    <span className="text-[9px] text-slate-400 font-mono">Auto-selected above</span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="mt-2 p-2 bg-slate-950/70 rounded-lg border border-slate-800 text-[10.5px] text-slate-300 leading-snug">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase font-mono mb-0.5">Model Rationale:</span>
                  {visionPrediction.explanation}
                </div>

                {/* Visual Feature Metrics */}
                <div className="mt-2">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">
                    Extracted Multi-Spectral Civic Feature Vectors:
                  </span>
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                    <div className="bg-slate-800/60 px-1.5 py-1 rounded border border-slate-700 text-slate-300">
                      Roughness: <strong className="text-amber-400">{visionPrediction.visualFeatures.surfaceRoughness.toFixed(0)}%</strong>
                    </div>
                    <div className="bg-slate-800/60 px-1.5 py-1 rounded border border-slate-700 text-slate-300">
                      Water Index: <strong className="text-blue-400">{visionPrediction.visualFeatures.specularWaterIndex.toFixed(0)}%</strong>
                    </div>
                    <div className="bg-slate-800/60 px-1.5 py-1 rounded border border-slate-700 text-slate-300">
                      Vegetation: <strong className="text-emerald-400">{visionPrediction.visualFeatures.greenVegetationIndex.toFixed(0)}%</strong>
                    </div>
                    <div className="bg-slate-800/60 px-1.5 py-1 rounded border border-slate-700 text-slate-300">
                      Entropy: <strong className="text-purple-400">{visionPrediction.visualFeatures.chromaticEntropy.toFixed(0)}%</strong>
                    </div>
                    <div className="bg-slate-800/60 px-1.5 py-1 rounded border border-slate-700 text-slate-300">
                      Contrast: <strong className="text-yellow-400">{visionPrediction.visualFeatures.darkContrastRatio.toFixed(0)}%</strong>
                    </div>
                    <div className="bg-slate-800/60 px-1.5 py-1 rounded border border-slate-700 text-slate-300">
                      Sheen: <strong className="text-cyan-400">{visionPrediction.visualFeatures.cleanMoistureSheen.toFixed(0)}%</strong>
                    </div>
                  </div>
                </div>

                {/* Model Training Integrity Verification */}
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span>Model: {visionPrediction.modelMetadata.modelName} ({visionPrediction.modelMetadata.modelVersion})</span>
                  <span>F1-Score: {(visionPrediction.modelMetadata.validationF1Score * 100).toFixed(1)}% | Val Acc: {(visionPrediction.modelMetadata.validationAccuracy * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <label className="text-slate-400 block mb-0.5">Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={e => setLatitude(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-0.5">Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={e => setLongitude(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-slate-200 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="text-xs px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-xs px-4 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-500 font-semibold transition shadow"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      )}

      {/* Grievance Feed with Authority Updates */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {grievances.map(g => {
          const isExpanded = expandedGrievanceId === g.id;

          return (
            <div
              key={g.id}
              onClick={() => onSelectGrievance && onSelectGrievance(g)}
              className="bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 rounded-xl p-3.5 text-xs flex flex-col gap-2.5 transition shadow-lg"
            >
              {/* Category & Status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold uppercase tracking-wider text-[10px] bg-slate-900/90 px-2 py-0.5 rounded-md text-orange-400 border border-slate-700 font-mono">
                    {g.category}
                  </span>
                  {g.isSynthetic && (
                    <span className="text-[9px] bg-purple-950/80 text-purple-300 border border-purple-800 px-1.5 py-0.2 rounded font-mono">
                      SYNTHETIC DEMO
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    g.status === 'RESOLVED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : g.status === 'IN_PROGRESS'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {g.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-slate-200 leading-relaxed font-normal">{g.description}</p>

              {/* Uploaded Evidence Photo Thumbnail */}
              {g.imageUrl && (
                <div className="mt-1">
                  <span className="text-[10px] text-slate-400 block mb-1">Attached Photo Evidence:</span>
                  <img
                    src={g.imageUrl}
                    alt="Evidence"
                    onClick={e => {
                      e.stopPropagation();
                      setViewingImage(g.imageUrl!);
                    }}
                    className="w-20 h-20 object-cover rounded-lg border border-slate-700 cursor-pointer hover:opacity-90 transition shadow"
                  />
                </div>
              )}

              {/* Meta details */}
              <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Priority: <strong className="text-amber-400">{g.priorityScore}/100</strong></span>
                  <div className="flex items-center gap-1.5">
                    <span>Dept: <strong className="text-slate-200">{g.assignedDepartmentId || 'dept-roads'}</strong></span>
                    {g.routingDecision && (
                      <span className="text-[9.5px] text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                        AI Vision ({Math.round(g.routingDecision.confidence * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
                {g.routingDecision?.explanation && (
                  <div className="text-[10px] text-slate-400 font-mono bg-slate-900/60 rounded px-2 py-1 border border-slate-800">
                    <span className="text-emerald-400 font-bold mr-1">AI Routing:</span>
                    {g.routingDecision.explanation}
                  </div>
                )}
              </div>

              {/* Authority Timeline & Progress Updates Toggle */}
              <div className="border-t border-slate-700/60 pt-2">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setExpandedGrievanceId(isExpanded ? null : g.id);
                  }}
                  className="w-full flex items-center justify-between text-[11px] font-semibold text-blue-400 hover:text-blue-300 py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-blue-400" />
                    Authority Updates ({g.updates?.length || 0})
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Expanded Authority Timeline Drawer */}
                {isExpanded && (
                  <div className="mt-2 flex flex-col gap-2.5 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Official Work Progress & Action Logs
                    </span>

                    {/* Timeline entries */}
                    {g.updates && g.updates.length > 0 ? (
                      <div className="space-y-2 border-l-2 border-blue-500/40 pl-3 ml-1">
                        {g.updates.map(upd => (
                          <div key={upd.id} className="relative text-[11px]">
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="font-semibold text-white">{upd.authorName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(upd.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className="text-[10px] text-blue-400 block">{upd.authorRole}</span>
                            <p className="text-slate-200 mt-0.5 leading-snug">{upd.remarks}</p>
                            {upd.statusChange && (
                              <span className="inline-block mt-1 text-[9px] bg-slate-800 text-emerald-300 px-1.5 py-0.2 rounded border border-slate-700">
                                Changed status to: {upd.statusChange}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic">
                        No official updates posted yet.
                      </div>
                    )}

                    {/* Authority Post Update Form or Official Authorization Prompt */}
                    {isAuthority ? (
                      <div className="mt-2 pt-2 border-t border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Log Official Progress ({currentUser?.designation || 'Authority'}):
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {currentUser?.badgeNumber}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <input
                            type="text"
                            placeholder="Officer / Inspector Name"
                            value={authorityName}
                            onChange={e => setAuthorityName(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs"
                          />
                          <select
                            value={authorityStatusChange}
                            onChange={e => setAuthorityStatusChange(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs"
                          >
                            <option value="IN_PROGRESS">Status: IN PROGRESS</option>
                            <option value="INSPECTED">Status: INSPECTED</option>
                            <option value="UNDER_REPAIR">Status: UNDER REPAIR</option>
                            <option value="RESOLVED">Status: RESOLVED</option>
                          </select>
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="e.g. PCMC repair crew dispatched to Sector 26 road..."
                            value={authorityRemarks}
                            onChange={e => setAuthorityRemarks(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs placeholder-slate-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddAuthorityUpdate(g.id)}
                            disabled={updatingAuthority || !authorityRemarks.trim()}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2.5 py-1 rounded text-xs transition disabled:opacity-50 flex items-center gap-1 shadow-sm"
                          >
                            <Send className="w-3 h-3" /> Post Update
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 pt-2 border-t border-slate-800 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Municipal Officer Authorization Required</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Posting official field updates and changing ticket status is restricted to authenticated PCMC municipal engineers or campus infrastructure officers.
                        </p>
                        {onOpenAuthorityLogin && (
                          <button
                            type="button"
                            onClick={onOpenAuthorityLogin}
                            className="mt-0.5 text-left text-[11px] font-medium text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1"
                          >
                            <span>Sign In as Municipal Authority</span> →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-Screen Image Modal Preview */}
      {viewingImage && (
        <div
          onClick={() => setViewingImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-xl bg-slate-950 border border-slate-700 shadow-2xl">
            <img src={viewingImage} alt="Full resolution evidence" className="w-full h-auto object-contain" />
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-2 right-2 bg-slate-900/80 text-white p-1.5 rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
