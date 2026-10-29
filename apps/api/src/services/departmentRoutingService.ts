import * as turf from '@turf/turf';
import { v4 as uuidv4 } from 'uuid';
import { spatialRepo } from '../repositories/spatialRepository';
import {
  GrievanceEntity,
  RoutingDecision,
  ComplaintAuditEntry,
  WorkOrder,
  DepartmentOperator,
} from '../types';

export class DepartmentRoutingService {
  /**
   * Evaluates a grievance, checks jurisdiction and confidence, and routes to responsible department.
   */
  public static async routeGrievance(
    grievance: GrievanceEntity
  ): Promise<{ grievance: GrievanceEntity; decision: RoutingDecision }> {
    const rules = await spatialRepo.getDepartmentRoutingRules();
    const studyAreas = await spatialRepo.getAllStudyAreas();

    // 1. Jurisdiction Check: Check if coordinate falls within any registered study area or within 10 km
    let isWithinJurisdiction = false;
    const pt = turf.point([grievance.longitude, grievance.latitude]);

    for (const sa of studyAreas) {
      if (sa.boundaryGeoJson) {
        try {
          const poly: any = turf.feature(sa.boundaryGeoJson as any);
          if (turf.booleanPointInPolygon(pt, poly)) {
            isWithinJurisdiction = true;
            break;
          }
        } catch {
          // Fallback to circular distance
          const distM = turf.distance(
            pt,
            turf.point([sa.centerLongitude, sa.centerLatitude]),
            { units: 'meters' }
          );
          if (distM <= sa.radiusM + sa.marginM) {
            isWithinJurisdiction = true;
            break;
          }
        }
      }
    }

    // 2. Rule-based Category and Asset Type Matching
    const activeRules = rules.filter(r => r.isActive);
    let matchedRule = activeRules.find(r => {
      const catMatch = r.categoryMatch.toLowerCase() === grievance.category.toLowerCase();
      return catMatch;
    });

    let selectedDepartmentId = matchedRule ? matchedRule.targetDepartmentId : 'dept-general-review';
    let baseConfidence = matchedRule ? matchedRule.confidenceThreshold : 0.45;
    let explanation = matchedRule
      ? `Automated rule "${matchedRule.ruleName}" matched category "${grievance.category}".`
      : `No explicit routing rule matched category "${grievance.category}". Assigned to Municipal General Review queue.`;

    // 3. Keyword Analysis Boost / Penalty
    const descLower = grievance.description.toLowerCase();
    if (descLower.includes('urgent') || descLower.includes('danger') || descLower.includes('accident')) {
      baseConfidence = Math.min(0.99, baseConfidence + 0.05);
    }

    // 4. Threshold & Jurisdiction Gating
    const CONFIDENCE_THRESHOLD = 0.70;
    const isOutsideJurisdiction = !isWithinJurisdiction;
    const isManualReviewRequired =
      baseConfidence < CONFIDENCE_THRESHOLD || isOutsideJurisdiction || selectedDepartmentId === 'dept-general-review';

    if (isOutsideJurisdiction) {
      selectedDepartmentId = 'dept-general-review';
      explanation = `Location (${grievance.latitude.toFixed(4)}, ${grievance.longitude.toFixed(4)}) is outside standard PCMC jurisdiction. Routed to General Review for boundary clearance.`;
    } else if (isManualReviewRequired && selectedDepartmentId !== 'dept-general-review') {
      selectedDepartmentId = 'dept-general-review';
      explanation = `Routing confidence (${(baseConfidence * 100).toFixed(0)}%) is below required threshold (${(CONFIDENCE_THRESHOLD * 100).toFixed(0)}%). Sent to General Review queue.`;
    }

    const decision: RoutingDecision = {
      selectedDepartmentId,
      confidence: Number(baseConfidence.toFixed(2)),
      ruleVersion: matchedRule ? matchedRule.ruleVersion : 'v1.0-default',
      explanation,
      decidedAt: new Date().toISOString(),
      isAutomated: !isManualReviewRequired,
      isManualReviewRequired,
      isOutsideJurisdiction,
    };

    grievance.assignedDepartmentId = selectedDepartmentId;
    grievance.routingDecision = decision;
    grievance.status = isManualReviewRequired ? 'SUBMITTED' : 'AI_CLASSIFIED';
    grievance.updatedAt = new Date().toISOString();

    // Audit log entry
    const auditEntry: ComplaintAuditEntry = {
      id: `aud-${Date.now()}-${uuidv4().substring(0, 4)}`,
      grievanceId: grievance.id,
      action: 'ROUTED',
      performedBy: 'Automated Routing Engine v1.0',
      newDepartmentId: selectedDepartmentId,
      newStatus: grievance.status,
      reason: explanation,
      timestamp: new Date().toISOString(),
    };

    await spatialRepo.addComplaintAuditEntry(auditEntry);
    await spatialRepo.saveGrievance(grievance);

    // If successfully routed to a functional department, attempt workload assignment
    if (!isManualReviewRequired && selectedDepartmentId !== 'dept-general-review') {
      await this.assignWorkload(selectedDepartmentId, grievance.id);
    }

    const updatedGrievance = await spatialRepo.getGrievance(grievance.id);
    return {
      grievance: updatedGrievance || grievance,
      decision,
    };
  }

  /**
   * Workload-aware distribution: finds least loaded available operator within max capacity.
   */
  public static async assignWorkload(
    departmentId: string,
    grievanceId: string
  ): Promise<{ operator?: DepartmentOperator; assignedToPool: boolean }> {
    const dept = await spatialRepo.getDepartment(departmentId);
    const grievance = await spatialRepo.getGrievance(grievanceId);
    if (!dept || !grievance) return { assignedToPool: true };

    // Find candidate operators
    const availableOps = dept.operators.filter(
      op => op.isAvailable && op.activeTicketsCount < op.maxCapacity
    );

    // Sort by activeTicketsCount ascending (least loaded)
    availableOps.sort((a, b) => a.activeTicketsCount - b.activeTicketsCount);

    if (availableOps.length > 0) {
      const selectedOp = availableOps[0];
      selectedOp.activeTicketsCount += 1;
      await spatialRepo.saveDepartment(dept);

      grievance.assignedOperatorId = selectedOp.id;
      grievance.assignedOperatorName = selectedOp.name;
      grievance.status = 'ASSIGNED';
      grievance.updatedAt = new Date().toISOString();

      const auditEntry: ComplaintAuditEntry = {
        id: `aud-${Date.now()}-${uuidv4().substring(0, 4)}`,
        grievanceId: grievance.id,
        action: 'ASSIGNED',
        performedBy: 'Workload-Aware Dispatcher',
        newDepartmentId: departmentId,
        newStatus: 'ASSIGNED',
        reason: `Assigned to operator ${selectedOp.name} (${selectedOp.role}) with load ${selectedOp.activeTicketsCount}/${selectedOp.maxCapacity}.`,
        timestamp: new Date().toISOString(),
      };

      await spatialRepo.addComplaintAuditEntry(auditEntry);
      await spatialRepo.saveGrievance(grievance);

      return { operator: selectedOp, assignedToPool: false };
    } else {
      // Fallback: assign to department pool
      grievance.status = 'ASSIGNED';
      grievance.assignedDepartmentId = departmentId;
      grievance.assignedOperatorId = undefined;
      grievance.assignedOperatorName = `${dept.name} General Dispatch Pool`;
      grievance.updatedAt = new Date().toISOString();

      const auditEntry: ComplaintAuditEntry = {
        id: `aud-${Date.now()}-${uuidv4().substring(0, 4)}`,
        grievanceId: grievance.id,
        action: 'ASSIGNED',
        performedBy: 'Workload-Aware Dispatcher',
        newDepartmentId: departmentId,
        newStatus: 'ASSIGNED',
        reason: `All operators at capacity for ${dept.name}. Assigned to department dispatch pool for manual assignment.`,
        timestamp: new Date().toISOString(),
      };

      await spatialRepo.addComplaintAuditEntry(auditEntry);
      await spatialRepo.saveGrievance(grievance);

      return { assignedToPool: true };
    }
  }

  /**
   * Reassignment / Manual Override by authorized operator.
   */
  public static async reassignGrievance(
    grievanceId: string,
    newDepartmentId: string,
    newOperatorId?: string,
    reason: string = 'Authorized operator administrative override',
    performedBy: string = 'Municipal Officer'
  ): Promise<GrievanceEntity | null> {
    const grievance = await spatialRepo.getGrievance(grievanceId);
    if (!grievance) return null;

    const previousDeptId = grievance.assignedDepartmentId;
    const previousOperatorId = grievance.assignedOperatorId;

    // Decrement previous operator load
    if (previousDeptId && previousOperatorId) {
      await spatialRepo.updateOperatorTickets(previousDeptId, previousOperatorId, -1);
    }

    // Assign new department
    grievance.assignedDepartmentId = newDepartmentId;
    grievance.assignedOperatorId = newOperatorId;

    if (newOperatorId && newDepartmentId) {
      const targetDept = await spatialRepo.getDepartment(newDepartmentId);
      const targetOp = targetDept?.operators.find(o => o.id === newOperatorId);
      grievance.assignedOperatorName = targetOp?.name || 'Assigned Officer';
      await spatialRepo.updateOperatorTickets(newDepartmentId, newOperatorId, 1);
    } else {
      grievance.assignedOperatorName = undefined;
    }

    grievance.status = 'ASSIGNED';
    grievance.updatedAt = new Date().toISOString();

    const auditEntry: ComplaintAuditEntry = {
      id: `aud-${Date.now()}-${uuidv4().substring(0, 4)}`,
      grievanceId: grievance.id,
      action: 'REASSIGNED',
      performedBy,
      previousDepartmentId: previousDeptId,
      newDepartmentId,
      newStatus: 'ASSIGNED',
      reason,
      timestamp: new Date().toISOString(),
    };

    await spatialRepo.addComplaintAuditEntry(auditEntry);
    await spatialRepo.saveGrievance(grievance);

    return grievance;
  }

  /**
   * Escalates grievance priority and records escalation audit.
   */
  public static async escalateGrievance(
    grievanceId: string,
    reason: string,
    performedBy: string
  ): Promise<GrievanceEntity | null> {
    const grievance = await spatialRepo.getGrievance(grievanceId);
    if (!grievance) return null;

    grievance.escalationLevel = (grievance.escalationLevel || 0) + 1;
    grievance.priorityScore = Math.min(100, grievance.priorityScore + 20);
    grievance.updatedAt = new Date().toISOString();

    // If escalation level is 2 or higher, add General Review / PCMC HQ as collaborating department
    if (grievance.escalationLevel >= 2) {
      if (!grievance.collaboratingDepartmentIds) grievance.collaboratingDepartmentIds = [];
      if (!grievance.collaboratingDepartmentIds.includes('dept-general-review')) {
        grievance.collaboratingDepartmentIds.push('dept-general-review');
      }
    }

    const auditEntry: ComplaintAuditEntry = {
      id: `aud-${Date.now()}-${uuidv4().substring(0, 4)}`,
      grievanceId: grievance.id,
      action: 'ESCALATED',
      performedBy,
      previousStatus: grievance.status,
      newStatus: grievance.status,
      reason: `Escalation Level ${grievance.escalationLevel}: ${reason}`,
      timestamp: new Date().toISOString(),
    };

    await spatialRepo.addComplaintAuditEntry(auditEntry);
    await spatialRepo.saveGrievance(grievance);

    return grievance;
  }

  /**
   * Creates an interdepartmental Work Order linked to a canonical grievance.
   */
  public static async createWorkOrder(
    grievanceId: string,
    departmentId: string,
    title: string,
    instructions: string,
    dueDate: string,
    operatorId?: string,
    priority: string = 'HIGH'
  ): Promise<WorkOrder | null> {
    const grievance = await spatialRepo.getGrievance(grievanceId);
    if (!grievance) return null;

    const dept = await spatialRepo.getDepartment(departmentId);
    let operatorName: string | undefined = undefined;
    if (operatorId && dept) {
      const op = dept.operators.find(o => o.id === operatorId);
      operatorName = op?.name;
    }

    const workOrder: WorkOrder = {
      id: `wo-${Date.now()}-${uuidv4().substring(0, 4)}`,
      grievanceId,
      departmentId,
      operatorId,
      operatorName,
      title,
      instructions,
      priority,
      status: 'DISPATCHED',
      dueDate,
      createdAt: new Date().toISOString(),
    };

    // Add collaborating department if not primary
    if (grievance.assignedDepartmentId !== departmentId) {
      if (!grievance.collaboratingDepartmentIds) grievance.collaboratingDepartmentIds = [];
      if (!grievance.collaboratingDepartmentIds.includes(departmentId)) {
        grievance.collaboratingDepartmentIds.push(departmentId);
      }
    }

    await spatialRepo.saveWorkOrder(workOrder);

    const auditEntry: ComplaintAuditEntry = {
      id: `aud-${Date.now()}-${uuidv4().substring(0, 4)}`,
      grievanceId,
      action: 'WORK_ORDER_CREATED',
      performedBy: 'Interdepartmental Work Order Coordinator',
      newDepartmentId: departmentId,
      reason: `Dispatched Work Order "${title}" to ${dept?.name || departmentId}.`,
      timestamp: new Date().toISOString(),
    };

    await spatialRepo.addComplaintAuditEntry(auditEntry);
    await spatialRepo.saveGrievance(grievance);

    return workOrder;
  }
}
