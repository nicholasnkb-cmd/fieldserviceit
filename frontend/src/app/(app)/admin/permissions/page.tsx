'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  Download,
  FileText,
  GitCompareArrows,
  Hourglass,
  KeyRound,
  Loader2,
  PlayCircle,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  TriangleAlert,
  UserCheck,
  Users,
  UserRoundSearch,
  X,
} from 'lucide-react';
import { api, getListData } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';
import { useToast } from '../../../../components/ui/Toast';

interface Permission {
  id: string;
  name: string;
  slug: string;
  group: string;
  description?: string | null;
}

interface RolePermission {
  permission: Permission;
}

interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isSystem: boolean;
  companyId?: string | null;
  permissions: RolePermission[];
  _count?: { userRoles: number };
  editable?: boolean;
  affectedUsers?: AffectedUser[];
}

type PermissionState = Record<string, Set<string>>;

interface AffectedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive?: boolean;
}

interface PermissionPreset {
  key: string;
  name: string;
  description: string;
  permissionSlugs: string[];
}

interface PermissionHistory {
  id: string;
  roleId: string;
  action: string;
  createdAt: string;
  actor?: { firstName: string; lastName: string; email: string } | null;
  diff?: { roleName?: string; added?: string[]; removed?: string[]; sourceRoleId?: string };
}

interface ChangeAnalysis {
  role: { id: string; name: string };
  criticalRemoved: string[];
  affectedUsers: AffectedUser[];
  requiresAcknowledgement: boolean;
  risks: { key: string; severity: string; message: string }[];
  missingDependencies?: { permission: string; dependency: string }[];
  impact?: { affectedUsers: number; activeSessions: number; scimManagedUsers: number; affectedServiceAccounts: number; risk: string };
}

interface GovernanceState {
  approvals: any[];
  temporaryGrants: any[];
  scopes: any[];
  reviews: any[];
  users: any[];
  alerts: any[];
  breakGlassAccounts?: any[];
  serviceAccounts?: any[];
  authorizationCoverage?: any;
  superAdminSupersedes?: boolean;
  advanced?: {
    elevations: any[];
    dualApprovals: any[];
    relationships: any[];
    impersonations: any[];
    scimTokens: any[];
    securityDestinations: any[];
    privilegeAnalytics: any;
    sensitiveActions: string[];
    contextualPolicies?: any[];
    scimGroupMappings?: any[];
    accessRequests?: any[];
    authorizationTests?: any[];
  };
}

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [assigned, setAssigned] = useState<PermissionState>({});
  const [baseline, setBaseline] = useState<PermissionState>({});
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scope, setScope] = useState<'PLATFORM' | 'TENANT'>('PLATFORM');
  const [presets, setPresets] = useState<PermissionPreset[]>([]);
  const [history, setHistory] = useState<PermissionHistory[]>([]);
  const [activeTool, setActiveTool] = useState<'PRESETS' | 'COMPARE' | 'USERS' | 'HISTORY' | 'CLONE' | 'GOVERNANCE' | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [compareRoleId, setCompareRoleId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [effectiveAccess, setEffectiveAccess] = useState<any>(null);
  const [loadingEffective, setLoadingEffective] = useState(false);
  const [cloneDraft, setCloneDraft] = useState({ name: '', slug: '', description: '' });
  const [governance, setGovernance] = useState<GovernanceState | null>(null);
  const [loadingGovernance, setLoadingGovernance] = useState(false);
  const [temporaryDraft, setTemporaryDraft] = useState({ userId: '', permissionSlug: '', expiresAt: '', reason: '', scopeType: 'ALL' });
  const [scopeDraft, setScopeDraft] = useState({ roleId: '', userId: '', permissionSlug: '', scopeType: 'ALL', scopeValues: '' });
  const [approvalReason, setApprovalReason] = useState('');
  const [simulation, setSimulation] = useState<any>(null);
  const [reviewDraft, setReviewDraft] = useState({ name: '', dueAt: '', cadence: '', reminderDays: 7 });
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [stepUpCode, setStepUpCode] = useState('');
  const [stepUpUntil, setStepUpUntil] = useState('');
  const [serviceAccountDraft, setServiceAccountDraft] = useState({ name: '', permissionSlugs: [] as string[], expiresAt: '', scopeType: 'ALL' });
  const [createdServiceToken, setCreatedServiceToken] = useState('');
  const [breakGlassDraft, setBreakGlassDraft] = useState({ userId: '', reason: '', approvalRequestId: '' });
  const [elevationDraft, setElevationDraft] = useState({ userId: '', permissionSlug: '', requestedMinutes: 60, reason: '', scopeType: 'ALL' });
  const [dualApprovalDraft, setDualApprovalDraft] = useState({ actionType: 'IMPERSONATE_USER', resourceType: 'USER', resourceId: '', reason: '' });
  const [relationshipDraft, setRelationshipDraft] = useState({ subjectType: 'USER', subjectId: '', relationName: 'viewer', resourceType: 'TICKET', resourceId: '', expiresAt: '' });
  const [impersonationDraft, setImpersonationDraft] = useState({ targetUserId: '', approvalRequestId: '', reason: '', minutes: 15 });
  const [scimDraft, setScimDraft] = useState({ name: 'Identity provider', companyId: '', expiresAt: '' });
  const [createdScimToken, setCreatedScimToken] = useState('');
  const [destinationDraft, setDestinationDraft] = useState({ name: '', endpointUrl: '', secret: '', minimumSeverity: 'warning', destinationType: 'WEBHOOK' });
  const [policyDraft, setPolicyDraft] = useState({ userId: '', permissionSlugs: [] as string[] });
  const [policyResult, setPolicyResult] = useState<any>(null);
  const [exportApprovalRequestId, setExportApprovalRequestId] = useState('');
  const [policyBundleText, setPolicyBundleText] = useState('');
  const [contextPolicyDraft, setContextPolicyDraft] = useState({ name: '', targetValue: '', effect: 'ALLOW', countries: '', ipAddresses: '', trustedDevice: false, requireMfa: false });
  const [groupMappingDraft, setGroupMappingDraft] = useState({ externalGroupId: '', externalGroupName: '', roleId: '', priority: 100 });
  const [authorizationTestDraft, setAuthorizationTestDraft] = useState({ name: '', principalType: 'ROLE', principalId: '', permissionSlug: '', expectedDecision: 'DENY' });
  const [authorizationTestResult, setAuthorizationTestResult] = useState<any>(null);
  const [pendingAnalyses, setPendingAnalyses] = useState<ChangeAnalysis[] | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'TENANT_ADMIN') {
      router.push('/dashboard');
      return;
    }

    api.get('/admin/permissions/workspace')
      .then((workspace) => {
        const nextPermissions = getListData<Permission>(workspace.permissions);
        const nextRoles = getListData<Role>(workspace.roles);
        const nextState = stateFromRoles(nextRoles);
        setPermissions(nextPermissions);
        setRoles(nextRoles);
        setScope(workspace.scope || 'PLATFORM');
        setPresets(workspace.presets || []);
        setHistory(workspace.history || []);
        setSelectedRoleId((current) => current || nextRoles[0]?.id || '');
        setCompareRoleId((current) => current || nextRoles[1]?.id || nextRoles[0]?.id || '');
        setTemporaryDraft((current) => ({ ...current, userId: current.userId || nextRoles.flatMap((role) => role.affectedUsers || [])[0]?.id || '', permissionSlug: current.permissionSlug || nextPermissions[0]?.slug || '' }));
        setScopeDraft((current) => ({ ...current, roleId: current.roleId || nextRoles[0]?.id || '', permissionSlug: current.permissionSlug || nextPermissions[0]?.slug || '' }));
        setAssigned(cloneState(nextState));
        setBaseline(cloneState(nextState));
        setError('');
      })
      .catch((err: any) => setError(err.message || 'Failed to load system permissions'))
      .finally(() => setLoading(false));
  }, [router, user]);

  const groups = useMemo(
    () => Array.from(new Set(permissions.map((permission) => permission.group || 'Other'))).sort(),
    [permissions],
  );

  const filteredPermissions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return permissions.filter((permission) => {
      const group = permission.group || 'Other';
      if (groupFilter !== 'ALL' && group !== groupFilter) return false;
      if (!normalizedQuery) return true;
      return [permission.name, permission.slug, permission.description, group]
        .some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
    });
  }, [groupFilter, permissions, query]);

  const groupedPermissions = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    filteredPermissions.forEach((permission) => {
      const group = permission.group || 'Other';
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(permission);
    });
    return grouped;
  }, [filteredPermissions]);

  const changedRoleIds = useMemo(
    () => roles.filter((role) => !setsEqual(assigned[role.id], baseline[role.id])).map((role) => role.id),
    [assigned, baseline, roles],
  );

  useEffect(() => {
    if (changedRoleIds.length === 0) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const protectLinks = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement)?.closest('a[href]');
      if (anchor && !window.confirm('Discard unsaved permission changes?')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', protectLinks, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', protectLinks, true);
    };
  }, [changedRoleIds.length]);

  const roleEditable = (roleId: string) => roles.find((role) => role.id === roleId)?.editable !== false;

  const togglePermission = (roleId: string, slug: string) => {
    if (!roleEditable(roleId)) return;
    setAssigned((current) => {
      const next = cloneState(current);
      const rolePermissions = next[roleId] || new Set<string>();
      rolePermissions.has(slug) ? rolePermissions.delete(slug) : rolePermissions.add(slug);
      next[roleId] = rolePermissions;
      return next;
    });
  };

  const setPermissionsForRole = (roleId: string, slugs: string[], enabled: boolean) => {
    if (!roleEditable(roleId)) return;
    setAssigned((current) => {
      const next = cloneState(current);
      const rolePermissions = next[roleId] || new Set<string>();
      slugs.forEach((slug) => enabled ? rolePermissions.add(slug) : rolePermissions.delete(slug));
      next[roleId] = rolePermissions;
      return next;
    });
  };

  const setPermissionForAllRoles = (slug: string, enabled: boolean) => {
    setAssigned((current) => {
      const next = cloneState(current);
      roles.forEach((role) => {
        if (role.editable === false) return;
        const rolePermissions = next[role.id] || new Set<string>();
        enabled ? rolePermissions.add(slug) : rolePermissions.delete(slug);
        next[role.id] = rolePermissions;
      });
      return next;
    });
  };

  const resetChanges = () => setAssigned(cloneState(baseline));

  const persistChanges = async (acknowledgeCriticalRemoval: boolean) => {
    if (changedRoleIds.length === 0) return;
    setSaving(true);
    setError('');
    try {
      const updatedRoles = await Promise.all(changedRoleIds.map((roleId) =>
        api.patch(`/admin/roles/${roleId}`, {
          permissionSlugs: Array.from(assigned[roleId] || []).sort(),
          acknowledgeCriticalRemoval,
        }),
      ));
      setRoles((current) => current.map((role) => updatedRoles.find((updated) => updated.id === role.id) || role));
      const nextBaseline = cloneState(assigned);
      setBaseline(nextBaseline);
      setPendingAnalyses(null);
      const workspace = await api.get('/admin/permissions/workspace');
      setHistory(workspace.history || []);
      toast('success', `${changedRoleIds.length} role${changedRoleIds.length === 1 ? '' : 's'} updated`);
    } catch (err: any) {
      setError(err.message || 'Failed to save permission changes');
      toast('error', err.message || 'Failed to save permission changes');
    } finally {
      setSaving(false);
    }
  };

  const saveChanges = async () => {
    if (changedRoleIds.length === 0) return;
    setSaving(true);
    setError('');
    try {
      const analyses = await Promise.all(changedRoleIds.map(async (roleId) => {
        const permissionSlugs = Array.from(assigned[roleId] || []).sort();
        const [analysis, impact] = await Promise.all([
          api.post(`/admin/roles/${roleId}/analyze-permissions`, { permissionSlugs }),
          api.post('/admin/permissions/impact-preview', { roleId, permissionSlugs }),
        ]);
        return { ...analysis, impact };
      }));
      if (analyses.some((analysis: ChangeAnalysis) => analysis.requiresAcknowledgement || analysis.risks.length > 0)) {
        setPendingAnalyses(analyses);
        setSaving(false);
        return;
      }
      setSaving(false);
      await persistChanges(false);
    } catch (err: any) {
      setSaving(false);
      setError(err.message || 'Failed to analyze permission changes');
    }
  };

  const applyPreset = (preset: PermissionPreset) => {
    if (!selectedRoleId || !roleEditable(selectedRoleId)) return;
    setAssigned((current) => ({ ...cloneState(current), [selectedRoleId]: new Set(preset.permissionSlugs) }));
  };

  const cloneRole = async () => {
    if (!selectedRoleId || !cloneDraft.name.trim() || !cloneDraft.slug.trim()) return;
    try {
      await api.post(`/admin/roles/${selectedRoleId}/clone`, cloneDraft);
      const workspace = await api.get('/admin/permissions/workspace');
      const nextRoles = getListData<Role>(workspace.roles);
      const nextState = stateFromRoles(nextRoles);
      setRoles(nextRoles);
      setAssigned(cloneState(nextState));
      setBaseline(cloneState(nextState));
      setHistory(workspace.history || []);
      setCloneDraft({ name: '', slug: '', description: '' });
      toast('success', 'Role cloned');
    } catch (err: any) {
      toast('error', err.message || 'Failed to clone role');
    }
  };

  const loadEffectiveAccess = async (userId: string) => {
    setSelectedUserId(userId);
    setEffectiveAccess(null);
    if (!userId) return;
    setLoadingEffective(true);
    try {
      setEffectiveAccess(await api.get(`/admin/permissions/users/${userId}/effective`));
    } catch (err: any) {
      toast('error', err.message || 'Failed to load effective permissions');
    } finally {
      setLoadingEffective(false);
    }
  };

  const loadGovernance = async () => {
    setLoadingGovernance(true);
    try {
      setGovernance(await api.get('/admin/permissions/governance'));
    } catch (err: any) {
      toast('error', err.message || 'Failed to load permission governance');
    } finally {
      setLoadingGovernance(false);
    }
  };

  const openTool = (key: typeof activeTool) => {
    setActiveTool((current) => {
      const next = current === key ? null : key;
      if (next === 'GOVERNANCE' && !governance) loadGovernance();
      return next;
    });
  };

  const requestApproval = async () => {
    if (!selectedRoleId) return;
    await api.post('/admin/permissions/approvals', {
      roleId: selectedRoleId,
      permissionSlugs: Array.from(assigned[selectedRoleId] || []).sort(),
      reason: approvalReason || 'Permission change review',
    });
    setApprovalReason('');
    await loadGovernance();
    toast('success', 'Approval requested');
  };

  const reviewApproval = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    await api.post(`/admin/permissions/approvals/${id}/review`, { decision });
    await loadGovernance();
    const workspace = await api.get('/admin/permissions/workspace');
    const nextRoles = getListData<Role>(workspace.roles);
    const nextState = stateFromRoles(nextRoles);
    setRoles(nextRoles);
    setAssigned(cloneState(nextState));
    setBaseline(cloneState(nextState));
    toast('success', decision === 'APPROVED' ? 'Approval applied' : 'Approval rejected');
  };

  const createTemporaryGrant = async () => {
    await api.post('/admin/permissions/temporary-grants', temporaryDraft);
    await loadGovernance();
    toast('success', 'Temporary access granted');
  };

  const createScope = async () => {
    await api.post('/admin/permissions/scopes', {
      ...scopeDraft,
      roleId: scopeDraft.userId ? undefined : scopeDraft.roleId,
      userId: scopeDraft.userId || undefined,
      scopeValues: scopeDraft.scopeValues.split(',').map((value) => value.trim()).filter(Boolean),
    });
    setScopeDraft((current) => ({ ...current, scopeValues: '' }));
    await loadGovernance();
    toast('success', 'Scope saved');
  };

  const simulateUser = async (userId: string) => {
    setSimulation(null);
    if (!userId) return;
    setSimulation(await api.get(`/admin/permissions/users/${userId}/simulate`));
  };

  const createReview = async () => {
    await api.post('/admin/permissions/access-reviews', reviewDraft);
    setReviewDraft({ name: '', dueAt: '', cadence: '', reminderDays: 7 });
    await loadGovernance();
    toast('success', 'Access review started');
  };

  const openReview = async (id: string) => setSelectedReview(await api.get(`/admin/permissions/access-reviews/${id}`));

  const decideReviewItem = async (itemId: string, decision: 'CERTIFIED' | 'REVOKE') => {
    await api.patch(`/admin/permissions/access-reviews/${selectedReview.id}/items/${itemId}`, { decision });
    await openReview(selectedReview.id);
    await loadGovernance();
  };

  const downloadReview = async (id: string, format: 'csv' | 'pdf') => {
    const result = await api.get(`/admin/permissions/access-reviews/${id}/export?format=${format}&approvalRequestId=${encodeURIComponent(exportApprovalRequestId)}`);
    const bytes = Uint8Array.from(atob(result.contentBase64), (char) => char.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: result.mimeType }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = result.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const verifyStepUp = async () => {
    const result = await api.post('/auth/step-up', { code: stepUpCode });
    setStepUpCode('');
    setStepUpUntil(result.expiresAt);
    toast('success', 'Sensitive actions unlocked for 10 minutes');
  };

  const createServiceAccount = async () => {
    const result = await api.post('/admin/permissions/service-accounts', serviceAccountDraft);
    setCreatedServiceToken(result.token);
    setServiceAccountDraft({ name: '', permissionSlugs: [], expiresAt: '', scopeType: 'ALL' });
    await loadGovernance();
    toast('success', 'Service account created');
  };

  const setBreakGlass = async (enabled: boolean) => {
    if (!breakGlassDraft.userId) return;
    await api.post(`/admin/permissions/break-glass/${breakGlassDraft.userId}`, {
      enabled,
      reason: breakGlassDraft.reason,
      approvalRequestId: breakGlassDraft.approvalRequestId,
    });
    await loadGovernance();
    toast('success', enabled ? 'Break-glass account enabled' : 'Break-glass account disabled');
  };

  const requestElevation = async () => {
    await api.post('/admin/permissions/elevations', elevationDraft);
    await loadGovernance();
    toast('success', 'JIT elevation sent for approval');
  };

  const reviewElevation = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    await api.post(`/admin/permissions/elevations/${id}/review`, { decision });
    await loadGovernance();
  };

  const requestDualApproval = async () => {
    await api.post('/admin/permissions/dual-approvals', dualApprovalDraft);
    await loadGovernance();
    toast('success', 'Two-person approval requested');
  };

  const reviewDualApproval = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    await api.post(`/admin/permissions/dual-approvals/${id}/review`, { decision });
    await loadGovernance();
  };

  const createRelationship = async () => {
    await api.post('/admin/permissions/relationships', relationshipDraft);
    await loadGovernance();
    toast('success', 'Authorization relationship saved');
  };

  const startImpersonation = async () => {
    const result = await api.post('/admin/permissions/impersonation/start', impersonationDraft);
    localStorage.setItem('fsit.impersonationSession', result.id);
    localStorage.setItem('fsit.impersonationTarget', JSON.stringify({ ...result.target, expiresAt: result.expiresAt }));
    toast('success', `Impersonating ${result.target.email}`);
    window.location.assign('/dashboard');
  };

  const createScimToken = async () => {
    const result = await api.post('/admin/permissions/scim-tokens', scimDraft);
    setCreatedScimToken(result.token);
    await loadGovernance();
  };

  const createDestination = async () => {
    await api.post('/admin/permissions/security-destinations', destinationDraft);
    setDestinationDraft({ name: '', endpointUrl: '', secret: '', minimumSeverity: 'warning', destinationType: 'WEBHOOK' });
    await loadGovernance();
  };

  const simulatePolicy = async () => {
    setPolicyResult(await api.post('/admin/permissions/policy-simulations', {
      ...policyDraft,
      checks: [
        { permissionSlug: 'tickets.view', requiredScope: 'ALL', resource: 'Ticket list' },
        { permissionSlug: 'tickets.export', requiredScope: 'ALL', resource: 'Ticket export' },
        { permissionSlug: 'billing.approve', requiredScope: 'ALL', resource: 'Invoice approval' },
      ],
    }));
  };

  const exportPolicyBundle = async () => {
    const result = await api.get('/admin/permissions/policy-bundle');
    const blob = new Blob([JSON.stringify(result.bundle, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = result.filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importPolicyBundle = async () => {
    await api.post('/admin/permissions/policy-bundle', { bundle: JSON.parse(policyBundleText) });
    setPolicyBundleText('');
    await loadGovernance();
    toast('success', 'Policy bundle imported');
  };

  const createContextPolicy = async () => {
    await api.post('/admin/permissions/contextual-policies', {
      name: contextPolicyDraft.name,
      targetType: 'PERMISSION',
      targetValue: contextPolicyDraft.targetValue,
      effect: contextPolicyDraft.effect,
      conditions: {
        countries: contextPolicyDraft.countries.split(',').map((item) => item.trim()).filter(Boolean),
        ipAddresses: contextPolicyDraft.ipAddresses.split(',').map((item) => item.trim()).filter(Boolean),
        trustedDevice: contextPolicyDraft.trustedDevice,
        requireMfa: contextPolicyDraft.requireMfa,
      },
    });
    setContextPolicyDraft({ name: '', targetValue: '', effect: 'ALLOW', countries: '', ipAddresses: '', trustedDevice: false, requireMfa: false });
    await loadGovernance();
  };

  const createGroupMapping = async () => {
    await api.post('/admin/permissions/scim-group-mappings', groupMappingDraft);
    setGroupMappingDraft({ externalGroupId: '', externalGroupName: '', roleId: '', priority: 100 });
    await loadGovernance();
  };

  const createAuthorizationTest = async () => {
    await api.post('/admin/permissions/authorization-tests', authorizationTestDraft);
    setAuthorizationTestDraft({ name: '', principalType: 'ROLE', principalId: '', permissionSlug: '', expectedDecision: 'DENY' });
    await loadGovernance();
  };

  const runAuthorizationTests = async () => {
    setAuthorizationTestResult(await api.post('/admin/permissions/authorization-tests/run', {}));
  };

  const downloadEvidencePack = async () => {
    const result = await api.get('/admin/permissions/evidence-pack');
    const bytes = Uint8Array.from(atob(result.contentBase64), (character) => character.charCodeAt(0));
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([bytes], { type: result.mimeType }));
    link.download = result.filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const compareRole = roles.find((role) => role.id === compareRoleId);
  const allAffectedUsers = Array.from(new Map(
    roles.flatMap((role) => role.affectedUsers || []).map((item) => [item.id, item]),
  ).values());

  const toggleGroup = (group: string) => {
    setCollapsedGroups((current) => {
      const next = new Set(current);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading permissions...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-7">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">Platform administration</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-950">System permissions</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Control which capabilities each role receives. {scope === 'TENANT' ? 'System roles are read-only; tenant-owned roles can be changed.' : 'Changes apply to every user assigned to that role.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetChanges}
            disabled={changedRoleIds.length === 0 || saving}
            title="Discard unsaved changes"
            className="inline-flex h-10 items-center gap-2 border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={saveChanges}
            disabled={changedRoleIds.length === 0 || saving}
            className="inline-flex h-10 items-center gap-2 bg-gray-950 px-4 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : `Save${changedRoleIds.length ? ` (${changedRoleIds.length})` : ''}`}
          </button>
        </div>
      </header>

      {error && (
        <div className="mt-5 flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <section className="mt-5 grid gap-4 border-b border-gray-200 pb-5 sm:grid-cols-3">
        <Stat icon={KeyRound} label="Permissions" value={permissions.length} />
        <Stat icon={ShieldCheck} label="Roles" value={roles.length} />
        <Stat icon={Users} label="Users covered" value={roles.reduce((total, role) => total + Number(role._count?.userRoles || 0), 0)} />
      </section>

      <section className="mt-5 flex flex-wrap gap-2">
        {[
          ['PRESETS', 'Presets', ShieldCheck],
          ['COMPARE', 'Compare', GitCompareArrows],
          ['USERS', 'Effective access', UserRoundSearch],
          ['HISTORY', 'History', Clock3],
          ['CLONE', 'Clone role', Copy],
          ['GOVERNANCE', 'Governance', UserCheck],
        ].map(([key, label, Icon]: any) => (
          <button
            key={key}
            type="button"
            onClick={() => openTool(key)}
            className={`inline-flex h-9 items-center gap-2 border px-3 text-sm font-semibold ${activeTool === key ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </section>

      {activeTool && (
        <section className="mt-4 border border-gray-200 bg-white p-4">
          {(activeTool === 'PRESETS' || activeTool === 'COMPARE' || activeTool === 'CLONE') && (
            <label className="block max-w-sm text-sm font-semibold text-gray-700">
              Role
              <select value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)} className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-sm">
                {roles.map((role) => <option key={role.id} value={role.id}>{role.name}{role.editable === false ? ' (read-only)' : ''}</option>)}
              </select>
            </label>
          )}
          {selectedRole?.affectedUsers && selectedRole.affectedUsers.length > 0 && (activeTool === 'PRESETS' || activeTool === 'COMPARE' || activeTool === 'CLONE') && (
            <p className="mt-2 text-xs text-gray-500">
              Affects {selectedRole.affectedUsers.length} user{selectedRole.affectedUsers.length === 1 ? '' : 's'}: {selectedRole.affectedUsers.map((item) => `${item.firstName} ${item.lastName}`).join(', ')}
            </p>
          )}

          {activeTool === 'PRESETS' && (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {presets.map((preset) => (
                <div key={preset.key} className="border border-gray-200 p-3">
                  <h2 className="font-semibold text-gray-950">{preset.name}</h2>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{preset.description}</p>
                  <p className="mt-2 text-xs font-medium text-gray-600">{preset.permissionSlugs.length} permissions</p>
                  <button type="button" disabled={!selectedRole?.editable} onClick={() => applyPreset(preset)} className="mt-3 border border-gray-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Apply preset</button>
                </div>
              ))}
            </div>
          )}

          {activeTool === 'COMPARE' && selectedRole && (
            <div className="mt-4">
              <label className="block max-w-sm text-sm font-semibold text-gray-700">
                Compare with
                <select value={compareRoleId} onChange={(event) => setCompareRoleId(event.target.value)} className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-sm">
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </label>
              {compareRole && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <PermissionDiff title={`Only ${selectedRole.name}`} slugs={[...(assigned[selectedRole.id] || [])].filter((slug) => !assigned[compareRole.id]?.has(slug))} />
                  <PermissionDiff title={`Only ${compareRole.name}`} slugs={[...(assigned[compareRole.id] || [])].filter((slug) => !assigned[selectedRole.id]?.has(slug))} />
                </div>
              )}
            </div>
          )}

          {activeTool === 'USERS' && (
            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
              <label className="text-sm font-semibold text-gray-700">
                User
                <select value={selectedUserId} onChange={(event) => loadEffectiveAccess(event.target.value)} className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-sm">
                  <option value="">Select user...</option>
                  {allAffectedUsers.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} - {item.email}</option>)}
                </select>
              </label>
              <div>
                {loadingEffective && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Loading effective access...</div>}
                {effectiveAccess && (
                  <>
                    <p className="text-sm font-semibold text-gray-900">{effectiveAccess.user.firstName} {effectiveAccess.user.lastName}</p>
                    <p className="mt-1 text-xs text-gray-500">Roles: {effectiveAccess.roles.map((role: any) => role.name).join(', ') || 'None'}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {effectiveAccess.permissions.map((entry: any) => (
                        <div key={entry.permission.slug} className="border border-gray-200 p-2 text-xs">
                          <div className="font-semibold text-gray-900">{entry.permission.name}</div>
                          <code className="text-gray-500">{entry.permission.slug}</code>
                          <div className="mt-1 text-gray-500">via {entry.roles.join(', ')}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTool === 'HISTORY' && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500"><th className="pb-2">Time</th><th className="pb-2">Actor</th><th className="pb-2">Role</th><th className="pb-2">Added</th><th className="pb-2">Removed</th></tr></thead>
                <tbody>{history.map((entry) => <tr key={entry.id} className="border-b border-gray-100"><td className="py-2 pr-3">{new Date(entry.createdAt).toLocaleString()}</td><td className="py-2 pr-3">{entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : 'System'}</td><td className="py-2 pr-3">{entry.diff?.roleName || roles.find((role) => role.id === entry.roleId)?.name || entry.roleId}</td><td className="py-2 pr-3 text-emerald-700">{entry.diff?.added?.join(', ') || '-'}</td><td className="py-2 text-red-700">{entry.diff?.removed?.join(', ') || '-'}</td></tr>)}</tbody>
              </table>
              {history.length === 0 && <p className="py-6 text-center text-sm text-gray-500">No permission changes recorded yet.</p>}
            </div>
          )}

          {activeTool === 'CLONE' && (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input value={cloneDraft.name} onChange={(event) => setCloneDraft((current) => ({ ...current, name: event.target.value }))} placeholder="New role name" className="h-10 border border-gray-300 px-3 text-sm" />
              <input value={cloneDraft.slug} onChange={(event) => setCloneDraft((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))} placeholder="role-slug" className="h-10 border border-gray-300 px-3 text-sm" />
              <button type="button" onClick={cloneRole} disabled={!cloneDraft.name || !cloneDraft.slug} className="h-10 bg-gray-950 px-4 text-sm font-semibold text-white disabled:bg-gray-300">Clone selected role</button>
              <input value={cloneDraft.description} onChange={(event) => setCloneDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Description (optional)" className="h-10 border border-gray-300 px-3 text-sm md:col-span-3" />
            </div>
          )}

          {activeTool === 'GOVERNANCE' && (
            <div>
              {loadingGovernance && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Loading governance controls...</div>}
              {governance && (
                <div className="space-y-6">
                  <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-950">Super admin recovery is enforced</p>
                      <p className="mt-1 text-xs text-emerald-800">Super admins supersede role permissions, and the final active super admin cannot be demoted, disabled, deleted, or stripped of recovery access.</p>
                    </div>
                  </div>

                  <div className="grid gap-3 border border-amber-200 bg-amber-50 p-3 md:grid-cols-[1fr_auto] md:items-end">
                    <label className="text-sm font-semibold text-amber-950">
                      Verify MFA for sensitive actions
                      <input value={stepUpCode} onChange={(event) => setStepUpCode(event.target.value)} placeholder="Authenticator or recovery code" className="mt-1 h-10 w-full border border-amber-300 bg-white px-3 text-sm" />
                    </label>
                    <button type="button" onClick={verifyStepUp} disabled={!stepUpCode} className="h-10 bg-amber-900 px-4 text-sm font-semibold text-white disabled:bg-amber-300">Verify MFA</button>
                    {stepUpUntil && <p className="text-xs text-amber-800 md:col-span-2">Step-up verified until {new Date(stepUpUntil).toLocaleTimeString()}.</p>}
                  </div>

                  <div className="grid gap-5 xl:grid-cols-2">
                    <GovernanceBlock icon={UserCheck} title="Approval workflow" description="Send the selected role's pending matrix changes to a second administrator.">
                      <select value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)} className="h-10 w-full border border-gray-300 bg-white px-3 text-sm">
                        {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                      </select>
                      <input value={approvalReason} onChange={(event) => setApprovalReason(event.target.value)} placeholder="Reason for this access change" className="h-10 w-full border border-gray-300 px-3 text-sm" />
                      <button type="button" onClick={requestApproval} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white">Request approval</button>
                      <div className="mt-3 space-y-2">
                        {governance.approvals.slice(0, 6).map((approval) => (
                          <div key={approval.id} className="border border-gray-200 p-2 text-xs">
                            <div className="flex items-center justify-between gap-2"><strong>{approval.roleName}</strong><span>{approval.status}</span></div>
                            <p className="mt-1 text-gray-500">{approval.reason || 'No reason provided'}</p>
                            {approval.status === 'PENDING' && (
                              <div className="mt-2 flex gap-2">
                                <button type="button" onClick={() => reviewApproval(approval.id, 'APPROVED')} className="border border-emerald-300 px-2 py-1 font-semibold text-emerald-800">Approve</button>
                                <button type="button" onClick={() => reviewApproval(approval.id, 'REJECTED')} className="border border-red-300 px-2 py-1 font-semibold text-red-700">Reject</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </GovernanceBlock>

                    <GovernanceBlock icon={Hourglass} title="Temporary permission" description="Grant a user one permission until a fixed expiration time.">
                      <select value={temporaryDraft.userId} onChange={(event) => setTemporaryDraft((current) => ({ ...current, userId: event.target.value }))} className="h-10 w-full border border-gray-300 bg-white px-3 text-sm">
                        <option value="">Select user...</option>
                        {governance.users.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} - {item.email}</option>)}
                      </select>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select value={temporaryDraft.permissionSlug} onChange={(event) => setTemporaryDraft((current) => ({ ...current, permissionSlug: event.target.value }))} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                          {permissions.map((permission) => <option key={permission.slug} value={permission.slug}>{permission.name}</option>)}
                        </select>
                        <input type="datetime-local" value={temporaryDraft.expiresAt} onChange={(event) => setTemporaryDraft((current) => ({ ...current, expiresAt: event.target.value }))} className="h-10 border border-gray-300 px-3 text-sm" />
                      </div>
                      <input value={temporaryDraft.reason} onChange={(event) => setTemporaryDraft((current) => ({ ...current, reason: event.target.value }))} placeholder="Business reason" className="h-10 w-full border border-gray-300 px-3 text-sm" />
                      <button type="button" disabled={!temporaryDraft.userId || !temporaryDraft.expiresAt} onClick={createTemporaryGrant} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white disabled:bg-gray-300">Grant temporarily</button>
                      <div className="mt-3 space-y-2">
                        {governance.temporaryGrants.filter((grant) => !grant.revokedAt && new Date(grant.expiresAt) > new Date()).slice(0, 6).map((grant) => (
                          <div key={grant.id} className="flex items-center justify-between gap-3 border border-gray-200 p-2 text-xs">
                            <span><strong>{grant.firstName} {grant.lastName}</strong><br />{grant.permissionSlug} until {new Date(grant.expiresAt).toLocaleString()}</span>
                            <button type="button" onClick={async () => { await api.delete(`/admin/permissions/temporary-grants/${grant.id}`); await loadGovernance(); }} className="font-semibold text-red-700">Revoke</button>
                          </div>
                        ))}
                      </div>
                    </GovernanceBlock>

                    <GovernanceBlock icon={KeyRound} title="Permission scope" description="Limit a role or individual to assigned, department, location, or customer records.">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select value={scopeDraft.roleId} onChange={(event) => setScopeDraft((current) => ({ ...current, roleId: event.target.value, userId: '' }))} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                          {roles.map((role) => <option key={role.id} value={role.id}>Role: {role.name}</option>)}
                        </select>
                        <select value={scopeDraft.userId} onChange={(event) => setScopeDraft((current) => ({ ...current, userId: event.target.value }))} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                          <option value="">Apply to role</option>
                          {governance.users.map((item) => <option key={item.id} value={item.id}>User: {item.firstName} {item.lastName}</option>)}
                        </select>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select value={scopeDraft.permissionSlug} onChange={(event) => setScopeDraft((current) => ({ ...current, permissionSlug: event.target.value }))} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                          {permissions.map((permission) => <option key={permission.slug} value={permission.slug}>{permission.name}</option>)}
                        </select>
                        <select value={scopeDraft.scopeType} onChange={(event) => setScopeDraft((current) => ({ ...current, scopeType: event.target.value }))} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                          {['ALL', 'ASSIGNED', 'DEPARTMENT', 'LOCATION', 'CUSTOMERS', 'RELATIONSHIP'].map((value) => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </div>
                      <input value={scopeDraft.scopeValues} onChange={(event) => setScopeDraft((current) => ({ ...current, scopeValues: event.target.value }))} placeholder="Values, comma separated" className="h-10 w-full border border-gray-300 px-3 text-sm" />
                      <button type="button" onClick={createScope} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white">Add scope</button>
                      <div className="mt-3 space-y-2">
                        {governance.scopes.slice(0, 6).map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 border border-gray-200 p-2 text-xs">
                            <span><strong>{item.roleName || `${item.firstName} ${item.lastName}`}</strong><br />{item.permissionSlug}: {item.scopeType}</span>
                            <button type="button" onClick={async () => { await api.delete(`/admin/permissions/scopes/${item.id}`); await loadGovernance(); }} className="font-semibold text-red-700">Remove</button>
                          </div>
                        ))}
                      </div>
                    </GovernanceBlock>

                    <GovernanceBlock icon={PlayCircle} title="Simulate as user" description="Preview effective access without impersonation or issuing a session.">
                      <select onChange={(event) => simulateUser(event.target.value)} className="h-10 w-full border border-gray-300 bg-white px-3 text-sm" defaultValue="">
                        <option value="">Select user...</option>
                        {governance.users.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} - {item.role}</option>)}
                      </select>
                      {simulation && (
                        <div className="border border-gray-200 p-3 text-xs">
                          <p className="font-semibold text-gray-950">{simulation.user.firstName} {simulation.user.lastName}</p>
                          {simulation.supersededBySuperAdmin && <p className="mt-1 font-semibold text-emerald-700">SUPER_ADMIN override grants every permission.</p>}
                          <p className="mt-2 text-gray-600">Modules: {simulation.visibleModules.join(', ') || 'None'}</p>
                          <p className="mt-1 text-gray-600">{simulation.permissions.length} effective permissions, {simulation.temporaryGrants.length} temporary grants</p>
                        </div>
                      )}
                    </GovernanceBlock>

                    <GovernanceBlock icon={Hourglass} title="Just-in-time elevation" description="Request short-lived access with independent approval and automatic expiration.">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select value={elevationDraft.userId} onChange={(event) => setElevationDraft((current) => ({ ...current, userId: event.target.value }))} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                          <option value="">Select user...</option>
                          {governance.users.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}
                        </select>
                        <select value={elevationDraft.permissionSlug} onChange={(event) => setElevationDraft((current) => ({ ...current, permissionSlug: event.target.value }))} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                          <option value="">Select permission...</option>
                          {permissions.map((permission) => <option key={permission.slug} value={permission.slug}>{permission.name}</option>)}
                        </select>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                        <input value={elevationDraft.reason} onChange={(event) => setElevationDraft((current) => ({ ...current, reason: event.target.value }))} placeholder="Business reason" className="h-10 border border-gray-300 px-3 text-sm" />
                        <input type="number" min="5" max="480" value={elevationDraft.requestedMinutes} onChange={(event) => setElevationDraft((current) => ({ ...current, requestedMinutes: Number(event.target.value) }))} className="h-10 border border-gray-300 px-3 text-sm" />
                      </div>
                      <button type="button" disabled={!elevationDraft.userId || !elevationDraft.permissionSlug || !elevationDraft.reason} onClick={requestElevation} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white disabled:bg-gray-300">Request elevation</button>
                      <div className="space-y-2">
                        {(governance.advanced?.elevations || []).slice(0, 6).map((item) => (
                          <div key={item.id} className="border border-gray-200 p-2 text-xs">
                            <div className="flex justify-between gap-2"><strong>{item.firstName} {item.lastName}</strong><span>{item.status}</span></div>
                            <p className="text-gray-500">{item.permissionSlug} for {item.requestedMinutes} minutes</p>
                            {item.status === 'PENDING' && <div className="mt-2 flex gap-2"><button type="button" onClick={() => reviewElevation(item.id, 'APPROVED')} className="font-semibold text-emerald-700">Approve</button><button type="button" onClick={() => reviewElevation(item.id, 'REJECTED')} className="font-semibold text-red-700">Reject</button></div>}
                          </div>
                        ))}
                      </div>
                    </GovernanceBlock>

                    <GovernanceBlock icon={UserCheck} title="Two-person authorization" description="Require two administrators for destructive and high-trust actions.">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select value={dualApprovalDraft.actionType} onChange={(event) => setDualApprovalDraft((current) => ({ ...current, actionType: event.target.value }))} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                          {(governance.advanced?.sensitiveActions || []).map((action) => <option key={action}>{action.replaceAll('_', ' ')}</option>)}
                        </select>
                        <input value={dualApprovalDraft.resourceId} onChange={(event) => setDualApprovalDraft((current) => ({ ...current, resourceId: event.target.value }))} placeholder="Target user, tenant, or review ID" className="h-10 border border-gray-300 px-3 text-sm" />
                      </div>
                      <input value={dualApprovalDraft.reason} onChange={(event) => setDualApprovalDraft((current) => ({ ...current, reason: event.target.value }))} placeholder="Reason and expected outcome" className="h-10 w-full border border-gray-300 px-3 text-sm" />
                      <button type="button" disabled={!dualApprovalDraft.resourceId || !dualApprovalDraft.reason} onClick={requestDualApproval} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white disabled:bg-gray-300">Request two approvals</button>
                      <div className="space-y-2">
                        {(governance.advanced?.dualApprovals || []).slice(0, 8).map((item) => (
                          <div key={item.id} className="border border-gray-200 p-2 text-xs">
                            <div className="flex justify-between gap-2"><strong>{item.actionType.replaceAll('_', ' ')}</strong><span>{item.status}</span></div>
                            <p className="break-all text-gray-500">{item.resourceId} · request {item.id}</p>
                            {['PENDING', 'FIRST_APPROVED'].includes(item.status) && <div className="mt-2 flex gap-2"><button type="button" onClick={() => reviewDualApproval(item.id, 'APPROVED')} className="font-semibold text-emerald-700">Approve</button><button type="button" onClick={() => reviewDualApproval(item.id, 'REJECTED')} className="font-semibold text-red-700">Reject</button></div>}
                          </div>
                        ))}
                      </div>
                    </GovernanceBlock>

                    <GovernanceBlock icon={GitCompareArrows} title="Resource relationships" description="Grant viewer, editor, owner, or technician relationships to individual resources.">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select value={relationshipDraft.subjectId} onChange={(event) => setRelationshipDraft((current) => ({ ...current, subjectId: event.target.value }))} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                          <option value="">Select user...</option>
                          {governance.users.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}
                        </select>
                        <select value={relationshipDraft.relationName} onChange={(event) => setRelationshipDraft((current) => ({ ...current, relationName: event.target.value }))} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                          {['viewer', 'editor', 'owner', 'technician'].map((value) => <option key={value}>{value}</option>)}
                        </select>
                        <select value={relationshipDraft.resourceType} onChange={(event) => setRelationshipDraft((current) => ({ ...current, resourceType: event.target.value }))} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                          {['TICKET', 'COMPANY', 'ASSET', 'REPORT'].map((value) => <option key={value}>{value}</option>)}
                        </select>
                        <input value={relationshipDraft.resourceId} onChange={(event) => setRelationshipDraft((current) => ({ ...current, resourceId: event.target.value }))} placeholder="Resource ID" className="h-10 border border-gray-300 px-3 text-sm" />
                      </div>
                      <button type="button" disabled={!relationshipDraft.subjectId || !relationshipDraft.resourceId} onClick={createRelationship} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white disabled:bg-gray-300">Add relationship</button>
                      <div className="space-y-2">{(governance.advanced?.relationships || []).slice(0, 8).map((item) => <div key={item.id} className="flex justify-between gap-3 border border-gray-200 p-2 text-xs"><span>{item.subjectType}:{item.subjectId}<br /><strong>{item.relationName}</strong> on {item.resourceType}:{item.resourceId}</span><button type="button" onClick={async () => { await api.delete(`/admin/permissions/relationships/${item.id}`); await loadGovernance(); }} className="font-semibold text-red-700">Remove</button></div>)}</div>
                    </GovernanceBlock>

                    <GovernanceBlock icon={UserRoundSearch} title="Controlled impersonation" description="Start a visible, time-limited support session backed by an approved request.">
                      <select value={impersonationDraft.targetUserId} onChange={(event) => setImpersonationDraft((current) => ({ ...current, targetUserId: event.target.value }))} className="h-10 w-full border border-gray-300 bg-white px-3 text-sm">
                        <option value="">Select target user...</option>
                        {governance.users.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} - {item.email}</option>)}
                      </select>
                      <input value={impersonationDraft.approvalRequestId} onChange={(event) => setImpersonationDraft((current) => ({ ...current, approvalRequestId: event.target.value }))} placeholder="Approved two-person request ID" className="h-10 w-full border border-gray-300 px-3 text-sm" />
                      <input value={impersonationDraft.reason} onChange={(event) => setImpersonationDraft((current) => ({ ...current, reason: event.target.value }))} placeholder="Support reason" className="h-10 w-full border border-gray-300 px-3 text-sm" />
                      <button type="button" disabled={!impersonationDraft.targetUserId || !impersonationDraft.approvalRequestId} onClick={startImpersonation} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white disabled:bg-gray-300">Start impersonation</button>
                    </GovernanceBlock>

                    <GovernanceBlock icon={PlayCircle} title="Proposed policy test" description="Evaluate important workflows before publishing a role or permission change.">
                      <select value={policyDraft.userId} onChange={(event) => setPolicyDraft((current) => ({ ...current, userId: event.target.value }))} className="h-10 w-full border border-gray-300 bg-white px-3 text-sm">
                        <option value="">Select test user...</option>
                        {governance.users.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}
                      </select>
                      <div className="max-h-36 overflow-y-auto border border-gray-200 p-2">{permissions.map((permission) => <label key={permission.slug} className="flex gap-2 py-1 text-xs"><input type="checkbox" checked={policyDraft.permissionSlugs.includes(permission.slug)} onChange={(event) => setPolicyDraft((current) => ({ ...current, permissionSlugs: event.target.checked ? [...current.permissionSlugs, permission.slug] : current.permissionSlugs.filter((slug) => slug !== permission.slug) }))} />{permission.name}</label>)}</div>
                      <button type="button" disabled={!policyDraft.userId} onClick={simulatePolicy} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white disabled:bg-gray-300">Run policy test</button>
                      {policyResult && <div className="border border-gray-200 p-2 text-xs"><strong>{policyResult.allowed} allowed · {policyResult.denied} denied</strong>{policyResult.checks.map((check: any) => <p key={check.resource} className={check.allowed ? 'text-emerald-700' : 'text-red-700'}>{check.resource}: {check.reason}</p>)}</div>}
                    </GovernanceBlock>

                    <GovernanceBlock icon={KeyRound} title="SCIM provisioning" description="Issue tenant-scoped tokens for Entra ID, Okta, or another RFC 7644 client.">
                      <input value={scimDraft.name} onChange={(event) => setScimDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Provider name" className="h-10 w-full border border-gray-300 px-3 text-sm" />
                      <input type="date" value={scimDraft.expiresAt} onChange={(event) => setScimDraft((current) => ({ ...current, expiresAt: event.target.value }))} className="h-10 w-full border border-gray-300 px-3 text-sm" />
                      <button type="button" onClick={createScimToken} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white">Create SCIM token</button>
                      {createdScimToken && <div className="border border-red-200 bg-red-50 p-2 text-xs"><strong>Shown once</strong><code className="mt-1 block break-all">{createdScimToken}</code><p className="mt-1">Base URL: /v1/scim/v2</p></div>}
                      {(governance.advanced?.scimTokens || []).slice(0, 5).map((item) => <div key={item.id} className="flex justify-between border border-gray-200 p-2 text-xs"><span><strong>{item.name}</strong><br />Last used {item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleString() : 'never'}</span>{item.isActive && <button type="button" onClick={async () => { await api.delete(`/admin/permissions/scim-tokens/${item.id}`); await loadGovernance(); }} className="font-semibold text-red-700">Revoke</button>}</div>)}
                    </GovernanceBlock>

                    <GovernanceBlock icon={TriangleAlert} title="Security event streaming" description="Send signed permission and privileged-access events to a webhook or SIEM collector.">
                      <input value={destinationDraft.name} onChange={(event) => setDestinationDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Destination name" className="h-10 w-full border border-gray-300 px-3 text-sm" />
                      <input value={destinationDraft.endpointUrl} onChange={(event) => setDestinationDraft((current) => ({ ...current, endpointUrl: event.target.value }))} placeholder="https://collector.example/events" className="h-10 w-full border border-gray-300 px-3 text-sm" />
                      <input type="password" value={destinationDraft.secret} onChange={(event) => setDestinationDraft((current) => ({ ...current, secret: event.target.value }))} placeholder="Signing secret" className="h-10 w-full border border-gray-300 px-3 text-sm" />
                      <button type="button" disabled={!destinationDraft.name || !destinationDraft.endpointUrl} onClick={createDestination} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white disabled:bg-gray-300">Add destination</button>
                      {(governance.advanced?.securityDestinations || []).map((item) => <div key={item.id} className="flex justify-between gap-3 border border-gray-200 p-2 text-xs"><span><strong>{item.name}</strong><br />{item.lastDeliveryStatus || 'Not tested'}</span><button type="button" onClick={async () => { const result = await api.post(`/admin/permissions/security-destinations/${item.id}/test`, {}); toast(result.status === 'DELIVERED' ? 'success' : 'error', `Delivery ${result.status.toLowerCase()}`); await loadGovernance(); }} className="font-semibold text-gray-700">Test</button></div>)}
                    </GovernanceBlock>

                    <GovernanceBlock icon={TriangleAlert} title="Privilege analytics" description="Find dormant administrators, privilege accumulation, unused permissions, and expiring service identities.">
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="border border-gray-200 p-2"><strong className="block text-lg">{governance.advanced?.privilegeAnalytics?.dormantAdmins?.length || 0}</strong><span className="text-xs text-gray-500">dormant admins</span></div>
                        <div className="border border-gray-200 p-2"><strong className="block text-lg">{governance.advanced?.privilegeAnalytics?.privilegeCreep?.length || 0}</strong><span className="text-xs text-gray-500">broad access</span></div>
                        <div className="border border-gray-200 p-2"><strong className="block text-lg">{governance.advanced?.privilegeAnalytics?.unusedPermissions?.length || 0}</strong><span className="text-xs text-gray-500">unused permissions</span></div>
                        <div className="border border-gray-200 p-2"><strong className="block text-lg">{governance.advanced?.privilegeAnalytics?.expiringServiceAccounts?.length || 0}</strong><span className="text-xs text-gray-500">expiring identities</span></div>
                      </div>
                      <div className="max-h-36 overflow-y-auto border border-gray-200">
                        {(governance.advanced?.privilegeAnalytics?.riskScores || []).slice(0, 10).map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between border-b border-gray-100 p-2 text-xs">
                            <span>{item.email}<br /><span className="text-gray-500">{item.role}</span></span>
                            <strong className={item.level === 'HIGH' ? 'text-red-700' : item.level === 'MEDIUM' ? 'text-amber-700' : 'text-emerald-700'}>{item.score} {item.level}</strong>
                          </div>
                        ))}
                      </div>
                    </GovernanceBlock>

                    <GovernanceBlock icon={Download} title="Policy as code" description="Export or import versioned authorization configuration for review and deployment.">
                      <div className="flex gap-2">
                        <button type="button" onClick={exportPolicyBundle} className="inline-flex h-9 items-center gap-2 bg-gray-950 px-3 text-sm font-semibold text-white"><Download className="h-4 w-4" />Export</button>
                        <button type="button" onClick={downloadEvidencePack} className="inline-flex h-9 items-center gap-2 border border-gray-300 px-3 text-sm font-semibold"><FileText className="h-4 w-4" />Evidence pack</button>
                      </div>
                      <textarea value={policyBundleText} onChange={(event) => setPolicyBundleText(event.target.value)} placeholder="Paste a policy bundle JSON document" rows={5} className="w-full border border-gray-300 p-2 font-mono text-xs" />
                      <button type="button" disabled={!policyBundleText.trim()} onClick={importPolicyBundle} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white disabled:bg-gray-300">Import bundle</button>
                    </GovernanceBlock>

                    <GovernanceBlock icon={ShieldCheck} title="Contextual access" description="Apply network, country, trusted-device, and assurance conditions to sensitive permissions.">
                      <input value={contextPolicyDraft.name} onChange={(event) => setContextPolicyDraft({ ...contextPolicyDraft, name: event.target.value })} placeholder="Policy name" className="h-10 border border-gray-300 px-3 text-sm" />
                      <select value={contextPolicyDraft.targetValue} onChange={(event) => setContextPolicyDraft({ ...contextPolicyDraft, targetValue: event.target.value })} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                        <option value="">Target permission...</option>{permissions.map((permission) => <option key={permission.slug}>{permission.slug}</option>)}
                      </select>
                      <select value={contextPolicyDraft.effect} onChange={(event) => setContextPolicyDraft({ ...contextPolicyDraft, effect: event.target.value })} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                        <option value="ALLOW">Require matching context</option>
                        <option value="DENY">Block matching context</option>
                      </select>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input value={contextPolicyDraft.countries} onChange={(event) => setContextPolicyDraft({ ...contextPolicyDraft, countries: event.target.value })} placeholder="Countries: US, CA" className="h-10 border border-gray-300 px-3 text-sm" />
                        <input value={contextPolicyDraft.ipAddresses} onChange={(event) => setContextPolicyDraft({ ...contextPolicyDraft, ipAddresses: event.target.value })} placeholder="IPs/CIDRs" className="h-10 border border-gray-300 px-3 text-sm" />
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={contextPolicyDraft.trustedDevice} onChange={(event) => setContextPolicyDraft({ ...contextPolicyDraft, trustedDevice: event.target.checked })} /> Trusted device</label><label><input type="checkbox" checked={contextPolicyDraft.requireMfa} onChange={(event) => setContextPolicyDraft({ ...contextPolicyDraft, requireMfa: event.target.checked })} /> MFA assurance</label></div>
                      <button type="button" disabled={!contextPolicyDraft.name || !contextPolicyDraft.targetValue} onClick={createContextPolicy} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white disabled:bg-gray-300">Add policy</button>
                      {(governance.advanced?.contextualPolicies || []).slice(0, 6).map((item) => <div key={item.id} className="flex justify-between border border-gray-200 p-2 text-xs"><span><strong>{item.name}</strong><br />{item.effect} {item.targetValue}</span><button type="button" onClick={async () => { await api.delete(`/admin/permissions/contextual-policies/${item.id}`); await loadGovernance(); }} className="font-semibold text-red-700">Remove</button></div>)}
                    </GovernanceBlock>

                    <GovernanceBlock icon={Users} title="SCIM group mapping" description="Map identity-provider groups to application roles during provisioning.">
                      <input value={groupMappingDraft.externalGroupId} onChange={(event) => setGroupMappingDraft({ ...groupMappingDraft, externalGroupId: event.target.value })} placeholder="External group ID" className="h-10 border border-gray-300 px-3 text-sm" />
                      <input value={groupMappingDraft.externalGroupName} onChange={(event) => setGroupMappingDraft({ ...groupMappingDraft, externalGroupName: event.target.value })} placeholder="Group name" className="h-10 border border-gray-300 px-3 text-sm" />
                      <select value={groupMappingDraft.roleId} onChange={(event) => setGroupMappingDraft({ ...groupMappingDraft, roleId: event.target.value })} className="h-10 border border-gray-300 bg-white px-3 text-sm"><option value="">Mapped role...</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
                      <button type="button" disabled={!groupMappingDraft.externalGroupId || !groupMappingDraft.roleId} onClick={createGroupMapping} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white disabled:bg-gray-300">Save mapping</button>
                      {(governance.advanced?.scimGroupMappings || []).slice(0, 6).map((item) => <div key={item.id} className="flex justify-between border border-gray-200 p-2 text-xs"><span><strong>{item.externalGroupName || item.externalGroupId}</strong><br />{item.roleName || item.roleId}</span><button type="button" onClick={async () => { await api.delete(`/admin/permissions/scim-group-mappings/${item.id}`); await loadGovernance(); }} className="font-semibold text-red-700">Remove</button></div>)}
                    </GovernanceBlock>

                    <GovernanceBlock icon={UserCheck} title="Access request approvals" description="Review user-initiated requests for temporary permissions, roles, and resources.">
                      {(governance.advanced?.accessRequests || []).slice(0, 8).map((item) => <div key={item.id} className="border border-gray-200 p-2 text-xs"><div className="flex justify-between"><strong>{item.email}</strong><span>{item.status}</span></div><p className="text-gray-500">{item.requestType}: {item.permissionSlug || item.roleId || item.relationshipResourceId}</p>{item.status === 'PENDING' && <div className="mt-2 flex gap-2"><button type="button" onClick={async () => { await api.post(`/admin/permissions/access-requests/${item.id}/review`, { decision: 'APPROVED' }); await loadGovernance(); }} className="font-semibold text-emerald-700">Approve</button><button type="button" onClick={async () => { await api.post(`/admin/permissions/access-requests/${item.id}/review`, { decision: 'REJECTED' }); await loadGovernance(); }} className="font-semibold text-red-700">Reject</button></div>}</div>)}
                    </GovernanceBlock>

                    <GovernanceBlock icon={PlayCircle} title="Authorization test builder" description="Persist expected allow or deny decisions and rerun them after policy changes.">
                      <input value={authorizationTestDraft.name} onChange={(event) => setAuthorizationTestDraft({ ...authorizationTestDraft, name: event.target.value })} placeholder="Test name" className="h-10 border border-gray-300 px-3 text-sm" />
                      <div className="grid gap-2 sm:grid-cols-2"><select value={authorizationTestDraft.principalType} onChange={(event) => setAuthorizationTestDraft({ ...authorizationTestDraft, principalType: event.target.value, principalId: '' })} className="h-10 border border-gray-300 bg-white px-3 text-sm"><option value="ROLE">Role</option><option value="USER">User</option></select><select value={authorizationTestDraft.expectedDecision} onChange={(event) => setAuthorizationTestDraft({ ...authorizationTestDraft, expectedDecision: event.target.value })} className="h-10 border border-gray-300 bg-white px-3 text-sm"><option value="DENY">Expect deny</option><option value="ALLOW">Expect allow</option></select></div>
                      <select value={authorizationTestDraft.principalId} onChange={(event) => setAuthorizationTestDraft({ ...authorizationTestDraft, principalId: event.target.value })} className="h-10 border border-gray-300 bg-white px-3 text-sm"><option value="">Principal...</option>{(authorizationTestDraft.principalType === 'ROLE' ? roles : governance.users).map((item: any) => <option key={item.id} value={item.id}>{item.name || `${item.firstName} ${item.lastName}`}</option>)}</select>
                      <select value={authorizationTestDraft.permissionSlug} onChange={(event) => setAuthorizationTestDraft({ ...authorizationTestDraft, permissionSlug: event.target.value })} className="h-10 border border-gray-300 bg-white px-3 text-sm"><option value="">Permission...</option>{permissions.map((permission) => <option key={permission.slug}>{permission.slug}</option>)}</select>
                      <div className="flex gap-2"><button type="button" disabled={!authorizationTestDraft.name || !authorizationTestDraft.principalId || !authorizationTestDraft.permissionSlug} onClick={createAuthorizationTest} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white disabled:bg-gray-300">Add test</button><button type="button" onClick={runAuthorizationTests} className="h-9 border border-gray-300 px-3 text-sm font-semibold">Run all</button></div>
                      {authorizationTestResult && <p className="text-sm"><strong className="text-emerald-700">{authorizationTestResult.passed} passed</strong> · <strong className="text-red-700">{authorizationTestResult.failed} failed</strong></p>}
                    </GovernanceBlock>

                    <GovernanceBlock icon={TriangleAlert} title="Access alerts" description="Privilege escalation, dormant privileged accounts, and unused roles.">
                      <div className="space-y-2">
                        {governance.alerts.slice(0, 10).map((alert, index) => (
                          <div key={`${alert.type}-${alert.id || index}`} className="border border-gray-200 p-2 text-xs">
                            <div className="flex items-center justify-between gap-2"><strong>{String(alert.type).replaceAll('_', ' ')}</strong><span className={alert.severity === 'critical' ? 'text-red-700' : 'text-amber-700'}>{alert.severity}</span></div>
                            <p className="mt-1 text-gray-500">{alert.summary || alert.email || alert.name || alert.diff?.roleName || 'Review required'}</p>
                            {alert.alertType && <button type="button" onClick={async () => { await api.post(`/admin/permissions/alerts/${alert.id}/acknowledge`, {}); await loadGovernance(); }} className="mt-2 font-semibold text-gray-700">Acknowledge</button>}
                          </div>
                        ))}
                        {governance.alerts.length === 0 && <p className="text-sm text-gray-500">No current permission alerts.</p>}
                      </div>
                    </GovernanceBlock>

                    <GovernanceBlock icon={KeyRound} title="Service accounts" description="Create expiring API identities with explicit permissions and usage tracking.">
                      <input value={serviceAccountDraft.name} onChange={(event) => setServiceAccountDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Integration name" className="h-10 w-full border border-gray-300 px-3 text-sm" />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input type="date" value={serviceAccountDraft.expiresAt} onChange={(event) => setServiceAccountDraft((current) => ({ ...current, expiresAt: event.target.value }))} className="h-10 border border-gray-300 px-3 text-sm" />
                        <select value={serviceAccountDraft.scopeType} onChange={(event) => setServiceAccountDraft((current) => ({ ...current, scopeType: event.target.value }))} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                          {['ALL', 'ASSIGNED', 'LOCATION', 'CUSTOMERS'].map((value) => <option key={value}>{value}</option>)}
                        </select>
                      </div>
                      <div className="max-h-40 overflow-y-auto border border-gray-200 p-2">
                        {permissions.map((permission) => (
                          <label key={permission.slug} className="flex items-center gap-2 py-1 text-xs text-gray-700">
                            <input type="checkbox" checked={serviceAccountDraft.permissionSlugs.includes(permission.slug)} onChange={(event) => setServiceAccountDraft((current) => ({
                              ...current,
                              permissionSlugs: event.target.checked ? [...current.permissionSlugs, permission.slug] : current.permissionSlugs.filter((slug) => slug !== permission.slug),
                            }))} />
                            {permission.name}
                          </label>
                        ))}
                      </div>
                      <button type="button" onClick={createServiceAccount} disabled={!serviceAccountDraft.name || !serviceAccountDraft.permissionSlugs.length} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white disabled:bg-gray-300">Create service account</button>
                      {createdServiceToken && <div className="border border-red-200 bg-red-50 p-2 text-xs text-red-900"><strong>Shown once:</strong><code className="mt-1 block break-all">{createdServiceToken}</code></div>}
                      <div className="space-y-2">
                        {(governance.serviceAccounts || []).slice(0, 8).map((account) => (
                          <div key={account.id} className="flex items-center justify-between gap-3 border border-gray-200 p-2 text-xs">
                            <span><strong>{account.name}</strong><br />{account.permissionSlugs.length} permissions · last used {account.lastUsedAt ? new Date(account.lastUsedAt).toLocaleString() : 'never'}</span>
                            {account.isActive && <button type="button" onClick={async () => { await api.delete(`/admin/permissions/service-accounts/${account.id}`); await loadGovernance(); }} className="font-semibold text-red-700">Revoke</button>}
                          </div>
                        ))}
                      </div>
                    </GovernanceBlock>

                    {user?.role === 'SUPER_ADMIN' && (
                      <GovernanceBlock icon={ShieldCheck} title="Break-glass recovery" description="Designate MFA-protected emergency super-admin accounts and monitor every use.">
                        <select value={breakGlassDraft.userId} onChange={(event) => setBreakGlassDraft((current) => ({ ...current, userId: event.target.value }))} className="h-10 w-full border border-gray-300 bg-white px-3 text-sm">
                          <option value="">Select super admin...</option>
                          {governance.users.filter((item) => item.role === 'SUPER_ADMIN').map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName} - {item.email}</option>)}
                        </select>
                        <input value={breakGlassDraft.reason} onChange={(event) => setBreakGlassDraft((current) => ({ ...current, reason: event.target.value }))} placeholder="Recovery purpose and custody notes" className="h-10 w-full border border-gray-300 px-3 text-sm" />
                        <input value={breakGlassDraft.approvalRequestId} onChange={(event) => setBreakGlassDraft((current) => ({ ...current, approvalRequestId: event.target.value }))} placeholder="Approved BREAK GLASS ACTIVATE request ID" className="h-10 w-full border border-gray-300 px-3 text-sm" />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setBreakGlass(true)} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white">Enable</button>
                          <button type="button" onClick={() => setBreakGlass(false)} className="h-9 border border-red-300 px-3 text-sm font-semibold text-red-700">Disable</button>
                        </div>
                        {(governance.breakGlassAccounts || []).map((account) => <div key={account.id} className="border border-gray-200 p-2 text-xs"><strong>{account.firstName} {account.lastName}</strong><br />{account.email} · MFA {account.mfaEnabled ? 'enabled' : 'missing'} · last used {account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : 'never'}</div>)}
                      </GovernanceBlock>
                    )}

                    <GovernanceBlock icon={ShieldCheck} title="Authorization coverage" description="Deny-by-default CI status and authenticated routes still on the legacy baseline.">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="border border-gray-200 p-2"><strong className="block text-lg">{governance.authorizationCoverage?.coveragePercent || 0}%</strong><span className="text-xs text-gray-500">covered</span></div>
                        <div className="border border-gray-200 p-2"><strong className="block text-lg">{governance.authorizationCoverage?.permissionProtectedRoutes || 0}</strong><span className="text-xs text-gray-500">guarded</span></div>
                        <div className="border border-gray-200 p-2"><strong className="block text-lg">{governance.authorizationCoverage?.uncovered?.length || 0}</strong><span className="text-xs text-gray-500">baseline shown</span></div>
                      </div>
                      <p className="text-xs text-gray-600">{governance.authorizationCoverage?.authorizationMatrixCases || 0} generated role-by-route test cases across {(governance.authorizationCoverage?.matrixRoles || []).length} primary roles.</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="border border-gray-200 p-2 text-xs"><strong>Never enforced</strong><p className="mt-1 text-gray-500">{(governance.authorizationCoverage?.permissionsNeverEnforced || []).slice(0, 12).join(', ') || 'None'}</p></div>
                        <div className="border border-gray-200 p-2 text-xs"><strong>Unassigned</strong><p className="mt-1 text-gray-500">{(governance.authorizationCoverage?.permissionsUnassigned || []).slice(0, 12).join(', ') || 'None'}</p></div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <select value={reviewDraft.cadence} onChange={(event) => setReviewDraft((current) => ({ ...current, cadence: event.target.value }))} className="h-10 border border-gray-300 bg-white px-3 text-sm">
                          <option value="">One time</option><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option>
                        </select>
                        <input type="number" min="1" value={reviewDraft.reminderDays} onChange={(event) => setReviewDraft((current) => ({ ...current, reminderDays: Number(event.target.value) }))} className="h-10 border border-gray-300 px-3 text-sm" />
                        <input value={exportApprovalRequestId} onChange={(event) => setExportApprovalRequestId(event.target.value)} placeholder="AUDIT EXPORT approval ID" className="h-10 border border-gray-300 px-3 text-sm" />
                      </div>
                      <div className="max-h-52 overflow-y-auto border border-gray-200">
                        {(governance.authorizationCoverage?.uncovered || []).slice(0, 30).map((route: any) => <div key={`${route.file}-${route.line}`} className="border-b border-gray-100 p-2 text-xs"><code>{route.method} {route.controller}/{route.path}</code><br /><span className="text-gray-500">{route.file}:{route.line}</span></div>)}
                      </div>
                    </GovernanceBlock>

                    <GovernanceBlock icon={FileText} title="Access reviews" description="Certify or revoke user access and export review evidence.">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input value={reviewDraft.name} onChange={(event) => setReviewDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Quarterly access review" className="h-10 border border-gray-300 px-3 text-sm" />
                        <input type="date" value={reviewDraft.dueAt} onChange={(event) => setReviewDraft((current) => ({ ...current, dueAt: event.target.value }))} className="h-10 border border-gray-300 px-3 text-sm" />
                      </div>
                      <button type="button" disabled={!reviewDraft.name} onClick={createReview} className="h-9 bg-gray-950 px-3 text-sm font-semibold text-white disabled:bg-gray-300">Start review</button>
                      <div className="mt-3 space-y-2">
                        {governance.reviews.slice(0, 6).map((review) => (
                          <div key={review.id} className="border border-gray-200 p-2 text-xs">
                            <div className="flex items-center justify-between gap-2"><strong>{review.name}</strong><span>{review.status}</span></div>
                            <p className="mt-1 text-gray-500">{review.pendingCount || 0} pending of {review.itemCount || 0}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button type="button" onClick={() => openReview(review.id)} className="border border-gray-300 px-2 py-1 font-semibold">Open</button>
                              <button type="button" onClick={() => downloadReview(review.id, 'csv')} title="Download CSV" className="inline-flex items-center gap-1 border border-gray-300 px-2 py-1 font-semibold"><Download className="h-3 w-3" />CSV</button>
                              <button type="button" onClick={() => downloadReview(review.id, 'pdf')} title="Download PDF" className="inline-flex items-center gap-1 border border-gray-300 px-2 py-1 font-semibold"><Download className="h-3 w-3" />PDF</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </GovernanceBlock>
                  </div>

                  {selectedReview && (
                    <div className="border-t border-gray-200 pt-5">
                      <div className="flex items-center justify-between gap-3">
                        <div><h3 className="font-semibold text-gray-950">{selectedReview.name}</h3><p className="text-xs text-gray-500">{selectedReview.status}</p></div>
                        <button type="button" onClick={() => setSelectedReview(null)} title="Close review" className="p-2 text-gray-500 hover:text-gray-950"><X className="h-4 w-4" /></button>
                      </div>
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                          <thead><tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500"><th className="pb-2">User</th><th className="pb-2">Role</th><th className="pb-2">Last login</th><th className="pb-2">Decision</th></tr></thead>
                          <tbody>{selectedReview.items.map((item: any) => (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="py-2">{item.firstName} {item.lastName}<br /><span className="text-xs text-gray-500">{item.email}</span></td>
                              <td className="py-2">{item.role}</td>
                              <td className="py-2">{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                              <td className="py-2">{item.decision === 'PENDING' ? <div className="flex gap-2"><button type="button" onClick={() => decideReviewItem(item.id, 'CERTIFIED')} className="font-semibold text-emerald-700">Certify</button><button type="button" onClick={() => decideReviewItem(item.id, 'REVOKE')} className="font-semibold text-red-700">Revoke</button></div> : item.decision}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="sticky top-0 z-20 -mx-5 mt-5 border-y border-gray-200 bg-gray-50/95 px-5 py-3 backdrop-blur sm:-mx-7 sm:px-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <span className="sr-only">Search permissions</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by permission, slug, description, or group"
              className="h-10 w-full border border-gray-300 bg-white pl-9 pr-9 text-sm outline-none focus:border-emerald-600"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} title="Clear search" className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-900">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            Group
            <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} className="h-10 min-w-44 border border-gray-300 bg-white px-3 text-sm">
              <option value="ALL">All groups</option>
              {groups.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </label>
          <span className="text-sm text-gray-500">{filteredPermissions.length} shown</span>
        </div>
      </section>

      {roles.length === 0 || permissions.length === 0 ? (
        <div className="py-16 text-center">
          <CircleHelp className="mx-auto h-7 w-7 text-gray-400" />
          <p className="mt-3 text-sm font-semibold text-gray-900">Permission data is unavailable</p>
          <p className="mt-1 text-sm text-gray-500">Roles and permissions must both exist before assignments can be managed.</p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto border border-gray-200 bg-white">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="sticky left-0 z-10 min-w-[330px] bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700">Permission</th>
                {roles.map((role) => {
                  const visibleSlugs = filteredPermissions.map((permission) => permission.slug);
                  const selectedCount = visibleSlugs.filter((slug) => assigned[role.id]?.has(slug)).length;
                  const allSelected = visibleSlugs.length > 0 && selectedCount === visibleSlugs.length;
                  return (
                    <th key={role.id} className="min-w-[150px] border-l border-gray-200 px-3 py-3 text-center align-top">
                      <div className="font-semibold text-gray-950" title={(role.affectedUsers || []).map((item) => `${item.firstName} ${item.lastName} (${item.email})`).join('\n') || 'No assigned users'}>{role.name}</div>
                      <div className="mt-1 text-xs font-normal text-gray-500">{role.isSystem ? 'System role' : 'Custom role'} · {role._count?.userRoles || 0} users</div>
                      <button
                        type="button"
                        onClick={() => setPermissionsForRole(role.id, visibleSlugs, !allSelected)}
                        disabled={visibleSlugs.length === 0 || role.editable === false}
                        className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900 disabled:text-gray-400"
                      >
                        {allSelected ? 'Clear visible' : 'Select visible'}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedPermissions).map(([group, groupPermissions]) => {
                const collapsed = collapsedGroups.has(group);
                const slugs = groupPermissions.map((permission) => permission.slug);
                return [
                  <tr key={`${group}-header`} className="border-y border-gray-200 bg-gray-50">
                    <td className="sticky left-0 z-10 bg-gray-50 px-4 py-2">
                      <button type="button" onClick={() => toggleGroup(group)} className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-gray-700">
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {group}
                        <span className="font-normal text-gray-500">({groupPermissions.length})</span>
                      </button>
                    </td>
                    {roles.map((role) => {
                      const selectedCount = slugs.filter((slug) => assigned[role.id]?.has(slug)).length;
                      const allSelected = selectedCount === slugs.length;
                      return (
                        <td key={role.id} className="border-l border-gray-200 px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => setPermissionsForRole(role.id, slugs, !allSelected)}
                            disabled={role.editable === false}
                            className="text-xs font-semibold text-gray-600 hover:text-gray-950 disabled:text-gray-300"
                          >
                            {allSelected ? 'Clear group' : selectedCount ? `${selectedCount}/${slugs.length}` : 'Add group'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>,
                  ...(!collapsed ? groupPermissions.map((permission) => {
                    const enabledCount = roles.filter((role) => assigned[role.id]?.has(permission.slug)).length;
                    const enabledForAll = enabledCount === roles.length;
                    return (
                      <tr key={permission.id} className="border-b border-gray-100 hover:bg-gray-50/70">
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-gray-50">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-950">{permission.name}</p>
                              {permission.description && <p className="mt-0.5 text-xs leading-5 text-gray-500">{permission.description}</p>}
                              <code className="mt-1 inline-block text-xs text-gray-500">{permission.slug}</code>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPermissionForAllRoles(permission.slug, !enabledForAll)}
                              className="shrink-0 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                            >
                              {enabledForAll ? 'Clear all' : 'Grant all'}
                            </button>
                          </div>
                        </td>
                        {roles.map((role) => {
                          const checked = Boolean(assigned[role.id]?.has(permission.slug));
                          const changed = checked !== Boolean(baseline[role.id]?.has(permission.slug));
                          return (
                            <td key={role.id} className={`border-l border-gray-100 px-3 py-3 text-center ${changed ? 'bg-amber-50' : ''}`}>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={checked}
                                aria-label={`${permission.name} for ${role.name}`}
                                onClick={() => togglePermission(role.id, permission.slug)}
                                disabled={role.editable === false}
                                className={`relative inline-flex h-6 w-11 items-center border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${checked ? 'border-emerald-700 bg-emerald-700' : 'border-gray-300 bg-gray-200'}`}
                              >
                                <span className={`flex h-5 w-5 items-center justify-center bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}>
                                  {checked && <Check className="h-3 w-3 text-emerald-700" />}
                                </span>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }) : []),
                ];
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredPermissions.length === 0 && permissions.length > 0 && (
        <div className="border-x border-b border-gray-200 bg-white py-14 text-center text-sm text-gray-500">
          No permissions match the current filters.
        </div>
      )}

      <footer className="mt-4 flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <span>Amber cells contain unsaved changes. Super admins always bypass runtime permission checks.</span>
        <span>{changedRoleIds.length ? `${changedRoleIds.length} role${changedRoleIds.length === 1 ? '' : 's'} changed` : 'All changes saved'}</span>
      </footer>

      {pendingAnalyses && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="permission-warning-title" className="max-h-[85vh] w-full max-w-2xl overflow-y-auto border border-red-200 bg-white p-5 shadow-xl">
            <h2 id="permission-warning-title" className="text-lg font-semibold text-red-900">
              {pendingAnalyses.some((analysis) => analysis.requiresAcknowledgement) ? 'Critical permission removal' : 'Permission risk review'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">Review affected users, removed access, and risky privilege combinations before continuing.</p>
            <div className="mt-4 space-y-3">
              {pendingAnalyses.filter((analysis) => analysis.requiresAcknowledgement || analysis.risks.length).map((analysis) => (
                <div key={analysis.role.id} className="border border-gray-200 p-3">
                  <p className="font-semibold text-gray-950">{analysis.role.name}</p>
                  {analysis.criticalRemoved.length > 0 && <p className="mt-1 text-sm text-red-700">Critical removals: {analysis.criticalRemoved.join(', ')}</p>}
                  {analysis.affectedUsers.length > 0 && <p className="mt-1 text-sm text-gray-600">Affected active users: {analysis.affectedUsers.map((item) => `${item.firstName} ${item.lastName}`).join(', ')}</p>}
                  {analysis.impact && <p className="mt-1 text-sm text-gray-600">Impact: {analysis.impact.affectedUsers} users, {analysis.impact.activeSessions} active sessions, {analysis.impact.scimManagedUsers} SCIM-managed users, {analysis.impact.affectedServiceAccounts} service accounts.</p>}
                  {analysis.risks.map((risk) => <p key={risk.key} className="mt-1 text-sm text-amber-700">{risk.message}</p>)}
                  {analysis.missingDependencies?.map((item) => <p key={`${item.permission}-${item.dependency}`} className="mt-1 text-sm text-amber-700">{item.permission} also requires {item.dependency}.</p>)}
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingAnalyses(null)} className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button>
              <button type="button" onClick={() => persistChanges(true)} disabled={saving} className="bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? 'Saving...' : pendingAnalyses.some((analysis) => analysis.requiresAcknowledgement) ? 'Acknowledge and save' : 'Review and save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GovernanceBlock({ icon: Icon, title, description, children }: { icon: typeof KeyRound; title: string; description: string; children: ReactNode }) {
  return (
    <section className="border-t-2 border-gray-900 pt-3">
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 text-gray-700" />
        <div>
          <h2 className="text-sm font-semibold text-gray-950">{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-gray-500">{description}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function PermissionDiff({ title, slugs }: { title: string; slugs: string[] }) {
  return (
    <div className="border border-gray-200 p-3">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {slugs.map((slug) => <code key={slug} className="bg-gray-100 px-2 py-1 text-xs text-gray-700">{slug}</code>)}
        {slugs.length === 0 && <span className="text-xs text-gray-500">No unique permissions</span>}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof KeyRound; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 border-l-2 border-emerald-500 pl-4">
      <Icon className="h-5 w-5 text-emerald-700" />
      <div>
        <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
        <p className="mt-1 text-xl font-semibold text-gray-950">{value}</p>
      </div>
    </div>
  );
}

function stateFromRoles(roles: Role[]): PermissionState {
  return Object.fromEntries(roles.map((role) => [
    role.id,
    new Set((role.permissions || []).map((entry) => entry.permission?.slug).filter(Boolean)),
  ]));
}

function cloneState(state: PermissionState): PermissionState {
  return Object.fromEntries(Object.entries(state).map(([roleId, slugs]) => [roleId, new Set(slugs)]));
}

function setsEqual(left?: Set<string>, right?: Set<string>) {
  const a = left || new Set<string>();
  const b = right || new Set<string>();
  return a.size === b.size && Array.from(a).every((value) => b.has(value));
}
