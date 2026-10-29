import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRightLeft,
  ChevronRight,
  ShieldAlert,
  Send,
  Sliders,
  FileText,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Info,
  CheckCircle,
  Zap,
  Navigation,
  MapPin,
} from 'lucide-react';
import { api } from '../../services/api';
import { Department, Grievance, WorkOrder, DepartmentRoutingRule, ComplaintAuditEntry } from '../../types';

interface DepartmentDashboardPanelProps {
  currentUser?: any;
  onSelectGrievanceOnMap?: (g: Grievance) => void;
  onRefreshMapGrievances?: () => void;
}

export const DepartmentDashboardPanel: React.FC<DepartmentDashboardPanelProps> = ({
  currentUser,
  onSelectGrievanceOnMap,
  onRefreshMapGrievances,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-roads');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [routingRules, setRoutingRules] = useState<DepartmentRoutingRule[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'workOrders' | 'rules' | 'workload'>('queue');

  // Modal states
  const [reassignModalGrievance, setReassignModalGrievance] = useState<Grievance | null>(null);
  const [targetDeptId, setTargetDeptId] = useState<string>('');
  const [targetOperatorId, setTargetOperatorId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<string>('');

  const [historyModalGrievance, setHistoryModalGrievance] = useState<Grievance | null>(null);
  const [auditHistory, setAuditHistory] = useState<ComplaintAuditEntry[]>([]);

  const [workOrderModalGrievance, setWorkOrderModalGrievance] = useState<Grievance | null>(null);
  const [woTitle, setWoTitle] = useState<string>('');
  const [woInstructions, setWoInstructions] = useState<string>('');
  const [woDueDate, setWoDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [woTargetDept, setWoTargetDept] = useState<string>('');

  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Load department list and rules on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load dashboard when selected department changes
  useEffect(() => {
    if (selectedDeptId) {
      loadDepartmentDetails(selectedDeptId);
    }
  }, [selectedDeptId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [depts, rules] = await Promise.all([
        api.getDepartments(),
        api.getDepartmentRoutingRules(),
      ]);
      setDepartments(depts);
      setRoutingRules(rules);
      if (depts.length > 0 && !selectedDeptId) {
        setSelectedDeptId(depts[0].id);
      }
    } catch (err) {
      console.error('Failed to load department registry:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentDetails = async (deptId: string) => {
    try {
      const [dash, wos] = await Promise.all([
        api.getDepartmentDashboard(deptId),
        api.getWorkOrders(undefined, deptId),
      ]);
      setDashboardData(dash);
      setWorkOrders(wos);
    } catch (err) {
      console.error('Failed to load department dashboard:', err);
    }
  };

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleReassign = async () => {
    if (!reassignModalGrievance || !targetDeptId) return;
    try {
      await api.reassignGrievance(reassignModalGrievance.id, {
        departmentId: targetDeptId,
        operatorId: targetOperatorId || undefined,
        reason: reassignReason || 'Department administrator workload adjustment',
        performedBy: currentUser?.displayName || 'Municipal Authority Official',
      });
      showNotification(`Grievance ${reassignModalGrievance.id} successfully reassigned.`);
      setReassignModalGrievance(null);
      setReassignReason('');
      loadDepartmentDetails(selectedDeptId);
      if (onRefreshMapGrievances) onRefreshMapGrievances();
    } catch (err: any) {
      alert(`Reassignment failed: ${err.message}`);
    }
  };

  const handleEscalate = async (g: Grievance) => {
    const reason = prompt(
      `Confirm escalation for grievance "${g.category}". Enter reason for escalation:`,
      'Exceeded SLA target and safety hazard identified.'
    );
    if (!reason) return;
    try {
      await api.escalateGrievance(g.id, {
        reason,
        performedBy: currentUser?.displayName || 'Senior Municipal Official',
      });
      showNotification(`Grievance ${g.id} priority escalated.`);
      loadDepartmentDetails(selectedDeptId);
      if (onRefreshMapGrievances) onRefreshMapGrievances();
    } catch (err: any) {
      alert(`Escalation failed: ${err.message}`);
    }
  };

  const handleOpenHistory = async (g: Grievance) => {
    setHistoryModalGrievance(g);
    try {
      const history = await api.getGrievanceHistory(g.id);
      setAuditHistory(history);
    } catch (err) {
      console.error('Failed to load grievance history:', err);
      setAuditHistory(g.history || []);
    }
  };

  const handleCreateWorkOrder = async () => {
    if (!workOrderModalGrievance || !woTitle || !woInstructions || !woTargetDept) return;
    try {
      await api.createWorkOrder({
        grievanceId: workOrderModalGrievance.id,
        departmentId: woTargetDept,
        title: woTitle,
        instructions: woInstructions,
        dueDate: new Date(woDueDate).toISOString(),
      });
      showNotification(`Work Order dispatched to ${woTargetDept}.`);
      setWorkOrderModalGrievance(null);
      setWoTitle('');
      setWoInstructions('');
      loadDepartmentDetails(selectedDeptId);
    } catch (err: any) {
      alert(`Failed to create work order: ${err.message}`);
    }
  };

  const handleCompleteWorkOrder = async (woId: string) => {
    try {
      await api.updateWorkOrderStatus(woId, 'COMPLETED');
      showNotification('Work order marked as COMPLETED.');
      loadDepartmentDetails(selectedDeptId);
    } catch (err: any) {
      alert(`Failed to update work order: ${err.message}`);
    }
  };

  const currentDept = departments.find(d => d.id === selectedDeptId);
  const metrics = dashboardData?.metrics || {};
  const operatorWorkloads = dashboardData?.operatorWorkloads || [];
  const recentGrievances: Grievance[] = dashboardData?.recentGrievances || [];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Banner & Department Navigation Bar */}
      <div className="bg-slate-800/90 border-b border-slate-700 px-4 py-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                PCMC Department Workload & Routing Hub
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-normal">
                  PCMC Automated Engine
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Transparent rule-based routing, operator capacity dispatching & interdepartmental work orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDepartmentDetails(selectedDeptId)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-xs font-medium text-slate-200 transition"
              title="Refresh Department Metrics"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Department Pills */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin">
          {departments.map(dept => {
            const isSelected = dept.id === selectedDeptId;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30'
                    : 'bg-slate-900/70 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{dept.name}</span>
                {dept.id === 'dept-general-review' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionSuccessMsg && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-4 py-2 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Department Overview Banner */}
        {currentDept && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{currentDept.name}</h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  {currentDept.code}
                </span>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                  Active Jurisdiction
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                <strong className="text-slate-300">Jurisdiction:</strong> {currentDept.jurisdictionArea} &nbsp;•&nbsp;
                <strong className="text-slate-300">Contact:</strong> {currentDept.contactEmail} ({currentDept.contactPhone || 'N/A'})
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Response Target</span>
                <span className="text-cyan-400 font-bold text-sm">{currentDept.slaHours.response} Hours</span>
              </div>
              <div className="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Resolution Target</span>
                <span className="text-indigo-400 font-bold text-sm">{currentDept.slaHours.resolution} Hours</span>
              </div>
            </div>
          </div>
        )}

        {/* 6 Real KPI Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 shadow-sm">
            <span className="text-[11px] text-slate-400 block font-medium">Total Received</span>
            <span className="text-xl font-bold text-white mt-1 block">
              {metrics.totalReceived ?? 0}
            </span>
            <span className="text-[10px] text-slate-400">All registered complaints</span>
          </div>

          <div className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-3 shadow-sm">
            <span className="text-[11px] text-amber-400 block font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Open / In Remediation
            </span>
            <span className="text-xl font-bold text-amber-300 mt-1 block">
              {(metrics.openComplaints ?? 0)}
            </span>
            <span className="text-[10px] text-slate-400">
              {metrics.assignedComplaints || 0} assigned, {metrics.inProgressComplaints || 0} in progress
            </span>
          </div>

          <div className="bg-slate-800/80 border border-rose-500/40 rounded-xl p-3 shadow-sm">
            <span className="text-[11px] text-rose-400 block font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> SLA Overdue
            </span>
            <span className="text-xl font-bold text-rose-400 mt-1 block">
              {metrics.overdueComplaints ?? 0}
            </span>
            <span className="text-[10px] text-rose-300">
              Exceeded {currentDept?.slaHours.resolution || 24}h target
            </span>
          </div>

          <div className="bg-slate-800/80 border border-emerald-500/30 rounded-xl p-3 shadow-sm">
            <span className="text-[11px] text-emerald-400 block font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolution Rate
            </span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">
              {metrics.resolutionRatePercent ?? 100}%
            </span>
            <span className="text-[10px] text-slate-400">
              {metrics.resolvedComplaints || 0} resolved
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 shadow-sm">
            <span className="text-[11px] text-slate-400 block font-medium">Avg Assignment Time</span>
            <span className="text-xl font-bold text-cyan-400 mt-1 block">
              {metrics.avgTimeToAssignmentHours ?? 0.5}h
            </span>
            <span className="text-[10px] text-slate-400">Auto rule dispatch latency</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 shadow-sm">
            <span className="text-[11px] text-slate-400 block font-medium">High Priority</span>
            <span className="text-xl font-bold text-orange-400 mt-1 block">
              {metrics.highPriorityComplaints ?? 0}
            </span>
            <span className="text-[10px] text-slate-400">Severe & hazardous issues</span>
          </div>
        </div>

        {/* Workload Capacity Gauges & Backlog Ageing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Operator Workload Distribution */}
          <div className="lg:col-span-2 bg-slate-800/70 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Department Operators & Queue Capacity ({operatorWorkloads.length})
              </h4>
              <span className="text-[11px] text-slate-400">Fair workload balancing policy active</span>
            </div>

            {operatorWorkloads.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No individual operators registered. Department operates via central dispatch queue.
              </div>
            ) : (
              <div className="space-y-3">
                {operatorWorkloads.map((op: any) => {
                  const percent = Math.min(100, Math.round((op.activeTicketsCount / op.maxCapacity) * 100));
                  let barColor = 'bg-emerald-500';
                  if (percent >= 90) barColor = 'bg-rose-500';
                  else if (percent >= 70) barColor = 'bg-amber-500';

                  return (
                    <div key={op.id} className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">{op.name}</span>
                          <span className="text-[11px] text-slate-400 font-normal">({op.role})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-300">
                            {op.activeTicketsCount} / {op.maxCapacity} tickets
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              op.isAvailable
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {op.isAvailable ? 'AVAILABLE' : 'AT CAPACITY'}
                          </span>
                        </div>
                      </div>

                      {/* Workload Capacity Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex items-center">
                        <div
                          className={`h-full ${barColor} transition-all duration-300`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                        <span>Utilization: {percent}%</span>
                        <span>Remaining Capacity: {Math.max(0, op.maxCapacity - op.activeTicketsCount)} slots</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Backlog Ageing Breakdown */}
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Open Complaint Ageing
            </h4>

            <div className="space-y-3">
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-emerald-400 block">&lt; 24 Hours</span>
                  <span className="text-[10px] text-slate-400">Within initial response window</span>
                </div>
                <span className="text-base font-bold text-white font-mono">
                  {metrics.backlogAgeing?.under24h ?? 0}
                </span>
              </div>

              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-amber-400 block">24 – 48 Hours</span>
                  <span className="text-[10px] text-slate-400">Standard resolution cycle</span>
                </div>
                <span className="text-base font-bold text-white font-mono">
                  {metrics.backlogAgeing?.from24to48h ?? 0}
                </span>
              </div>

              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-orange-400 block">48 – 72 Hours</span>
                  <span className="text-[10px] text-slate-400">Escalation warning threshold</span>
                </div>
                <span className="text-base font-bold text-white font-mono">
                  {metrics.backlogAgeing?.from48to72h ?? 0}
                </span>
              </div>

              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-rose-500/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-rose-400 block">&gt; 72 Hours (Critical)</span>
                  <span className="text-[10px] text-rose-300">Requires executive intervention</span>
                </div>
                <span className="text-base font-bold text-rose-400 font-mono">
                  {metrics.backlogAgeing?.over72h ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Interactive Section */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-700 bg-slate-900/50">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'border-blue-500 text-blue-400 bg-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Department Grievance Queue ({recentGrievances.length})
            </button>
            <button
              onClick={() => setActiveTab('workOrders')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'workOrders'
                  ? 'border-blue-500 text-blue-400 bg-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> Linked Work Orders ({workOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'rules'
                  ? 'border-blue-500 text-blue-400 bg-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Active Routing Rules ({routingRules.length})
            </button>
          </div>

          <div className="p-4">
            {/* 1. Grievance Queue Tab */}
            {activeTab === 'queue' && (
              <div className="space-y-3">
                {recentGrievances.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No active or historical grievances assigned to this department.
                  </div>
                ) : (
                  recentGrievances.map(g => {
                    const isOverdue = g.isOverdue;
                    return (
                      <div
                        key={g.id}
                        className={`p-3.5 rounded-lg border transition ${
                          g.status === 'RESOLVED'
                            ? 'bg-slate-900/30 border-emerald-500/30 opacity-75'
                            : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-400">{g.id}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                              {g.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                g.status === 'RESOLVED'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : g.status === 'IN_PROGRESS'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {g.status}
                            </span>
                            {g.isSynthetic && (
                              <span className="text-[10px] font-mono text-purple-400 bg-purple-950/50 border border-purple-800/40 px-1.5 py-0.5 rounded">
                                LABELED SYNTHETIC
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-300">
                              Priority: <strong className="text-amber-400">{g.priorityScore}</strong>/100
                            </span>
                            {g.escalationLevel ? (
                              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[10px] font-bold">
                                ESCALATED L{g.escalationLevel}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <p className="text-xs text-slate-200 mb-2.5">{g.description}</p>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs text-slate-400">
                          <div>
                            <strong className="text-slate-300">Assigned To:</strong>{' '}
                            {g.assignedOperatorName || 'Department Dispatch Pool'}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {onSelectGrievanceOnMap && (
                              <button
                                onClick={() => onSelectGrievanceOnMap(g)}
                                className="px-3 py-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded text-[11px] font-semibold transition flex items-center gap-1.5 shadow-sm border border-rose-400/40"
                                title="Fly directly to this grievance in 3D Digital Twin"
                              >
                                <Navigation className="w-3.5 h-3.5 text-white animate-pulse" />
                                <span>Go to Location (3D)</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenHistory(g)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium border border-slate-700 transition"
                            >
                              Audit Timeline
                            </button>

                            <button
                              onClick={() => {
                                setReassignModalGrievance(g);
                                setTargetDeptId(g.assignedDepartmentId || selectedDeptId);
                              }}
                              className="px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded text-[11px] font-medium transition flex items-center gap-1"
                            >
                              <ArrowRightLeft className="w-3 h-3" /> Reassign
                            </button>

                            <button
                              onClick={() => {
                                setWorkOrderModalGrievance(g);
                                setWoTargetDept(selectedDeptId);
                                setWoTitle(`Field Action for ${g.category.toUpperCase()}`);
                                setWoInstructions(`Inspect and resolve reported issue: ${g.description}`);
                              }}
                              className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded text-[11px] font-medium transition flex items-center gap-1"
                            >
                              <PlusCircle className="w-3 h-3" /> Work Order
                            </button>

                            {g.status !== 'RESOLVED' && (
                              <button
                                onClick={() => handleEscalate(g)}
                                className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded text-[11px] font-medium transition flex items-center gap-1"
                              >
                                <Zap className="w-3 h-3" /> Escalate
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 2. Linked Work Orders Tab */}
            {activeTab === 'workOrders' && (
              <div className="space-y-3">
                {workOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No active work orders dispatched for this department.
                  </div>
                ) : (
                  workOrders.map(wo => (
                    <div
                      key={wo.id}
                      className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-700 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-indigo-400">{wo.id}</span>
                          <span className="font-semibold text-slate-100 text-xs">{wo.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              wo.status === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            {wo.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{wo.instructions}</p>
                        <div className="text-[11px] text-slate-400 mt-1">
                          <span>Target: {wo.operatorName || 'Assigned Crew'}</span> &nbsp;•&nbsp;
                          <span>Due Date: {new Date(wo.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {wo.grievanceId && onSelectGrievanceOnMap && (
                          (() => {
                            const linkedGrv = dashboardData?.grievances?.find((x: Grievance) => x.id === wo.grievanceId);
                            if (!linkedGrv) return null;
                            return (
                              <button
                                onClick={() => onSelectGrievanceOnMap(linkedGrv)}
                                className="px-2.5 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-sm transition border border-rose-400/40"
                                title="Fly to work order site"
                              >
                                <Navigation className="w-3 h-3 text-white" />
                                <span>Go to Site (3D)</span>
                              </button>
                            );
                          })()
                        )}

                        {wo.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleCompleteWorkOrder(wo.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. Routing Rules Tab */}
            {activeTab === 'rules' && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 mb-2">
                  Configured automated classification & routing rules. Complaints meeting threshold are routed automatically; below threshold or out-of-jurisdiction cases route to General Review queue.
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-2.5">Rule Name</th>
                        <th className="p-2.5">Category Match</th>
                        <th className="p-2.5">Target Department</th>
                        <th className="p-2.5">Confidence Req</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {routingRules.map(rule => (
                        <tr key={rule.id} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-medium text-white">{rule.ruleName}</td>
                          <td className="p-2.5 font-mono text-cyan-400">{rule.categoryMatch}</td>
                          <td className="p-2.5">{rule.targetDepartmentId}</td>
                          <td className="p-2.5 font-mono">{(rule.confidenceThreshold * 100).toFixed(0)}%</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              ACTIVE
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REASSIGNMENT MODAL */}
      {reassignModalGrievance && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-400" />
              Reassign Grievance: {reassignModalGrievance.id}
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Department</label>
              <select
                value={targetDeptId}
                onChange={e => {
                  setTargetDeptId(e.target.value);
                  setTargetOperatorId('');
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Assign Specific Operator (Optional)</label>
              <select
                value={targetOperatorId}
                onChange={e => setTargetOperatorId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="">Department General Pool (Fair Auto-Dispatch)</option>
                {(departments.find(d => d.id === targetDeptId)?.operators || []).map(op => (
                  <option key={op.id} value={op.id}>
                    {op.name} ({op.role}) - Load: {op.activeTicketsCount}/{op.maxCapacity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Reason for Reassignment</label>
              <textarea
                value={reassignReason}
                onChange={e => setReassignReason(e.target.value)}
                placeholder="E.g., Requires specialized drainage vacuum equipment..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white h-20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setReassignModalGrievance(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANONICAL AUDIT TIMELINE MODAL */}
      {historyModalGrievance && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Audit Trail & History: {historyModalGrievance.id}
                </h3>
                {onSelectGrievanceOnMap && (
                  <button
                    onClick={() => {
                      onSelectGrievanceOnMap(historyModalGrievance);
                      setHistoryModalGrievance(null);
                    }}
                    className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-sm transition border border-rose-400/40"
                    title="Jump to 3D Location"
                  >
                    <Navigation className="w-3 h-3 text-white" />
                    <span>Go to Location (3D)</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setHistoryModalGrievance(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {auditHistory.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No audit log entries recorded.</div>
              ) : (
                auditHistory.map(entry => (
                  <div key={entry.id} className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-cyan-400">{entry.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-300">
                      <strong className="text-slate-400">Actor:</strong> {entry.performedBy}
                    </div>
                    {entry.reason && (
                      <div className="text-slate-300 mt-1">
                        <strong className="text-slate-400">Notes:</strong> {entry.reason}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setHistoryModalGrievance(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE WORK ORDER MODAL */}
      {workOrderModalGrievance && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 space-y-3.5 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              Dispatch Interdepartmental Work Order
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Target Department</label>
              <select
                value={woTargetDept}
                onChange={e => setWoTargetDept(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Work Order Title</label>
              <input
                type="text"
                value={woTitle}
                onChange={e => setWoTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Field Instructions</label>
              <textarea
                value={woInstructions}
                onChange={e => setWoInstructions(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white h-20"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Due Date</label>
              <input
                type="date"
                value={woDueDate}
                onChange={e => setWoDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setWorkOrderModalGrievance(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkOrder}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Dispatch Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
