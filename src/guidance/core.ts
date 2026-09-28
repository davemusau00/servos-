export interface GuideStep {
  id: string;
  title: string;
  description: string;
  interaction?: 'inform' | 'observe' | 'practice';
  target?: string;
  route?: { screen: string; resourceId?: string; tab?: string };
  articleId?: string;
  successOperations?: string[];
}

export interface GuideDefinition {
  id: string;
  version: number;
  title: string;
  description: string;
  permissions?: Permission[];
  steps: GuideStep[];
}

export const CORE_GUIDE: GuideDefinition = {
  id: 'servos.core',
  version: 1,
  title: 'Getting around ServOS',
  description: 'A short tour of your workspace and the tools that keep local operations moving.',
  permissions: ['help.view'],
  steps: [
    { id: 'workspace', title: 'Your workspace', description: 'Your available workspaces are listed here. ServOS only shows areas your staff account can access.', target: 'navigation.home' },
    { id: 'status', title: 'Local status', description: 'This status shows connectivity and queued changes. Sales and other enabled local operations continue when offline.', target: 'shell.status' },
    { id: 'help', title: 'Help when you need it', description: 'Open searchable operating instructions and return to this tour from Help.', target: 'shell.help', articleId: 'getting-started' },
    { id: 'staff', title: 'Staff session', description: 'Lock the terminal when handing it to another staff member. Each person signs in with their own PIN.', target: 'shell.lock', articleId: 'rbac' },
  ],
};

export const GUIDES: GuideDefinition[] = [CORE_GUIDE];
export const GUIDE_ANCHORS = new Set(['navigation.home', 'shell.status', 'shell.help', 'shell.lock', 'quick-add.open']);

export function validateGuides(guides: GuideDefinition[], knownAnchors: ReadonlySet<string> = GUIDE_ANCHORS): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const guide of guides) {
    if (!guide.id || ids.has(guide.id)) errors.push(`Duplicate or empty guide ID: ${guide.id}`);
    ids.add(guide.id);
    const stepIds = new Set<string>();
    for (const step of guide.steps) {
      if (!step.id || stepIds.has(step.id)) errors.push(`${guide.id}: duplicate or empty step ID ${step.id}`);
      stepIds.add(step.id);
      if (step.target && !knownAnchors.has(step.target)) errors.push(`${guide.id}/${step.id}: unknown guide anchor ${step.target}`);
    }
  }
  return errors;
}

const developmentMode = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);
if (developmentMode) {
  const errors = validateGuides(GUIDES);
  if (errors.length) throw new Error(`Invalid ServOS guides: ${errors.join('; ')}`);
}
import type { Permission } from '../types/runtime';
